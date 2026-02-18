import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";

// ── Signature verification ────────────────────────────────────────────────────
//
// PayMongo sends: Paymongo-Signature: t=<unix_ts>,te=<test_hmac>,li=<live_hmac>
// - In test mode, `te` is filled and `li` is empty.
// - In live mode, `li` is filled and `te` is empty.
// Verification: HMAC-SHA256( "<timestamp>.<rawBody>", webhookSecret )

function parseSigHeader(
  header: string
): { timestamp: string; sig: string } | null {
  const parts: Record<string, string> = {};
  header.split(",").forEach((pair) => {
    const idx = pair.indexOf("=");
    if (idx !== -1) {
      parts[pair.slice(0, idx).trim()] = pair.slice(idx + 1).trim();
    }
  });

  if (!parts.t) return null;
  // Prefer live sig; fall back to test sig
  const sig = parts.li?.length ? parts.li : parts.te;
  if (!sig) return null;

  return { timestamp: parts.t, sig };
}

function verifySignature(
  rawBody: string,
  sigHeader: string,
  secret: string
): boolean {
  const parsed = parseSigHeader(sigHeader);
  if (!parsed) return false;

  // Reject events older than 5 minutes (replay protection)
  const ageSeconds = Date.now() / 1000 - parseInt(parsed.timestamp, 10);
  if (ageSeconds > 300) return false;

  const message = `${parsed.timestamp}.${rawBody}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(message)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(parsed.sig, "utf8"),
      Buffer.from(expected, "utf8")
    );
  } catch {
    return false;
  }
}

// ── Plan limits ───────────────────────────────────────────────────────────────

const PLAN_SCAN_LIMITS: Record<string, number> = {
  starter: 30,
  pro: -1, // unlimited
};

// ── Webhook handler ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const secret = process.env.PAYMONGO_WEBHOOK_SECRET;
  if (!secret) {
    console.error("PAYMONGO_WEBHOOK_SECRET is not set");
    return NextResponse.json({ received: false }, { status: 500 });
  }

  // Read raw body BEFORE any parsing (required for HMAC verification)
  const rawBody = await req.text();
  const sigHeader = req.headers.get("Paymongo-Signature") ?? "";

  if (!verifySignature(rawBody, sigHeader, secret)) {
    console.warn("PayMongo webhook: invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Parse verified payload
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType: string = event?.data?.attributes?.type ?? "";

  // ── Handle checkout_session.payment.paid ──────────────────────────────────
  if (eventType === "checkout_session.payment.paid") {
    const csAttrs = event?.data?.attributes?.data?.attributes ?? {};

    // Extract user identity — try metadata first, fall back to billing email
    const metadata = csAttrs?.metadata as
      | { user_email?: string; plan?: string }
      | undefined;

    const userEmail: string | undefined =
      metadata?.user_email ?? csAttrs?.billing?.email;
    const plan: string | undefined = metadata?.plan;

    if (!userEmail || !plan || !(plan in PLAN_SCAN_LIMITS)) {
      console.error("Webhook: missing/invalid metadata", { userEmail, plan });
      // Return 200 so PayMongo doesn't keep retrying a bad payload
      return NextResponse.json({ received: true });
    }

    const scansLimit = PLAN_SCAN_LIMITS[plan];

    try {
      await dbConnect();
      await User.findOneAndUpdate(
        { email: userEmail },
        {
          plan,
          scansLimit,
          scansUsed: 0, // reset counter on successful payment
          billingCycleStart: new Date(),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`[PayMongo] Upgraded ${userEmail} → ${plan}`);
    } catch (err) {
      // Log but still ack — a DB retry won't come from PayMongo
      console.error("[PayMongo] DB update failed:", err);
    }
  }

  // Always acknowledge so PayMongo doesn't retry
  return NextResponse.json({ received: true });
}

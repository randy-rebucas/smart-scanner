import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/authOptions";

const PAYMONGO_API = "https://api.paymongo.com/v1";

// Prices in PHP centavos (100 centavos = ₱1.00)
export const PLAN_CHECKOUT_CONFIG = {
  starter: {
    name: "DocScan AI — Starter Plan",
    description: "30 document scans per 30-day billing cycle",
    amount: 49900, // ₱499.00 / month
  },
  pro: {
    name: "DocScan AI — Pro Plan",
    description: "Unlimited document scans per 30-day billing cycle",
    amount: 149900, // ₱1,499.00 / month
  },
} as const;

/** POST /api/subscription/checkout
 *  Creates a PayMongo Checkout Session and returns { url }.
 *  The client should redirect window.location.href to that URL.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { plan } = (await req.json()) as { plan?: string };

  if (plan !== "starter" && plan !== "pro") {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  if (!process.env.PAYMONGO_SECRET_KEY) {
    return NextResponse.json(
      { error: "Payment gateway not configured" },
      { status: 500 }
    );
  }

  const cfg = PLAN_CHECKOUT_CONFIG[plan];
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  // PayMongo expects Basic auth: base64("secret_key:")
  const encodedKey = Buffer.from(
    `${process.env.PAYMONGO_SECRET_KEY}:`
  ).toString("base64");

  const body = {
    data: {
      attributes: {
        billing: {
          name: session.user.name || session.user.email,
          email: session.user.email,
        },
        send_email_receipt: true,
        show_description: true,
        show_line_items: true,
        line_items: [
          {
            currency: "PHP",
            amount: cfg.amount,
            name: cfg.name,
            description: cfg.description,
            quantity: 1,
          },
        ],
        payment_method_types: ["card", "gcash", "paymaya", "grab_pay"],
        success_url: `${siteUrl}/payment/success?plan=${plan}`,
        cancel_url: `${siteUrl}/payment/cancel`,
        // metadata is forwarded through to webhook events
        metadata: {
          user_email: session.user.email,
          plan,
        },
      },
    },
  };

  try {
    const pmRes = await fetch(`${PAYMONGO_API}/checkout_sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Basic ${encodedKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!pmRes.ok) {
      const errBody = await pmRes.json().catch(() => ({}));
      console.error("PayMongo error:", errBody);
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 502 }
      );
    }

    const pmData = await pmRes.json();
    const checkoutUrl: string | undefined =
      pmData?.data?.attributes?.checkout_url;

    if (!checkoutUrl) {
      return NextResponse.json(
        { error: "PayMongo returned no checkout URL" },
        { status: 502 }
      );
    }

    return NextResponse.json({ url: checkoutUrl });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("checkout error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

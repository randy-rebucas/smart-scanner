import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/authOptions";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";

export const PLANS = {
  trial:   { name: "Free Trial", limit: 3,  monthly: false, pricePhp: 0    },
  starter: { name: "Starter",    limit: 30, monthly: true,  pricePhp: 499  },
  pro:     { name: "Pro",        limit: -1, monthly: true,  pricePhp: 1499 },
} as const;

export type PlanKey = keyof typeof PLANS;

/** GET /api/subscription — return the current user's plan info */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    // First-time OAuth user who hasn't hit analyze yet — return trial defaults
    return NextResponse.json({
      plan: "trial",
      planName: "Free Trial",
      scansUsed: 0,
      scansLimit: 3,
      isUnlimited: false,
      pricePhp: 0,
    });
  }

  const plan = (user.plan ?? "trial") as PlanKey;
  const cfg = PLANS[plan] ?? PLANS.trial;

  return NextResponse.json({
    plan,
    planName: cfg.name,
    scansUsed: user.scansUsed ?? 0,
    scansLimit: user.scansLimit ?? cfg.limit,
    isUnlimited: cfg.limit === -1,
    pricePhp: cfg.pricePhp,
  });
}

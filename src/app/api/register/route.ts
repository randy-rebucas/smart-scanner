import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { email, password, name } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }
  await dbConnect();
  const existing = await User.findOne({ email });
  if (existing) {
    return NextResponse.json({ error: "User already exists" }, { status: 409 });
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ email, password: hashed, name });
  return NextResponse.json({ user: { email: user.email, name: user.name, id: user._id } });
}

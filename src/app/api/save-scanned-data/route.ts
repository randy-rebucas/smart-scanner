import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/authOptions";
import { dbConnect } from "@/lib/mongodb";
import FormatedData from "@/models/FormatedData";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        await dbConnect();
        const docs = await FormatedData.find({ user: session.user.email }).sort({ createdAt: -1 });
        return NextResponse.json({ success: true, data: docs });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Failed to fetch data" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        // Validate body shape as needed
        await dbConnect();

        const doc = await FormatedData.create({
            ...body,
            user: session.user.email,
            createdAt: new Date(),
        });

        return NextResponse.json({ success: true, data: doc });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Failed to save data" }, { status: 500 });
    }
}

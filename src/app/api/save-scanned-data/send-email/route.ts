import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/authOptions";
import { dbConnect } from "@/lib/mongodb";
import FormatedData from "@/models/FormatedData";

function escapeHtml(str: string) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { id } = body;
        if (!id) return NextResponse.json({ error: "Missing document ID" }, { status: 400 });

        await dbConnect();
        const doc = await FormatedData.findOne({ _id: id, user: session.user.email }).lean();
        if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

        // Determine recipient
        // const to = session.user.email;
        const to = doc.entities?.emails?.[0] || session.user.email; // Send to first extracted email if available, otherwise fallback to user's email

        // Require SMTP config
        const host = process.env.SMTP_HOST;
        const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
        const user = process.env.SMTP_USER;
        const pass = process.env.SMTP_PASS;
        const from = process.env.SMTP_FROM || user;

        if (!host || !port || !user || !pass || !from) {
            return NextResponse.json({ error: "SMTP not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM." }, { status: 500 });
        }

        // Try to import nodemailer dynamically and send
        let nodemailer: any;
        try {
            nodemailer = await import("nodemailer");
        } catch (err) {
            return NextResponse.json({ error: "nodemailer not installed. Run `pnpm add nodemailer` or install your preferred mailer." }, { status: 500 });
        }

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: Number(process.env.SMTP_PORT) === 465,
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
            tls: { rejectUnauthorized: false },
        });

        // Verify SMTP connection before sending to provide clearer errors
        try {
            await transporter.verify();
        } catch (verifyErr: any) {
            return NextResponse.json({ error: `SMTP verification failed: ${verifyErr?.message || String(verifyErr)}` }, { status: 500 });
        }

        const subject = `DocScan AI — Scanned document ${doc._id}`;
        const jsonStr = JSON.stringify(doc, null, 2);
        const html = `<div style="font-family:system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;">
			<h2>Scanned document</h2>
			<p><strong>ID:</strong> ${escapeHtml(String(doc._id))}</p>
			<pre style="white-space:pre-wrap;word-break:break-word;background:#f6f8fa;padding:12px;border-radius:6px;color:#111">${escapeHtml(jsonStr)}</pre>
		</div>`;

        try {
            await transporter.sendMail({
                from,
                to,
                subject,
                html,
                attachments: [
                    {
                        filename: `document-${doc._id}.json`,
                        content: jsonStr,
                        contentType: "application/json",
                    },
                ],
            });
        } catch (sendErr: any) {
            return NextResponse.json({ error: `Send failed: ${sendErr?.message || String(sendErr)}` }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Failed to send email" }, { status: 500 });
    }
}


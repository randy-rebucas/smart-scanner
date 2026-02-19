import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/authOptions";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import { getTemplate, VALID_DOCUMENT_TYPES } from "@/lib/documentTemplates";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Scans that reset monthly (paid plans). Trial scans are lifetime.
const MONTHLY_PLANS = new Set(["starter", "pro"]);
const MS_PER_CYCLE = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function POST(req: NextRequest) {
  try {
    // ── Auth ────────────────────────────────────────────────────────────────
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const { imageBase64, mimeType } = await req.json();

    // ── User (upsert handles first-time GitHub OAuth users) ─────────────────
    await dbConnect();
    let user = await User.findOneAndUpdate(
      { email: session.user.email },
      {
        $setOnInsert: {
          email: session.user.email,
          name: session.user.name || "",
          plan: "trial",
          scansUsed: 0,
          scansLimit: 3,
        },
      },
      { upsert: true, new: true }
    );

    // ── Monthly billing-cycle reset for paid plans ──────────────────────────
    if (MONTHLY_PLANS.has(user.plan) && user.billingCycleStart) {
      const elapsed = Date.now() - new Date(user.billingCycleStart).getTime();
      if (elapsed >= MS_PER_CYCLE) {
        user = await User.findOneAndUpdate(
          { email: session.user.email },
          { scansUsed: 0, billingCycleStart: new Date() },
          { new: true }
        );
      }
    }

    // ── Scan-limit enforcement ──────────────────────────────────────────────
    const limit: number = user!.scansLimit ?? 3;
    const used: number = user!.scansUsed ?? 0;

    if (limit !== -1 && used >= limit) {
      return NextResponse.json(
        {
          error: "scan_limit_reached",
          plan: user!.plan,
          scansUsed: used,
          scansLimit: limit,
        },
        { status: 403 }
      );
    }

    // ── Pass 1: detect document type ────────────────────────────────────────
    const detectionResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a document classifier. Identify the document type from the image.
Respond with ONLY this JSON (no markdown, no extra text):
{"documentType": "<type>"}
Valid types: ${VALID_DOCUMENT_TYPES}`,
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${imageBase64}` },
            },
            { type: "text", text: "What type of document is this?" },
          ],
        },
      ],
      temperature: 0,
      max_tokens: 30,
    });

    const detectionRaw = detectionResponse.choices?.[0]?.message?.content || "{}";
    let detectedType = "other";
    try {
      const dt = JSON.parse(detectionRaw.replace(/```json?\n?/g, "").replace(/```\n?/g, "").trim());
      detectedType = dt.documentType || "other";
    } catch {
      // fall back to "other"
    }

    // ── Pass 2: extract structured data with the matching template ───────────
    const template = getTemplate(detectedType);
    const extractionPrompt = `${template.systemPrompt}

Return ONLY valid JSON in this exact structure:

${JSON.stringify(template.jsonStructure, null, 2)}

Only return valid JSON. No markdown, no code fences, no extra text.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: extractionPrompt },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${imageBase64}` },
            },
            {
              type: "text",
              text: "Extract all structured data from this document as JSON.",
            },
          ],
        },
      ],
      temperature: 0,
    });

    const content = response.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      const cleaned = content
        .replace(/```json?\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { rawText: content, error: "Failed to parse structured data" };
    }

    // ── Increment scan count on success ─────────────────────────────────────
    await User.updateOne(
      { email: session.user.email },
      { $inc: { scansUsed: 1 } }
    );

    return NextResponse.json(parsed);
  } catch (error: unknown) {
    console.error("analyze-document error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

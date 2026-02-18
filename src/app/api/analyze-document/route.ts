import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured" },
        { status: 500 }
      );
    }
    // ...existing code...
    const systemPrompt = `
You are a document analysis AI. Analyze the uploaded image and extract structured data.

1. Detect document type (invoice, receipt, ID, form, contract, business card, etc)
2. Extract all relevant structured fields.
3. Always attempt to extract the following personal fields if present, and include them in the "entities" object:
   - lastName (Surname)
   - firstName (Given Name)
   - middleName (Middle Initial)
   - gender (Sex/Gender)
   - birthdate (Date of Birth)
   - address

Return ONLY valid JSON in this exact structure:

{
  "documentType": "",
  "confidenceScore": 0-100,
  "metadata": {
    "detectedLanguage": "",
    "imageQuality": "low | medium | high"
  },
  "entities": {
    "personNames": [],
    "companyNames": [],
    "emails": [],
    "phoneNumbers": [],
    "addresses": [],
    "lastName": "",
    "firstName": "",
    "middleName": "",
    "gender": "",
    "birthdate": "",
    "address": ""
  },
  "financialData": {
    "invoiceNumber": "",
    "receiptNumber": "",
    "date": "",
    "dueDate": "",
    "subtotal": null,
    "tax": null,
    "total": null,
    "currency": ""
  },
  "items": [
    {
      "description": "",
      "quantity": null,
      "unitPrice": null,
      "total": null
    }
  ],
  "rawText": ""
}

Only return valid JSON. No markdown, no code fences, no extra text.
`;


    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Fast + vision capable
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
              },
            },
            {
              type: "text",
              text: "Analyze this document image and extract all structured data as JSON.",
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
      parsed = {
        rawText: content,
        error: "Failed to parse structured data",
      };
    }

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("analyze-document error:", error);

    return NextResponse.json(
      { error: error.message || "Unknown error" },
      { status: 500 }
    );
  }
}

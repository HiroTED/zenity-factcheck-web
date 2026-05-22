import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { article } = await req.json();

    if (!article || typeof article !== "string") {
      return NextResponse.json({ error: "Invalid request: article is required" }, { status: 400 });
    }

    const prompt = `
You are a fact-checking agent. Analyze the following article and return ONLY a JSON object with no other text.

Article:
${article}

Return this exact JSON format:
{
  "segments": [
    {"text": "exact text from article", "status": "accurate|incorrect|unverified", "correction": "correction if incorrect, otherwise omit this field"}
  ],
  "improvements": [
    "improvement suggestion 1",
    "improvement suggestion 2"
  ]
}

Rules:
- segments must cover the ENTIRE article text with no gaps
- status: "accurate" = verified correct, "incorrect" = wrong, "unverified" = could not verify
- corrections must be in Japanese
- improvements must be in Japanese
- Return ONLY the JSON, no other text
`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const result = message.content[0].type === "text" ? message.content[0].text : "";
    console.log("Anthropic result:", result);

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Anthropic API Error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { NextRequest, NextResponse } from "next/server";

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION ?? "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// us-east-1ではクロスリージョン推論プロファイル形式(us.*)を使用
const MODEL_ID = process.env.BEDROCK_MODEL_ID ?? "us.anthropic.claude-3-5-sonnet-20241022-v2:0";

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

    const command = new ConverseCommand({
      modelId: MODEL_ID,
      messages: [
        {
          role: "user",
          content: [{ text: prompt }],
        },
      ],
    });

    const response = await client.send(command);
    const result = response.output?.message?.content?.[0]?.text ?? "";

    console.log("Bedrock response:", result);
    return NextResponse.json({ result });
  } catch (error) {
    const err = error as any;
    console.error("Bedrock Error:", {
      message: err.message,
      code: err.Code || err.code,
      statusCode: err.$metadata?.httpStatusCode,
      requestId: err.$metadata?.requestId,
    });
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

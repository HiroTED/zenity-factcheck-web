import { BedrockAgentRuntimeClient, InvokeAgentCommand } from "@aws-sdk/client-bedrock-agent-runtime";
import { NextRequest, NextResponse } from "next/server";

const client = new BedrockAgentRuntimeClient({
  region: process.env.AWS_REGION ?? "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    sessionToken: process.env.AWS_SESSION_TOKEN,
  },
});

export async function POST(req: NextRequest) {
  try {
    const { article } = await req.json();

    if (!article || typeof article !== "string") {
      return NextResponse.json({ error: "Invalid request: article is required" }, { status: 400 });
    }

    const sessionId = Math.random().toString(36).substring(2, 18);

    const command = new InvokeAgentCommand({
      agentId: process.env.BEDROCK_AGENT_ID!,
      agentAliasId: process.env.BEDROCK_AGENT_ALIAS_ID!,
      sessionId,
      inputText: article,
    });

    const response = await client.send(command);

    let result = "";
    if (response.completion) {
      for await (const event of response.completion) {
        if (event.chunk?.bytes) {
          result += new TextDecoder().decode(event.chunk.bytes);
        }
      }
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Bedrock Agent Error:", JSON.stringify(error, null, 2));
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

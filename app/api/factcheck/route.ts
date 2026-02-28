import { BedrockAgentRuntimeClient, InvokeAgentCommand } from "@aws-sdk/client-bedrock-agent-runtime";
import { NextRequest, NextResponse } from "next/server";

const credentials =
  process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        ...(process.env.AWS_SESSION_TOKEN && { sessionToken: process.env.AWS_SESSION_TOKEN }),
      }
    : undefined; // fall back to SDK default credential chain (instance profile, env, etc.)

const client = new BedrockAgentRuntimeClient({
  region: process.env.AWS_REGION ?? "us-east-1",
  ...(credentials && { credentials }),
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
    const err = error as Record<string, unknown>;
    console.error("Bedrock Agent Error:", {
      name: err?.name,
      message: err?.message,
      code: err?.Code ?? err?.code,
      statusCode: err?.$metadata ? (err.$metadata as Record<string, unknown>)?.httpStatusCode : undefined,
      region: process.env.AWS_REGION ?? "us-east-1",
      agentId: process.env.BEDROCK_AGENT_ID ? "set" : "MISSING",
      agentAliasId: process.env.BEDROCK_AGENT_ALIAS_ID ? "set" : "MISSING",
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ? "set" : "MISSING",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ? "set" : "MISSING",
      sessionToken: process.env.AWS_SESSION_TOKEN ? "set" : "not set",
    });
    const message = err?.message ? String(err.message) : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

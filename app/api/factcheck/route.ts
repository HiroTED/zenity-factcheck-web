import { BedrockAgentRuntimeClient, InvokeAgentCommand } from "@aws-sdk/client-bedrock-agent-runtime";
import { NextRequest, NextResponse } from "next/server";

console.log("ENV CHECK:", {
  region: process.env.AWS_REGION,
  agentId: process.env.BEDROCK_AGENT_ID,
  aliasId: process.env.BEDROCK_AGENT_ALIAS_ID,
  accessKey: process.env.AWS_ACCESS_KEY_ID?.substring(0, 8),
  hasSecret: !!process.env.AWS_SECRET_ACCESS_KEY,
});const client = new BedrockAgentRuntimeClient({
  region: process.env.AWS_REGION ?? "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
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
        console.log("Event received:", JSON.stringify(Object.keys(event)));
        if (event.chunk?.bytes) {
          const text = new TextDecoder().decode(event.chunk.bytes);
          console.log("Chunk text:", text);
          result += text;
        }
      }
    }

    console.log("Final result:", result);
    return NextResponse.json({ result });
  } catch (error) {
    const err = error as any;
    console.error("Bedrock Agent Error FULL:", {
      message: err.message,
      code: err.Code || err.code,
      statusCode: err.$metadata?.httpStatusCode,
      requestId: err.$metadata?.requestId,
      response: err.$response,
      stack: err.stack
    });
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

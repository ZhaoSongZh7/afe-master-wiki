/**
 * AFE Relay Chat Lambda
 *
 * POST /chat
 * Body: { "message": "How do I get Bedrock access?", "history": [] }
 * Response: { "reply": "..." }
 *
 * - Pulls wiki context from S3 (if available)
 * - Sends the user's message + context to Bedrock (Claude Sonnet 4.5)
 * - Returns a formatted response
 */

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const bedrock = new BedrockRuntimeClient({ region: process.env.BEDROCK_REGION });
const s3 = new S3Client({});

const MODEL_ID = process.env.MODEL_ID;
const BUCKET_NAME = process.env.BUCKET_NAME;

const SYSTEM_PROMPT = `You are the AFE Relay assistant — a helpful guide for Amazon Future Engineer (AFE) interns.

Your job is to answer questions about:
- The AFE program (onboarding, logistics, benefits)
- AWS services and tooling
- Team norms and communication
- Handoff knowledge from past interns

Rules:
- Be concise and practical. Interns are busy.
- Format responses with markdown when it helps readability (bullet points, code blocks, headers).
- If you don't know something, say so clearly. Don't make things up.
- When relevant, suggest what the intern should search for or who to ask.
- Keep a friendly, supportive tone — you're their helpful teammate.`;

/**
 * Try to load wiki context from S3.
 * Files are stored as wiki-context.md in the bucket root.
 */
async function loadWikiContext() {
  try {
    const resp = await s3.send(
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: "wiki-context.md",
      })
    );
    return await resp.Body.transformToString();
  } catch (err) {
    // No context file yet — that's fine
    return null;
  }
}

export async function handler(event) {
  // Parse request
  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return response(400, { error: "Invalid JSON body" });
  }

  const message = (body.message || "").trim();
  if (!message) {
    return response(400, { error: "'message' field is required" });
  }

  // Build conversation history
  const history = Array.isArray(body.history) ? body.history : [];

  // Load wiki context from S3
  const wikiContext = await loadWikiContext();

  // Build the system prompt with wiki context if available
  let systemPrompt = SYSTEM_PROMPT;
  if (wikiContext) {
    systemPrompt += `\n\nHere is the current wiki knowledge base for reference:\n\n---\n${wikiContext}\n---`;
  }

  // Build messages array
  const messages = [
    ...history.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    { role: "user", content: message },
  ];

  // Call Bedrock
  try {
    const bedrockBody = JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    const command = new InvokeModelCommand({
      modelId: MODEL_ID,
      contentType: "application/json",
      accept: "application/json",
      body: bedrockBody,
    });

    const bedrockResp = await bedrock.send(command);
    const respBody = JSON.parse(new TextDecoder().decode(bedrockResp.body));
    const reply = respBody.content[0].text;

    return response(200, {
      reply,
      model: MODEL_ID,
      usage: respBody.usage,
    });
  } catch (err) {
    console.error("Bedrock error:", err);

    if (err.name === "ThrottlingException") {
      return response(429, {
        error: "Rate limit hit. Please wait a moment and try again.",
      });
    }

    return response(500, { error: "Failed to get response from AI model." });
  }
}

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
    body: JSON.stringify(body),
  };
}

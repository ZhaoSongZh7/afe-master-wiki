/**
 * AFE Relay Chat Lambda
 *
 * POST /chat
 * Body: { "message": "...", "history": [], "context": "..." }
 * Response: { "reply": "..." }
 *
 * - Accepts wiki context from the caller (Next.js frontend does the lookup)
 * - Falls back to S3 wiki-context.md if no context is passed
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

const SYSTEM_PROMPT = `You are Ask AFE, the Amazon Future Engineers wiki assistant.

You answer questions using the wiki content provided below. This content comes directly from the AFE intern handbook — treat it as the authoritative source.

Rules:
- Answer based on the wiki content provided. Present it directly and confidently.
- If the wiki content contains the answer, DO NOT say "I don't have this page" or "I can't find it." Just present the information.
- Be concise and practical. Interns are busy.
- Format responses with markdown when it helps readability.
- If the wiki content genuinely doesn't cover the question, say so and suggest where to look.
- Keep a friendly, supportive tone.`;

/**
 * Try to load wiki context from S3 as a fallback.
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
    return null;
  }
}

export async function handler(event) {
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

  const history = Array.isArray(body.history) ? body.history : [];

  // Prefer context passed from the frontend, fall back to S3
  const wikiContext = (body.context || "").trim() || await loadWikiContext();

  // Build system prompt with wiki context
  let systemPrompt = SYSTEM_PROMPT;
  if (wikiContext) {
    systemPrompt += `\n\nWIKI CONTENT:\n\n${wikiContext}`;
  } else {
    systemPrompt += `\n\nNo wiki content was found for this question. Answer based on general AFE intern knowledge, and let the user know the wiki doesn't cover this topic yet.`;
  }

  const messages = [
    ...history.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    { role: "user", content: message },
  ];

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

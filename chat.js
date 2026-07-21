/**
 * AFE Relay Chat API client
 * Import this in your frontend components to talk to the chatbot.
 *
 * Usage:
 *   import { sendMessage } from "./chat.js";
 *   const { reply } = await sendMessage("How do I get Bedrock access?", history);
 */

const API_URL = "https://f391uenu7a.execute-api.us-east-1.amazonaws.com/prod/chat";

/**
 * Send a message to the AFE Relay chatbot.
 * @param {string} message - The user's message
 * @param {Array<{role: string, content: string}>} history - Previous conversation turns
 * @returns {Promise<{reply: string, usage: object}>}
 */
export async function sendMessage(message, history = []) {
  const resp = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
  });

  const data = await resp.json();

  if (!resp.ok) {
    throw new Error(data.error || `HTTP ${resp.status}`);
  }

  return data;
}

// Run directly: node chat.js
const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/^.*\//, ""));
if (isMain) {
  const message = process.argv[2] || "Hello, what can you help me with?";
  console.log(`Sending: "${message}"\n`);
  const { reply } = await sendMessage(message);
  console.log(`Reply:\n${reply}`);
}

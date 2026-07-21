/**
 * Slack → Wiki Pipeline (v3 — Surgical Edits)
 *
 * Fetches recent messages from a Slack channel, uses Bedrock (Claude) to:
 * 1. Identify wiki-worthy content
 * 2. Check if it relates to an existing wiki page
 * 3. Either EDIT (surgically) an existing page or CREATE a new one
 * 4. Include reasoning and confidence in the PR description
 *
 * For edits, the AI outputs specific patches (find/replace pairs) rather than
 * rewriting the entire page, so diffs stay minimal and readable.
 *
 * Usage:
 *   pnpm slack:scrape
 *
 * Environment variables (loaded from .env.local):
 *   SLACK_BOT_TOKEN, SLACK_CHANNEL_ID
 *   AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION
 *   GITHUB_TOKEN
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Load .env.local manually (Next.js only does this for dev/build)
function loadEnvLocal() {
  try {
    const envPath = resolve(process.cwd(), '.env.local');
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const match = trimmed.match(/^([^=]+)=\s*"?([^"]*)"?\s*$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2];
      }
    }
  } catch {
    // .env.local doesn't exist, rely on exported vars
  }
}

loadEnvLocal();

import {
  BedrockRuntimeClient,
  ConverseCommand,
} from '@aws-sdk/client-bedrock-runtime';

// --- Config ---

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_CHANNEL_ID = process.env.SLACK_CHANNEL_ID;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const AWS_REGION = process.env.AWS_REGION ?? 'us-east-1';
const MODEL_ID = process.env.BEDROCK_MODEL_ID ?? 'us.anthropic.claude-sonnet-4-5-20250929-v1:0';

const GITHUB_OWNER = 'ZhaoSongZh7';
const GITHUB_REPO = 'afe-relay';
const GITHUB_BRANCH = 'main';
const CONTENT_PATH = 'content/docs';

// How far back to look (in hours)
const LOOKBACK_HOURS = 24;

// --- Validation ---

function validateEnv() {
  const missing: string[] = [];
  if (!SLACK_BOT_TOKEN) missing.push('SLACK_BOT_TOKEN');
  if (!SLACK_CHANNEL_ID) missing.push('SLACK_CHANNEL_ID');
  if (!GITHUB_TOKEN) missing.push('GITHUB_TOKEN');
  if (!process.env.AWS_ACCESS_KEY_ID) missing.push('AWS_ACCESS_KEY_ID');
  if (!process.env.AWS_SECRET_ACCESS_KEY) missing.push('AWS_SECRET_ACCESS_KEY');

  if (missing.length > 0) {
    console.error(`Missing environment variables: ${missing.join(', ')}`);
    console.error('Make sure .env.local is loaded or variables are exported.');
    process.exit(1);
  }
}

// --- Slack API ---

interface SlackMessage {
  text: string;
  ts: string;
}

async function fetchRecentMessages(): Promise<SlackMessage[]> {
  const oldest = Math.floor((Date.now() - LOOKBACK_HOURS * 60 * 60 * 1000) / 1000);

  const url = new URL('https://slack.com/api/conversations.history');
  url.searchParams.set('channel', SLACK_CHANNEL_ID!);
  url.searchParams.set('oldest', oldest.toString());
  url.searchParams.set('limit', '100');

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${SLACK_BOT_TOKEN}` },
  });

  const data = await res.json();

  if (!data.ok) {
    throw new Error(`Slack API error: ${data.error}`);
  }

  const messages = (data.messages as SlackMessage[])
    .filter((m) => m.text && m.text.trim().length > 10 && !m.text.startsWith('has renamed'))
    .reverse();

  return messages;
}

// --- GitHub API ---

function githubHeaders() {
  return {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };
}

function repoUrl(path: string) {
  return `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/${path}`;
}

async function getBaseSha(): Promise<string> {
  const res = await fetch(repoUrl(`git/ref/heads/${GITHUB_BRANCH}`), {
    headers: githubHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to get base branch: ${await res.text()}`);
  const data = await res.json();
  return data.object.sha;
}

async function createBranch(name: string): Promise<void> {
  const sha = await getBaseSha();
  const res = await fetch(repoUrl('git/refs'), {
    method: 'POST',
    headers: githubHeaders(),
    body: JSON.stringify({ ref: `refs/heads/${name}`, sha }),
  });
  if (!res.ok) throw new Error(`Failed to create branch: ${await res.text()}`);
}

async function getFileContent(path: string): Promise<{ sha: string; content: string } | null> {
  const res = await fetch(repoUrl(`contents/${path}?ref=${GITHUB_BRANCH}`), {
    headers: githubHeaders(),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to get file: ${await res.text()}`);
  const data = await res.json();
  return {
    sha: data.sha,
    content: Buffer.from(data.content, 'base64').toString('utf-8'),
  };
}

async function commitFile(params: {
  path: string;
  content: string;
  message: string;
  branch: string;
  sha?: string;
}): Promise<void> {
  const body: Record<string, string> = {
    message: params.message,
    content: Buffer.from(params.content).toString('base64'),
    branch: params.branch,
  };
  if (params.sha) body.sha = params.sha;

  const res = await fetch(repoUrl(`contents/${params.path}`), {
    method: 'PUT',
    headers: githubHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Failed to commit: ${await res.text()}`);
}

async function createPR(params: {
  title: string;
  body: string;
  branch: string;
}): Promise<string> {
  const res = await fetch(repoUrl('pulls'), {
    method: 'POST',
    headers: githubHeaders(),
    body: JSON.stringify({
      title: params.title,
      body: params.body,
      head: params.branch,
      base: GITHUB_BRANCH,
    }),
  });
  if (!res.ok) throw new Error(`Failed to create PR: ${await res.text()}`);
  const data = await res.json();
  return data.html_url;
}

/** Fetch all existing wiki pages for context */
async function fetchExistingPages(): Promise<{ slug: string; title: string; description: string; content: string }[]> {
  const res = await fetch(repoUrl(`contents/${CONTENT_PATH}?ref=${GITHUB_BRANCH}`), {
    headers: githubHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to list content: ${await res.text()}`);
  const files: { name: string; path: string }[] = await res.json();

  const pages: { slug: string; title: string; description: string; content: string }[] = [];

  for (const file of files) {
    if (!file.name.endsWith('.mdx') || file.name === 'index.mdx') continue;

    const slug = file.name.replace('.mdx', '');
    const fileData = await getFileContent(file.path);
    if (!fileData) continue;

    const { frontmatter, body } = splitFrontmatter(fileData.content);
    const title = frontmatter.match(/^title:\s*(.+)$/m)?.[1] ?? slug;
    const description = frontmatter.match(/^description:\s*(.+)$/m)?.[1] ?? '';

    pages.push({ slug, title, description, content: body });
  }

  return pages;
}

function splitFrontmatter(raw: string): { frontmatter: string; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { frontmatter: '', body: raw };
  return { frontmatter: match[1], body: match[2] };
}

// --- Bedrock AI ---

interface EditPatch {
  find: string;
  replace: string;
}

interface WikiActionCreate {
  action: 'create';
  title: string;
  slug: string;
  description: string;
  content: string;
  reasoning: string;
  confidence: 'high' | 'medium' | 'low';
  source_messages: string[];
  conflict_detected: boolean;
  conflict_details?: string;
}

interface WikiActionEdit {
  action: 'edit';
  title: string;
  target_slug: string;
  patches: EditPatch[];
  reasoning: string;
  confidence: 'high' | 'medium' | 'low';
  source_messages: string[];
  conflict_detected: boolean;
  conflict_details?: string;
}

type WikiAction = WikiActionCreate | WikiActionEdit;

async function analyzeAndDecide(
  messages: SlackMessage[],
  existingPages: { slug: string; title: string; description: string; content: string }[],
): Promise<WikiAction[]> {
  const bedrock = new BedrockRuntimeClient({ region: AWS_REGION });

  const messagesText = messages
    .map((m, i) => `[${i + 1}] ${m.text}`)
    .join('\n');

  const pagesContext = existingPages
    .map((p) => `### Page: "${p.title}" (slug: ${p.slug})\n${p.content}`)
    .join('\n\n---\n\n');

  const prompt = `You are a wiki curator for the Amazon Future Engineers (AFE) intern handbook.

You have two inputs:
1. Recent messages from an intern Slack channel
2. The FULL content of all current wiki pages

Your job: identify wiki-worthy messages and decide whether to CREATE a new page or EDIT an existing one.

## SLACK MESSAGES

${messagesText}

## EXISTING WIKI PAGES (FULL CONTENT)

${pagesContext}

## DECISION CRITERIA

**EDIT an existing page when:**
- The Slack message adds useful information to a topic already covered
- The message contains updated/corrected info that conflicts with current wiki content
- The message provides a tip or detail that belongs under an existing page's scope

**CREATE a new page when:**
- The topic is genuinely new and doesn't fit any existing page
- The information is substantial enough to warrant its own page

**SKIP (don't include) when:**
- The message is small talk, a question without an answer, or a joke
- The information is already accurately covered in the wiki
- The message is too vague or unverifiable to be useful

## OUTPUT FORMAT

Respond with a JSON array (NO markdown fences, NO explanation outside the JSON).

### For CREATE actions:
{
  "action": "create",
  "title": "Page title",
  "slug": "url-slug",
  "description": "One-sentence description",
  "content": "Full markdown content for the new page",
  "reasoning": "2-3 sentences explaining why this is a new page",
  "confidence": "high" | "medium" | "low",
  "source_messages": ["1", "3"],
  "conflict_detected": false,
  "conflict_details": ""
}

### For EDIT actions (SURGICAL PATCHES):
{
  "action": "edit",
  "title": "Name of the page being edited",
  "target_slug": "slug-of-page-to-edit",
  "patches": [
    {
      "find": "exact text from the current page to find (copy verbatim, including formatting)",
      "replace": "the replacement text (with the new info integrated)"
    }
  ],
  "reasoning": "2-3 sentences explaining what new info this adds and why it belongs here",
  "confidence": "high" | "medium" | "low",
  "source_messages": ["2"],
  "conflict_detected": true/false,
  "conflict_details": "If conflict, explain old vs new info"
}

## CRITICAL RULES FOR EDIT PATCHES

1. The "find" field must be an EXACT substring from the existing page — copy it character-for-character including markdown formatting, dashes, asterisks, etc.
2. The "replace" field should contain ONLY the replacement for that specific substring. Keep it minimal.
3. Only change what needs to change. If you're adding a new bullet point, find the surrounding bullets and include them for context, then add the new one.
4. If you're adding a new section, use "find" to match the end of the section above it, and "replace" with that same text PLUS your new section appended.
5. Each patch should be as small as possible — ideally just a line or two of context around the change.
6. DO NOT rewrite paragraphs that don't need changes. Only touch what the new information requires.

## EXAMPLE EDIT PATCH

If the wiki says:
\`- **Photo ID** — required for badge issuance and building access.\`

And a Slack message says "bring your passport or two forms of ID, driver's license alone wasn't enough":

{
  "action": "edit",
  "title": "Before Day One",
  "target_slug": "before-day-one",
  "patches": [
    {
      "find": "- **Photo ID** — required for badge issuance and building access.",
      "replace": "- **Photo ID** — required for badge issuance and building access. A driver's license alone may not be sufficient — bring your passport or two forms of government-issued ID."
    }
  ],
  "reasoning": "A Slack message reported that a driver's license alone was not enough for badge issuance. This updates the existing photo ID guidance with more specific requirements.",
  "confidence": "medium",
  "source_messages": ["7"],
  "conflict_detected": true,
  "conflict_details": "Current page says 'photo ID' generically. Slack message indicates a single driver's license may not be accepted — passport or two forms of ID are needed."
}

## CONFIDENCE LEVELS
- **high**: Clear, specific, actionable info (e.g., "the shuttle runs every 15 min")
- **medium**: Likely accurate but from a single source
- **low**: Anecdotal or could be personal experience

If no messages are wiki-worthy, return an empty array: []`;

  const response = await bedrock.send(
    new ConverseCommand({
      modelId: MODEL_ID,
      messages: [
        {
          role: 'user',
          content: [{ text: prompt }],
        },
      ],
      inferenceConfig: {
        maxTokens: 8000,
        temperature: 0.1,
      },
    }),
  );

  const outputText = response.output?.message?.content?.[0]?.text ?? '[]';

  try {
    const cleaned = outputText.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '');
    const actions: WikiAction[] = JSON.parse(cleaned);
    return actions;
  } catch {
    console.error('Failed to parse AI response:', outputText.slice(0, 500));
    return [];
  }
}

// --- Patch Application ---

function applyPatches(content: string, patches: EditPatch[]): { result: string; applied: number; failed: string[] } {
  let result = content;
  let applied = 0;
  const failed: string[] = [];

  for (const patch of patches) {
    if (result.includes(patch.find)) {
      result = result.replace(patch.find, patch.replace);
      applied++;
    } else {
      // Try a more lenient match (trim whitespace differences)
      const normalizedContent = result.replace(/\r\n/g, '\n');
      const normalizedFind = patch.find.replace(/\r\n/g, '\n');

      if (normalizedContent.includes(normalizedFind)) {
        result = normalizedContent.replace(normalizedFind, patch.replace);
        applied++;
      } else {
        failed.push(patch.find.slice(0, 80) + '...');
      }
    }
  }

  return { result, applied, failed };
}

// --- PR Body Builder ---

function buildPRBody(action: WikiAction): string {
  const lines: string[] = [];

  if (action.action === 'create') {
    lines.push('## New Wiki Page from Slack');
    lines.push('');
    lines.push(`This PR creates a new wiki page based on messages from \`#intern-help\`.`);
  } else {
    lines.push('## Wiki Update from Slack');
    lines.push('');
    lines.push(`This PR updates the existing wiki page **${action.title}** (\`${action.target_slug}\`) with new information from \`#intern-help\`.`);
  }

  lines.push('');
  lines.push('---');
  lines.push('');

  // Reasoning
  lines.push('### Why this change');
  lines.push('');
  lines.push(action.reasoning);
  lines.push('');

  // Conflict flag
  if (action.conflict_detected) {
    lines.push('### ⚠️ Conflict Detected');
    lines.push('');
    lines.push(action.conflict_details || 'Potentially outdated information was found and updated.');
    lines.push('');
    lines.push('> **Please verify** this change is accurate before merging.');
    lines.push('');
  }

  // Confidence
  const confidenceEmoji = { high: '🟢', medium: '🟡', low: '🔴' };
  lines.push(`### Confidence: ${confidenceEmoji[action.confidence]} ${action.confidence.charAt(0).toUpperCase() + action.confidence.slice(1)}`);
  lines.push('');
  if (action.confidence === 'low') {
    lines.push('> This is based on anecdotal information. Consider verifying before merging.');
    lines.push('');
  } else if (action.confidence === 'medium') {
    lines.push('> Based on a single source. Likely accurate but worth a quick sanity check.');
    lines.push('');
  }

  // Source
  lines.push(`**Source messages:** #${action.source_messages.join(', #')}`);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('*Generated by Relay Wiki Bot*');

  return lines.join('\n');
}

// --- Main ---

async function main() {
  validateEnv();

  console.log(`\n📡 Fetching messages from the last ${LOOKBACK_HOURS}h...`);
  const messages = await fetchRecentMessages();

  if (messages.length === 0) {
    console.log('No messages found in the specified timeframe.');
    return;
  }

  console.log(`Found ${messages.length} messages.`);
  console.log(`\n📚 Loading existing wiki pages for context...`);

  const existingPages = await fetchExistingPages();
  console.log(`Loaded ${existingPages.length} existing pages.`);

  console.log(`\n🤖 Analyzing messages with AI...\n`);

  const actions = await analyzeAndDecide(messages, existingPages);

  if (actions.length === 0) {
    console.log('No wiki-worthy content identified.');
    return;
  }

  console.log(`AI identified ${actions.length} action(s):\n`);

  for (const action of actions) {
    const icon = action.action === 'create' ? '📄' : '✏️';
    const conflict = action.conflict_detected ? ' ⚠️ CONFLICT' : '';
    const patchCount = action.action === 'edit' ? ` (${action.patches.length} patch${action.patches.length > 1 ? 'es' : ''})` : '';
    console.log(`  ${icon} [${action.action.toUpperCase()}] "${action.title}" (${action.confidence} confidence)${patchCount}${conflict}`);
    console.log(`     Reasoning: ${action.reasoning.slice(0, 120)}...`);
    console.log('');
  }

  console.log('Creating PRs...\n');

  for (const action of actions) {
    try {
      if (action.action === 'create') {
        await handleCreate(action);
      } else {
        await handleEdit(action);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ❌ [ERROR] "${action.title}" — ${msg}`);
    }
  }

  console.log('\n✅ Done!');
}

async function handleCreate(action: WikiActionCreate) {
  const filePath = `${CONTENT_PATH}/${action.slug}.mdx`;

  const existing = await getFileContent(filePath);
  if (existing) {
    console.log(`  ⏭️  [SKIP] "${action.title}" — page already exists`);
    return;
  }

  const branchName = `wiki/slack-create-${action.slug}-${Date.now()}`;
  const fileContent = [
    '---',
    `title: ${action.title}`,
    `description: ${action.description}`,
    '---',
    '',
    action.content,
    '',
  ].join('\n');

  await createBranch(branchName);
  await commitFile({
    path: filePath,
    content: fileContent,
    message: `docs: add ${action.title} (from Slack)`,
    branch: branchName,
  });

  const prUrl = await createPR({
    title: `[Slack → Wiki] New: ${action.title}`,
    body: buildPRBody(action),
    branch: branchName,
  });

  console.log(`  📄 [CREATED] "${action.title}" → ${prUrl}`);
}

async function handleEdit(action: WikiActionEdit) {
  const filePath = `${CONTENT_PATH}/${action.target_slug}.mdx`;

  const existing = await getFileContent(filePath);
  if (!existing) {
    console.log(`  ⏭️  [SKIP] "${action.title}" — target page "${action.target_slug}" not found`);
    return;
  }

  // Apply patches to the raw file content (including frontmatter)
  const { result: patchedContent, applied, failed } = applyPatches(existing.content, action.patches);

  if (applied === 0) {
    console.log(`  ⚠️  [SKIP] "${action.title}" — no patches could be applied (find text not matched)`);
    if (failed.length > 0) {
      console.log(`     Failed to find: ${failed[0]}`);
    }
    return;
  }

  if (failed.length > 0) {
    console.log(`  ⚠️  "${action.title}" — ${applied} patch(es) applied, ${failed.length} failed`);
  }

  const branchName = `wiki/slack-edit-${action.target_slug}-${Date.now()}`;

  await createBranch(branchName);
  await commitFile({
    path: filePath,
    content: patchedContent,
    message: `docs: update ${action.title} (from Slack)`,
    branch: branchName,
    sha: existing.sha,
  });

  const conflictTag = action.conflict_detected ? ' ⚠️' : '';
  const prUrl = await createPR({
    title: `[Slack → Wiki] Update: ${action.title}${conflictTag}`,
    body: buildPRBody(action),
    branch: branchName,
  });

  console.log(`  ✏️  [UPDATED] "${action.title}" (${applied} patch${applied > 1 ? 'es' : ''}) → ${prUrl}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

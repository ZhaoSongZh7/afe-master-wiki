import { gitConfig } from './shared';

const GITHUB_API = 'https://api.github.com';

function getToken() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN is not configured');
  return token;
}

function headers() {
  return {
    Authorization: `Bearer ${getToken()}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };
}

function repoUrl(path: string) {
  return `${GITHUB_API}/repos/${gitConfig.owner}/${gitConfig.repo}/${path}`;
}

/**
 * Get the SHA of the latest commit on the base branch.
 */
async function getBaseBranchSha(): Promise<string> {
  const res = await fetch(repoUrl(`git/ref/heads/${gitConfig.branch}`), {
    headers: headers(),
  });
  if (!res.ok) throw new Error(`Failed to get base branch: ${await res.text()}`);
  const data = await res.json();
  return data.object.sha;
}

/**
 * Create a new branch from the base branch.
 */
async function createBranch(branchName: string): Promise<void> {
  const sha = await getBaseBranchSha();
  const res = await fetch(repoUrl('git/refs'), {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      ref: `refs/heads/${branchName}`,
      sha,
    }),
  });
  if (!res.ok) throw new Error(`Failed to create branch: ${await res.text()}`);
}

/**
 * Get the current file content and SHA (needed for updates).
 * Returns null if the file does not exist.
 */
async function getFileContent(
  path: string,
  branch: string,
): Promise<{ sha: string; content: string } | null> {
  const res = await fetch(repoUrl(`contents/${path}?ref=${branch}`), {
    headers: headers(),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to get file: ${await res.text()}`);
  const data = await res.json();
  return {
    sha: data.sha,
    content: Buffer.from(data.content, 'base64').toString('utf-8'),
  };
}

/**
 * Create or update a file on a given branch.
 */
async function commitFile(params: {
  path: string;
  content: string;
  message: string;
  branch: string;
  existingSha?: string;
}): Promise<void> {
  const body: Record<string, string> = {
    message: params.message,
    content: Buffer.from(params.content).toString('base64'),
    branch: params.branch,
  };
  if (params.existingSha) {
    body.sha = params.existingSha;
  }

  const res = await fetch(repoUrl(`contents/${params.path}`), {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Failed to commit file: ${await res.text()}`);
}

/**
 * Create a pull request from a branch to the base branch.
 */
async function createPullRequest(params: {
  title: string;
  body: string;
  branch: string;
}): Promise<{ url: string; number: number }> {
  const res = await fetch(repoUrl('pulls'), {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      title: params.title,
      body: params.body,
      head: params.branch,
      base: gitConfig.branch,
    }),
  });
  if (!res.ok) throw new Error(`Failed to create PR: ${await res.text()}`);
  const data = await res.json();
  return { url: data.html_url, number: data.number };
}

/**
 * Update the meta.json file to include a new page slug.
 */
async function addToMeta(slug: string, branch: string): Promise<void> {
  const metaPath = `${gitConfig.contentPath}/meta.json`;
  const existing = await getFileContent(metaPath, branch);
  if (!existing) return;

  const meta = JSON.parse(existing.content);
  if (Array.isArray(meta.pages) && !meta.pages.includes(slug)) {
    meta.pages.push(slug);
  }

  await commitFile({
    path: metaPath,
    content: JSON.stringify(meta, null, 2) + '\n',
    message: `docs: add ${slug} to navigation`,
    branch,
    existingSha: existing.sha,
  });
}

// --- Public API ---

export type EditPageParams = {
  slug: string;
  title: string;
  content: string;
  description?: string;
};

export type CreatePageParams = {
  slug: string;
  title: string;
  content: string;
  description?: string;
  icon?: string;
};

/**
 * Edit an existing page: creates a branch, commits the update, opens a PR.
 */
export async function editPage(params: EditPageParams) {
  const branchName = `wiki/edit-${params.slug}-${Date.now()}`;
  const filePath = `${gitConfig.contentPath}/${params.slug}.mdx`;

  // Get existing file SHA from the base branch
  const existing = await getFileContent(filePath, gitConfig.branch);
  if (!existing) {
    throw new Error(`Page "${params.slug}" not found in repository`);
  }

  // Preserve original frontmatter, only update title/description if changed
  const { frontmatter: originalFm } = splitFrontmatter(existing.content);
  let updatedFm = originalFm;

  // Update title in frontmatter if it changed
  if (params.title) {
    updatedFm = updatedFm.replace(/^title:.*$/m, `title: ${params.title}`);
  }
  // Update description in frontmatter if provided
  if (params.description !== undefined) {
    if (updatedFm.match(/^description:.*$/m)) {
      updatedFm = updatedFm.replace(/^description:.*$/m, `description: ${params.description}`);
    } else if (params.description) {
      updatedFm += `\ndescription: ${params.description}`;
    }
  }

  const fileContent = `---\n${updatedFm}\n---\n\n${params.content}\n`;

  // Create branch, commit, and open PR
  await createBranch(branchName);
  await commitFile({
    path: filePath,
    content: fileContent,
    message: `docs: update ${params.title}`,
    branch: branchName,
    existingSha: existing.sha,
  });

  const pr = await createPullRequest({
    title: `Update: ${params.title}`,
    body: `This PR updates the wiki page **${params.title}** (\`${params.slug}\`).\n\nSubmitted via Relay wiki editor.`,
    branch: branchName,
  });

  return pr;
}

/**
 * Create a new page: creates a branch, commits the file, updates meta.json, opens a PR.
 */
export async function createPage(params: CreatePageParams) {
  const branchName = `wiki/create-${params.slug}-${Date.now()}`;
  const filePath = `${gitConfig.contentPath}/${params.slug}.mdx`;

  // Check the page doesn't already exist
  const existing = await getFileContent(filePath, gitConfig.branch);
  if (existing) {
    throw new Error(`Page "${params.slug}" already exists`);
  }

  const fileContent = buildMdxContent({
    title: params.title,
    description: params.description,
    icon: params.icon,
    content: params.content,
  });

  // Create branch, commit file, update meta, open PR
  await createBranch(branchName);
  await commitFile({
    path: filePath,
    content: fileContent,
    message: `docs: create ${params.title}`,
    branch: branchName,
  });
  await addToMeta(params.slug, branchName);

  const pr = await createPullRequest({
    title: `New page: ${params.title}`,
    body: `This PR adds a new wiki page **${params.title}** (\`${params.slug}\`).\n\nSubmitted via Relay wiki editor.`,
    branch: branchName,
  });

  return pr;
}

// --- Helpers ---

function buildMdxContent(params: {
  title: string;
  description?: string;
  icon?: string;
  content: string;
}) {
  const frontmatter = [
    '---',
    `title: ${params.title}`,
    params.description ? `description: ${params.description}` : null,
    params.icon ? `icon: ${params.icon}` : null,
    '---',
  ]
    .filter(Boolean)
    .join('\n');

  return `${frontmatter}\n\n${params.content}\n`;
}

/**
 * Fetch the raw MDX file content for a given slug.
 * Returns the full file content (including frontmatter) as stored in the repo.
 */
export async function getRawPageContent(slug: string): Promise<string | null> {
  const filePath = `${gitConfig.contentPath}/${slug}.mdx`;
  const result = await getFileContent(filePath, gitConfig.branch);
  return result?.content ?? null;
}

/**
 * Split an MDX file into frontmatter and body content.
 */
export function splitFrontmatter(raw: string): { frontmatter: string; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { frontmatter: '', body: raw };
  return { frontmatter: match[1], body: match[2].replace(/^\n+/, '') };
}

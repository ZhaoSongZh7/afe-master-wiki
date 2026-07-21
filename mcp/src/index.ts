#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as fs from "node:fs";
import * as path from "node:path";

const CONTENT_DIR = path.resolve(
  import.meta.dirname,
  "../../content/docs"
);

interface WikiPage {
  slug: string;
  title: string;
  description: string;
  body: string;
}

function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };

  const meta: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const colon = line.indexOf(":");
    if (colon > 0) {
      meta[line.slice(0, colon).trim()] = line.slice(colon + 1).trim();
    }
  }
  return { meta, body: match[2] };
}

function stripMdxComponents(body: string): string {
  return body
    .replace(/<[A-Z][^>]*\/>/g, "")
    .replace(/<[A-Z][^>]*>[\s\S]*?<\/[A-Z][^>]*>/g, "")
    .replace(/import\s+.*?;\n?/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function loadPages(): WikiPage[] {
  const pages: WikiPage[] = [];

  const files = fs.readdirSync(CONTENT_DIR).filter(
    (f) => f.endsWith(".mdx") || f.endsWith(".md")
  );

  for (const file of files) {
    const raw = fs.readFileSync(path.join(CONTENT_DIR, file), "utf-8");
    const { meta, body } = parseFrontmatter(raw);
    const slug = file.replace(/\.mdx?$/, "");

    pages.push({
      slug,
      title: meta.title || slug,
      description: meta.description || "",
      body: stripMdxComponents(body),
    });
  }

  return pages;
}

let cachedPages: WikiPage[] | null = null;

function getPages(): WikiPage[] {
  if (!cachedPages) {
    cachedPages = loadPages();
  }
  return cachedPages;
}

const server = new McpServer({
  name: "afe-wiki",
  version: "1.0.0",
});

server.registerTool(
  "list_pages",
  {
    description:
      "List all pages in the AFE Relay wiki with their titles and descriptions",
    inputSchema: {},
  },
  async () => {
    const pages = getPages();
    const listing = pages.map(
      (p) => `- **${p.title}** (\`${p.slug}\`): ${p.description}`
    );

    return {
      content: [
        {
          type: "text" as const,
          text: `# AFE Relay Wiki — ${pages.length} pages\n\n${listing.join("\n")}`,
        },
      ],
    };
  }
);

server.registerTool(
  "read_page",
  {
    description:
      "Read the full content of a specific wiki page by its slug (e.g. 'faq', 'dev-environment-setup')",
    inputSchema: {
      slug: z
        .string()
        .describe(
          "The page slug, e.g. 'faq', 'benefits-insurance', 'dev-environment-setup'"
        ),
    },
  },
  async ({ slug }) => {
    const pages = getPages();
    const page = pages.find((p) => p.slug === slug);

    if (!page) {
      const available = pages.map((p) => p.slug).join(", ");
      return {
        content: [
          {
            type: "text" as const,
            text: `Page "${slug}" not found. Available pages: ${available}`,
          },
        ],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: "text" as const,
          text: `# ${page.title}\n\n${page.description ? `> ${page.description}\n\n` : ""}${page.body}`,
        },
      ],
    };
  }
);

server.registerTool(
  "search_wiki",
  {
    description:
      "Search the AFE Relay wiki for pages matching a query. Returns titles, slugs, and relevant excerpts.",
    inputSchema: {
      query: z
        .string()
        .describe("Search query — keywords about the topic you need"),
    },
  },
  async ({ query }) => {
    const pages = getPages();
    const terms = query
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 2);

    if (terms.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: "Please provide a more specific query (at least one word with 3+ characters).",
          },
        ],
      };
    }

    const scored = pages
      .map((page) => {
        const titleLower = page.title.toLowerCase();
        const bodyLower = page.body.toLowerCase();
        let score = 0;

        for (const term of terms) {
          if (titleLower.includes(term)) score += 10;
          if (page.description.toLowerCase().includes(term)) score += 5;

          const bodyMatches = bodyLower.split(term).length - 1;
          score += Math.min(bodyMatches, 5);
        }

        return { page, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    if (scored.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: `No results for "${query}". Try different keywords.`,
          },
        ],
      };
    }

    const results = scored.map(({ page, score }) => {
      const excerpt = extractExcerpt(page.body, terms);
      return `## ${page.title} (\`${page.slug}\`) — score ${score}\n\n${page.description}\n\n> ${excerpt}`;
    });

    return {
      content: [
        {
          type: "text" as const,
          text: `# Search results for "${query}"\n\n${results.join("\n\n---\n\n")}`,
        },
      ],
    };
  }
);

function extractExcerpt(body: string, terms: string[]): string {
  const lines = body.split("\n");
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (terms.some((t) => lower.includes(t)) && line.trim().length > 20) {
      return line.trim().slice(0, 300);
    }
  }
  return lines.slice(0, 3).join(" ").slice(0, 200);
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("AFE Wiki MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

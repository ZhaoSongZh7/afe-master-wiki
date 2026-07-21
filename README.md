# Relay 🏃‍♀️➡️🏃‍♂️

A searchable AFE intern handbook and source-grounded assistant, built for the **AFE Intern Hackathon 2026: Pay it Forward**.

## What Relay does

AFE guidance spans program wikis, AUTA pages, HR systems, and technical learning paths. Relay provides:

- a structured wiki for onboarding, tooling, evaluations, support, and community;
- search across the handbook; and
- an AI assistant grounded in repository content, with links back to sources.

Relay is a navigation and summarization layer. Official AFE, AUTA, and HR systems remain authoritative for current policy, eligibility, dates, and personal HR information. See [Canonical Sources](content/docs/canonical-sources.mdx).

## Source integrity and privacy

- Attach an official source to factual contributions and recheck time-sensitive details.
- Prefer the consolidated 2026 AFE Intern Home over deprecated manager training, old vNHO material, or 2024 calendars.
- Prefer official HR and AUTA guidance over unofficial financial guides.
- Never ingest personal data, private conversations, or Amazon-confidential material into a personal database.
- Do not export Discord with a browser extension or ingest private chats without explicit AFE program-owner, Privacy, Legal, and Security approval.

Authenticated source pages are linked rather than mirrored when their contents cannot be reviewed safely. Contributors should summarize only the minimum durable information needed and keep the authoritative link visible.

## Getting started

```bash
npm ci
npm run dev
```

For a non-watching validation run:

```bash
npm run types:check
npm run lint
npm run build
```

Infrastructure lives in `infra/`; review [CDK & Bedrock Setup](content/docs/cdk-bedrock-setup.md) before making AWS changes. Use approved temporary, least-privilege credentials and verify the target account first.

## How it works

1. MDX content under `content/docs/` supplies the browsable knowledge base.
2. Fumadocs indexes the content for navigation and search.
3. The chat API retrieves relevant content and invokes Amazon Bedrock.

## Team

_Team name and members: TBD — add before submitting on Hack Amazon._

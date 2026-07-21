---
title: CDK & Bedrock Setup
description: How to deploy AWS infrastructure with CDK and call Bedrock models
---

# CDK & Bedrock Setup

This guide walks through how we set up AWS infrastructure using CDK and connected to Amazon Bedrock for AI model access.

## What is CDK?

CDK (Cloud Development Kit) lets you define AWS resources as code (TypeScript in our case). Instead of clicking through the AWS Console, you write what you want and run `cdk deploy`. This makes the setup reproducible — the next intern runs one command and gets the same environment.

**Key commands:**

| Command | What it does |
|---------|-------------|
| `cdk bootstrap` | One-time setup per account/region (creates a staging bucket for CDK) |
| `cdk deploy` | Creates or updates your resources in AWS |
| `cdk destroy` | Tears everything down |
| `cdk diff` | Shows what would change without deploying |

## What our stack provisions

The CDK stack lives in `infra/` and creates:

- **S3 bucket** — private, versioned, auto-deletes on `cdk destroy`
- **IAM role** (`afe-relay-backend-role`) — has permission to call Bedrock and read/write the S3 bucket

## Prerequisites

- Node.js 20+
- AWS CLI v2
- Approved temporary credentials for a non-production AWS account
- A least-privilege deployment role authorized for this stack

<Callout type="warn" title="Verify the target before deploying">
  AWS deployments modify account resources. Treat an unknown account as production,
  verify your role and account ID, and obtain explicit approval before changing a
  production environment. Do not create long-lived access keys or grant yourself
  `AdministratorAccess` to bypass a permission error.
</Callout>

## Step-by-step

### 1. Authenticate through the approved credential provider

Use your organization's SSO or temporary-credential workflow. If you do not have an
approved CDK deployment role, ask the account owner for one scoped to this stack.
Do not store credentials in this repository or configure persistent IAM-user keys.

Verify the active identity and region:

```bash
aws sts get-caller-identity
aws configure get region
```

Confirm that the account, role, and region are the intended non-production target.

### 2. Install dependencies and review the change

```bash
cd infra
npm ci
npx cdk diff
```

Review the diff before deploying. `cdk bootstrap` and `cdk deploy` create or update
AWS resources.

### 3. Deploy the CDK stack

```bash
npx cdk bootstrap    # first time only for this account and region
npx cdk deploy
```

The output will print the S3 bucket name and IAM role ARN.

## Calling Bedrock

### Finding available models

```bash
aws bedrock list-foundation-models \
  --query "modelSummaries[?contains(modelId, 'sonnet')].modelId" \
  --output text

aws bedrock list-inference-profiles \
  --query "inferenceProfileSummaries[?contains(inferenceProfileId, 'sonnet')].inferenceProfileId" \
  --output text
```

### Inference profiles

Model identifiers and inference-profile requirements vary by model, account, and
region. Query the target account immediately before configuration rather than
assuming the example remains current:

| Example raw model ID | Example inference profile |
|---|---|
| `anthropic.claude-sonnet-4-5-20250929-v1:0` | `us.anthropic.claude-sonnet-4-5-20250929-v1:0` |

An unsupported raw model ID can produce `ValidationException: Invocation with
on-demand throughput isn't supported`.

### Test from the CLI

```bash
printf '{"anthropic_version":"bedrock-2023-05-31","max_tokens":256,"messages":[{"role":"user","content":"Hello"}]}' > /tmp/input.json

aws bedrock-runtime invoke-model \
  --model-id "us.anthropic.claude-sonnet-4-5-20250929-v1:0" \
  --region "us-east-1" \
  --content-type "application/json" \
  --accept "application/json" \
  --body fileb:///tmp/input.json \
  /tmp/output.json

cat /tmp/output.json
```

### Model access

Model availability and access requirements can vary. Follow the target account's
approval process and ensure the runtime role has only the required
`bedrock:InvokeModel` permissions.

## Gotchas we ran into

| Problem | Cause | Fix |
|---------|-------|-----|
| `AccessDeniedException` on `cdk bootstrap` | Active role lacks required deployment permissions | Confirm the intended role and ask the account owner for the minimum missing permissions |
| `Invalid base64` on `--body` | CLI treats body as a blob | Use `fileb:///path/to/file.json` rather than inline JSON |
| `Invalid model identifier` | Model or inference-profile ID is unavailable | Query the target account for currently available IDs |
| `ThrottlingException: Too many tokens` | Account rate limit hit | Wait and retry, or request a quota increase through the approved process |
| Credentials expired | Temporary session ended | Refresh credentials through the approved SSO or credential provider |

## How credentials flow in production

In the CDK stack, the IAM role is configured to be assumed by Lambda. When you attach this role to a Lambda function, the AWS SDK automatically picks up credentials — **no API keys in your code**:

```typescript
// Lambda code — no credentials needed
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
const client = new BedrockRuntimeClient({ region: "us-east-1" });
```

The credential chain: Lambda → assumes `afe-relay-backend-role` → role has Bedrock permission → SDK handles it all.

## Project structure

```
infra/
├── bin/app.ts              # CDK entry point
├── lib/afe-relay-stack.ts  # Stack: S3 + IAM role + Bedrock perms
├── cdk.json                # CDK config
├── package.json            # CDK dependencies
└── tsconfig.json
```

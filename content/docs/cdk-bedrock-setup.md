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

- Node.js 20+ (installed via `nvm`)
- AWS CLI v2
- An IAM user with `AdministratorAccess` on the target account

## Step-by-step

### 1. Create an IAM user (one-time, in AWS Console)

1. Go to **IAM → Users → Create user**
2. Name: `cdk-deployer`
3. Attach policy: **AdministratorAccess**
4. Go to **Security credentials → Create access key**
5. Use case: **"Local code"**
6. Save the Access Key ID and Secret Access Key

### 2. Export credentials in your terminal

```bash
export AWS_ACCESS_KEY_ID="your-key-id"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_REGION="us-east-1"
```

Verify it's working:

```bash
aws sts get-caller-identity
```

You should see your IAM user ARN, **not** `DevSpacesEnvironmentRole`.

> **Note:** Exports don't persist between terminal sessions. You'll need to re-export when you open a new terminal.

### 3. Deploy the CDK stack

```bash
cd infra
npm install
npx cdk bootstrap    # first time only
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

### Inference profiles (important!)

Newer models like Sonnet 4.5+ require a **cross-region inference profile** ID instead of the raw model ID:

| Raw model ID | Inference profile (use this) |
|---|---|
| `anthropic.claude-sonnet-4-5-20250929-v1:0` | `us.anthropic.claude-sonnet-4-5-20250929-v1:0` |

If you use the raw ID, you'll get: `ValidationException: Invocation with on-demand throughput isn't supported`

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

Model access is **automatic** — you no longer need to manually enable models in the Bedrock console. Just make sure your IAM user/role has the `bedrock:InvokeModel` permission (our CDK stack handles this).

## Gotchas we ran into

| Problem | Cause | Fix |
|---------|-------|-----|
| `AccessDeniedException` on `cdk bootstrap` | DevSpaces role has no CloudFormation perms | Export your IAM user credentials |
| `Invalid base64` on `--body` | CLI treats body as a blob | Use `fileb:///path/to/file.json` not inline JSON |
| `Invalid model identifier` | Wrong model version date | Run `aws bedrock list-inference-profiles` to get exact IDs |
| `ThrottlingException: Too many tokens` | Account rate limit hit | Wait and retry, or request quota increase in Service Quotas |
| Credentials not working after restart | Env vars don't persist | Re-export or use `aws configure` for persistence |

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

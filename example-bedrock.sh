#!/bin/bash
# Quick test: invoke Claude Sonnet 4.5 via Bedrock

printf '{"anthropic_version":"bedrock-2023-05-31","max_tokens":256,"messages":[{"role":"user","content":"Say hello and confirm which Claude model you are."}]}' > /tmp/bedrock-input.json

aws bedrock-runtime invoke-model \
  --model-id "us.anthropic.claude-sonnet-4-5-20250929-v1:0" \
  --region "us-east-1" \
  --content-type "application/json" \
  --accept "application/json" \
  --body fileb:///tmp/bedrock-input.json \
  /tmp/bedrock-output.json

echo ""
cat /tmp/bedrock-output.json
echo ""

rm -f /tmp/bedrock-input.json /tmp/bedrock-output.json

#!/bin/bash
# Quick test: upload and download a file from the AFE Relay S3 bucket
# Make sure your AWS credentials are exported first.

BUCKET="afe-relay-951488807497-us-east-1"

# --- Upload a test file ---
echo "Hello from AFE Relay! This is a test upload." > /tmp/s3-test.txt

echo "Uploading to s3://$BUCKET/test/hello.txt ..."
aws s3 cp /tmp/s3-test.txt "s3://$BUCKET/test/hello.txt"

# --- List files in the bucket ---
echo ""
echo "Listing bucket contents:"
aws s3 ls "s3://$BUCKET/" --recursive

# --- Download it back ---
echo ""
echo "Downloading back..."
aws s3 cp "s3://$BUCKET/test/hello.txt" /tmp/s3-downloaded.txt
echo "Contents:"
cat /tmp/s3-downloaded.txt

# --- Cleanup ---
rm -f /tmp/s3-test.txt /tmp/s3-downloaded.txt
echo ""
echo "Done! File is still in S3 — delete with:"
echo "  aws s3 rm s3://$BUCKET/test/hello.txt"

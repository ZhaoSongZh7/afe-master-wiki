import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as logs from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";
import * as path from "path";

export class AfeRelayStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ─── S3 Bucket ────────────────────────────────────────────────────────────
    const bucket = new s3.Bucket(this, "AfeRelayBucket", {
      bucketName: `afe-relay-${this.account}-${this.region}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
    });

    // ─── Lambda Function ──────────────────────────────────────────────────────
    const chatFn = new lambda.Function(this, "ChatFunction", {
      functionName: "afe-relay-chat",
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../../lambda/chat")),
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        BUCKET_NAME: bucket.bucketName,
        BEDROCK_REGION: "us-east-1",
        MODEL_ID: "us.anthropic.claude-sonnet-4-5-20250929-v1:0",
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Bedrock: invoke Claude Sonnet 4.5 (cross-region inference profile)
    chatFn.addToRolePolicy(
      new iam.PolicyStatement({
        sid: "BedrockInvoke",
        actions: [
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream",
        ],
        resources: [
          "arn:aws:bedrock:*::foundation-model/anthropic.claude-sonnet-4-5-20250929-v1:0",
          `arn:aws:bedrock:us:${this.account}:inference-profile/us.anthropic.claude-sonnet-4-5-20250929-v1:0`,
          `arn:aws:bedrock:${this.region}:${this.account}:inference-profile/us.anthropic.claude-sonnet-4-5-20250929-v1:0`,
        ],
      })
    );

    // S3: read wiki content for context
    bucket.grantRead(chatFn);

    // ─── API Gateway ──────────────────────────────────────────────────────────
    const api = new apigateway.RestApi(this, "AfeRelayApi", {
      restApiName: "afe-relay-api",
      description: "AFE Relay chatbot API",
      deployOptions: {
        stageName: "prod",
        throttlingBurstLimit: 20,
        throttlingRateLimit: 10,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: ["POST", "OPTIONS"],
        allowHeaders: ["Content-Type"],
      },
    });

    // POST /chat
    const chat = api.root.addResource("chat");
    chat.addMethod("POST", new apigateway.LambdaIntegration(chatFn));

    // ─── Outputs ──────────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, "ApiUrl", {
      value: api.url,
      description: "API Gateway URL — use this in your frontend",
    });

    new cdk.CfnOutput(this, "ChatEndpoint", {
      value: `${api.url}chat`,
      description: "POST /chat endpoint for the chatbot",
    });

    new cdk.CfnOutput(this, "BucketName", {
      value: bucket.bucketName,
      description: "S3 bucket for wiki context files",
    });
  }
}

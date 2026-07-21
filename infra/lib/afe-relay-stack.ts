import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

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

    // ─── IAM Role with Bedrock + S3 access ────────────────────────────────────
    const backendRole = new iam.Role(this, "BackendRole", {
      roleName: "afe-relay-backend-role",
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole"
        ),
      ],
    });

    // Bedrock: invoke Claude Sonnet 4.5 (cross-region inference profile)
    backendRole.addToPolicy(
      new iam.PolicyStatement({
        sid: "BedrockInvoke",
        actions: [
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream",
        ],
        resources: [
          `arn:aws:bedrock:${this.region}::foundation-model/anthropic.claude-sonnet-4-5-20250929-v1:0`,
          `arn:aws:bedrock:us:${this.account}:inference-profile/us.anthropic.claude-sonnet-4-5-20250929-v1:0`,
        ],
      })
    );

    // S3: read/write to the project bucket
    bucket.grantReadWrite(backendRole);

    // ─── Outputs ──────────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, "BucketName", {
      value: bucket.bucketName,
      description: "S3 bucket for AFE Relay assets",
    });

    new cdk.CfnOutput(this, "BackendRoleArn", {
      value: backendRole.roleArn,
      description: "IAM role ARN — attach to your compute (Lambda, etc.)",
    });
  }
}

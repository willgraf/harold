import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as sns from "aws-cdk-lib/aws-sns";
import * as iam from "aws-cdk-lib/aws-iam";
import path from "path";
import { Construct } from "constructs";
import { InfraConfig } from "./config";

interface ApiStackProps extends cdk.StackProps {
  config: InfraConfig;
}

export class ApiStack extends cdk.Stack {
  public readonly apiUrl: string;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const { config } = props;
    const verificationEnabled = config.emailVerification.enabled;

    // SNS Topic
    const signupTopic = new sns.Topic(this, "SignupTopic", {
      displayName: "Harold Signup Notifications",
    });

    // DynamoDB Table (only if using dynamodb backend)
    let table: dynamodb.Table | undefined;
    if (config.storageBackend === "dynamodb") {
      table = new dynamodb.Table(this, "SignupsTable", {
        partitionKey: { name: "email", type: dynamodb.AttributeType.STRING },
        sortKey: { name: "timestamp", type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      });

      // Add GSI for verification token lookups
      if (verificationEnabled) {
        table.addGlobalSecondaryIndex({
          indexName: "VerificationTokenIndex",
          partitionKey: {
            name: "verificationToken",
            type: dynamodb.AttributeType.STRING,
          },
          projectionType: dynamodb.ProjectionType.ALL,
        });
      }
    }

    // Lambda
    const signupHandler = new nodejs.NodejsFunction(this, "SignupHandler", {
      entry: path.join(__dirname, "..", "..", "lambda", "handler.ts"),
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_22_X,
      environment: {
        STORAGE_BACKEND: config.storageBackend,
        SNS_TOPIC_ARN: signupTopic.topicArn,
        EMAIL_VERIFICATION_ENABLED: String(verificationEnabled),
        ...(config.storageBackend === "dynamodb" && table
          ? { TABLE_NAME: table.tableName }
          : {}),
        ...(config.storageBackend === "postgres"
          ? { DATABASE_URL: config.databaseUrl }
          : {}),
        ...(verificationEnabled
          ? {
              EMAIL_SENDER: config.emailVerification.senderEmail,
              EMAIL_VERIFICATION_EXPIRY_HOURS: String(
                config.emailVerification.tokenExpiryHours
              ),
              BRAND_NAME: config.brandName,
            }
          : {}),
      },
      bundling: {
        externalModules: [],
      },
    });

    // Permissions
    signupTopic.grantPublish(signupHandler);
    if (table) {
      if (verificationEnabled) {
        table.grantReadWriteData(signupHandler);
      } else {
        table.grantWriteData(signupHandler);
      }
    }

    // SES permissions (only when verification enabled)
    if (verificationEnabled) {
      signupHandler.addToRolePolicy(
        new iam.PolicyStatement({
          actions: ["ses:SendEmail", "ses:SendRawEmail"],
          resources: ["*"],
        })
      );
    }

    // API Gateway
    const api = new apigateway.RestApi(this, "SignupApi", {
      restApiName: "Harold Signup API",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: ["POST", "GET", "OPTIONS"],
        allowHeaders: ["Content-Type"],
      },
    });

    const lambdaIntegration = new apigateway.LambdaIntegration(signupHandler);

    const signup = api.root.addResource("signup");
    signup.addMethod("POST", lambdaIntegration);

    // Verify endpoint (always add for consistent API shape)
    const verify = api.root.addResource("verify");
    verify.addMethod("GET", lambdaIntegration);

    // Set API_URL and SITE_URL after API creation
    signupHandler.addEnvironment("API_URL", api.url);
    signupHandler.addEnvironment("SITE_URL", config.siteUrl);

    this.apiUrl = api.url;

    new cdk.CfnOutput(this, "ApiUrl", {
      value: api.url,
    });

    new cdk.CfnOutput(this, "SnsTopicArn", {
      value: signupTopic.topicArn,
    });
  }
}

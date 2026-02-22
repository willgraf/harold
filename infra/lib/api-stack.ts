import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as sns from "aws-cdk-lib/aws-sns";
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
    }

    // Lambda
    const signupHandler = new nodejs.NodejsFunction(this, "SignupHandler", {
      entry: path.join(__dirname, "..", "..", "lambda", "handler.ts"),
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_22_X,
      environment: {
        STORAGE_BACKEND: config.storageBackend,
        SNS_TOPIC_ARN: signupTopic.topicArn,
        ...(config.storageBackend === "dynamodb" && table
          ? { TABLE_NAME: table.tableName }
          : {}),
        ...(config.storageBackend === "postgres"
          ? { DATABASE_URL: config.databaseUrl }
          : {}),
      },
      bundling: {
        externalModules: [],
      },
    });

    // Permissions
    signupTopic.grantPublish(signupHandler);
    if (table) {
      table.grantWriteData(signupHandler);
    }

    // API Gateway
    const api = new apigateway.RestApi(this, "SignupApi", {
      restApiName: "Harold Signup API",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: ["POST", "OPTIONS"],
        allowHeaders: ["Content-Type"],
      },
    });

    const signup = api.root.addResource("signup");
    signup.addMethod("POST", new apigateway.LambdaIntegration(signupHandler));

    this.apiUrl = api.url;

    new cdk.CfnOutput(this, "ApiUrl", {
      value: api.url,
    });

    new cdk.CfnOutput(this, "SnsTopicArn", {
      value: signupTopic.topicArn,
    });
  }
}

"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const apigateway = __importStar(require("aws-cdk-lib/aws-apigateway"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const nodejs = __importStar(require("aws-cdk-lib/aws-lambda-nodejs"));
const dynamodb = __importStar(require("aws-cdk-lib/aws-dynamodb"));
const sns = __importStar(require("aws-cdk-lib/aws-sns"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const path_1 = __importDefault(require("path"));
class ApiStack extends cdk.Stack {
    apiUrl;
    apiGatewayDomain;
    constructor(scope, id, props) {
        super(scope, id, props);
        const { config } = props;
        const verificationEnabled = config.emailVerification.enabled;
        // SNS Topic
        const signupTopic = new sns.Topic(this, "SignupTopic", {
            displayName: "Harold Signup Notifications",
        });
        // DynamoDB Table (only if using dynamodb backend)
        let table;
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
            entry: path_1.default.join(__dirname, "..", "..", "..", "lambda", "handler.ts"),
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
                        EMAIL_VERIFICATION_EXPIRY_HOURS: String(config.emailVerification.tokenExpiryHours),
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
            }
            else {
                table.grantWriteData(signupHandler);
            }
        }
        // SES permissions (only when verification enabled)
        if (verificationEnabled) {
            signupHandler.addToRolePolicy(new iam.PolicyStatement({
                actions: ["ses:SendEmail", "ses:SendRawEmail"],
                resources: ["*"],
            }));
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
        // Construct API_URL from restApiId rather than api.url to avoid a circular
        // dependency (api.url references the deployment stage, which depends on the
        // Lambda permissions that are already set above).
        this.apiGatewayDomain = `${api.restApiId}.execute-api.${cdk.Aws.REGION}.amazonaws.com`;
        this.apiUrl = `https://${this.apiGatewayDomain}/prod/`;
        signupHandler.addEnvironment("API_URL", this.apiUrl);
        signupHandler.addEnvironment("SITE_URL", config.siteUrl);
        new cdk.CfnOutput(this, "ApiUrl", {
            value: this.apiUrl,
        });
        new cdk.CfnOutput(this, "SnsTopicArn", {
            value: signupTopic.topicArn,
        });
    }
}
exports.ApiStack = ApiStack;

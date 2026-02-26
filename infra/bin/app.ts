#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { StaticSiteStack } from "../lib/static-site-stack";
import { ApiStack } from "../lib/api-stack";
import { loadInfraConfig } from "../lib/config";

const app = new cdk.App();
const config = loadInfraConfig();

const apiStack = new ApiStack(app, "HaroldApi", { config });
new StaticSiteStack(app, "HaroldSite", {
  apiGatewayDomain: apiStack.apiGatewayDomain,
});

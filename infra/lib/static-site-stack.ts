import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import path from "path";
import { Construct } from "constructs";

interface StaticSiteProps extends cdk.StackProps {
  apiGatewayDomain: string;
  domainName?: string;
  certificateArn?: string;
}

export class StaticSiteStack extends cdk.Stack {
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: StaticSiteProps) {
    super(scope, id, props);

    const siteBucket = new s3.Bucket(this, "SiteBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    const certificate =
      props.certificateArn
        ? acm.Certificate.fromCertificateArn(this, "Certificate", props.certificateArn)
        : undefined;

    // Redirect www → apex at the edge before hitting the origin.
    const wwwRedirectFn = props.domainName
      ? new cloudfront.Function(this, "WwwRedirect", {
          functionName: "harold-www-redirect",
          code: cloudfront.FunctionCode.fromInline(
            [
              "function handler(event) {",
              "  var host = event.request.headers.host.value;",
              "  if (host.startsWith('www.')) {",
              "    return {",
              "      statusCode: 301,",
              "      statusDescription: 'Moved Permanently',",
              "      headers: { location: { value: 'https://' + host.slice(4) + event.request.uri } }",
              "    };",
              "  }",
              "  return event.request;",
              "}",
            ].join("\n")
          ),
        })
      : undefined;

    this.distribution = new cloudfront.Distribution(this, "Distribution", {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(siteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        functionAssociations: wwwRedirectFn
          ? [{ function: wwwRedirectFn, eventType: cloudfront.FunctionEventType.VIEWER_REQUEST }]
          : undefined,
      },
      defaultRootObject: "index.html",
      comment: props.domainName ?? "Harold waitlist site",
      errorResponses: [
        {
          httpStatus: 404,
          responsePagePath: "/index.html",
          responseHttpStatus: 200,
        },
      ],
      ...(props.domainName && certificate
        ? { domainNames: [props.domainName, `www.${props.domainName}`], certificate }
        : {}),
    });

    cdk.Tags.of(this.distribution).add("Name", props.domainName ?? "harold-site");

    // Proxy /prod/* to API Gateway so the site and API share one domain,
    // eliminating CORS and the need to configure apiUrl after deployment.
    const apiOrigin = new origins.HttpOrigin(props.apiGatewayDomain, {
      protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
    });
    this.distribution.addBehavior("/prod/*", apiOrigin, {
      allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
      originRequestPolicy:
        cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
    });

    new s3deploy.BucketDeployment(this, "DeploySite", {
      sources: [s3deploy.Source.asset(path.join(__dirname, "..", "..", "..", "site", "out"))],
      destinationBucket: siteBucket,
      distribution: this.distribution,
      distributionPaths: ["/*"],
    });

    new cdk.CfnOutput(this, "SiteUrl", {
      value: props.domainName
        ? `https://${props.domainName}`
        : `https://${this.distribution.distributionDomainName}`,
    });
  }
}

import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { CloudFrontCognitoLink } from '../cognito/cloudFrontCognitoLink';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as dotenv from 'dotenv';
dotenv.config();
const AWS_HOSTED_ZONE_NAME = process.env.AWS_HOSTED_ZONE_NAME || 'default_hosted_zone_name';
const AWS_API_ENDPOINT_NAME = process.env.AWS_API_ENDPOINT_NAME || 'default_cert_domain';
const COGNITO_AZURE_TENANT_ID = process.env.COGNITO_AZURE_TENANT_ID || 'default_azure_tenant_id';
const COGNITO_AZURE_CLIENT_ID = process.env.COGNITO_AZURE_CLIENT_ID || 'default_azure_client_id';
const COGNITO_AZURE_CLIENT_SECRET = process.env.COGNITO_AZURE_CLIENT_SECRET || 'default_azure_client_secret';
const COGNITO_AZURE_GROUP_ID = process.env.COGNITO_AZURE_GROUP_ID || 'default_azure_group_id';
const COGNITO_PROVIDER_NAME = process.env.COGNITO_PROVIDER_NAME || 'default_user_pool_name';
const COGNITO = true;

export interface RootCloudProps {
  apiGateway: apigateway.RestApi;
  contentBucket: s3.Bucket;
  assetBucket: s3.Bucket;
  domainNames?: string[];
}

export class RootCloud extends Construct {
  public readonly distribution: cloudfront.Distribution;
  public readonly cloudFrontCognitoAuth: CloudFrontCognitoLink;
  constructor(scope: Construct, id: string, props: RootCloudProps) {
    super(scope, id);

    const oai = new cloudfront.OriginAccessIdentity(this, 'CloudFrontOAI', {
      comment: 'Allow CloudFront to access S3 buckets'
    });

    props.contentBucket.grantRead(oai.grantPrincipal);
    props.assetBucket.grantRead(oai.grantPrincipal);

    const apiGatewayOrigin = new origins.RestApiOrigin(props.apiGateway, {
      customHeaders: {
        'x-origin': 'cloudfront'
      },
      originPath: '/'
    });

    const contentBucketOrigin = new origins.S3Origin(props.contentBucket, {
      originAccessIdentity: oai
    });

    const assetsOrigin = new origins.S3Origin(props.assetBucket, {
      originAccessIdentity: oai,
      originPath: '/',
    });

    const jsHeadersPolicy = new cloudfront.ResponseHeadersPolicy(this, 'JsHeadersPolicy', {
      responseHeadersPolicyName: 'JsHeadersPolicy',
      customHeadersBehavior: {
        customHeaders: [
          {
            header: 'Content-Type',
            value: 'application/javascript',
            override: true,
          },
        ],
      },
      // Include the same security headers as your main policy
      securityHeadersBehavior: {
        contentTypeOptions: {
          override: true,
        },
      }
    });
    // Common security headers
    const responseHeadersPolicy = new cloudfront.ResponseHeadersPolicy(this, 'SecurityHeadersPolicy', {
      responseHeadersPolicyName: 'SecurityHeadersPolicy',
      // customHeadersBehavior: {
      //   customHeaders: [
      //     {
      //       header: 'Set-Cookie',
      //       value: 'SameSite=None; Secure',
      //       override: true
      //     }
      //   ]
      // },
      securityHeadersBehavior: {
        // contentSecurityPolicy: {
        //   contentSecurityPolicy: "default-src 'self'; img-src 'self' data: https://*.amazoncognito.com;",
        //   //contentSecurityPolicy: "default-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self' 'unsafe-inline';",
        //   override: true,
        // },
        // strictTransportSecurity: {
        //   accessControlMaxAge: cdk.Duration.days(2 * 365),
        //   includeSubdomains: true,
        //   preload: true,
        //   override: true, // Add the required override property
        // },
        contentTypeOptions: {
          override: true,
        },
        // Dont allow Iframes to be used to embed the sit
        frameOptions: {
          frameOption: cloudfront.HeadersFrameOption.DENY,
          override: true,
        },
        // xssProtection: {   // Replaced with the contentSecurityPolicy header
        //   protection: true,
        //   modeBlock: true,
        //   override: true,
        // },
        referrerPolicy: {
          referrerPolicy: cloudfront.HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
          override: true,
        },
      }
      ,

    });

    // Get the certificate from its ARN
    const certificate = acm.Certificate.fromCertificateArn(
      this, 'Certificate',
      ssm.StringParameter.valueForStringParameter(
        this,
        '/certificates/cloudfront/sslCertificateArn',
      )
    );

    this.cloudFrontCognitoAuth = new CloudFrontCognitoLink(this, 'CloudFrontCognitoAuth', {
      origin: assetsOrigin,
      userPoolName: `${AWS_API_ENDPOINT_NAME}-${AWS_HOSTED_ZONE_NAME}`.replace(/\./g, '-').toLocaleLowerCase(), // Replace dots with underscores for valid user pool name
      azureTenantId: COGNITO_AZURE_TENANT_ID, // Use the environment variable
      azureClientId: COGNITO_AZURE_CLIENT_ID, // Use the environment variable
      azureGroupName: COGNITO_AZURE_GROUP_ID,
      azureClientSecret: COGNITO_AZURE_CLIENT_SECRET, // Use the environment variable
      providerName: COGNITO_PROVIDER_NAME, // Use the environment variable
    });

    const logGroup = new logs.LogGroup(this, 'CloudFrontLogGroup', {
      retention: logs.RetentionDays.ONE_MONTH, // Adjust retention period as needed
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Change to RETAIN if you want to keep logs after stack deletion
    });

    const logBucket = new s3.Bucket(this, 'CloudFrontLogBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      lifecycleRules: [
        {
          expiration: cdk.Duration.days(1), // Keeping logs for 90 days
        },
      ],
      // Enable ACLs for CloudFront logging
      objectOwnership: s3.ObjectOwnership.OBJECT_WRITER, // This allows the CloudFront service to write logs with ACLs
    });

    // Grant CloudFront log delivery permissions to the bucket
    logBucket.addToResourcePolicy(new cdk.aws_iam.PolicyStatement({
      effect: cdk.aws_iam.Effect.ALLOW,
      principals: [new cdk.aws_iam.ServicePrincipal('delivery.logs.amazonaws.com')],
      actions: ['s3:PutObject'],
      resources: [logBucket.arnForObjects('*')],
    }));




    // Create the CloudFront distribution
    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: contentBucketOrigin,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER, // Use all viewer headers for API requests

        // originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
        responseHeadersPolicy: responseHeadersPolicy,
        edgeLambdas: [{
          functionVersion: this.cloudFrontCognitoAuth.edgeFunctionVersion,
          eventType: cloudfront.LambdaEdgeEventType.VIEWER_REQUEST
        }],
      },
      additionalBehaviors: {
        '/prod/*': { // Changed from '/prod' to '/prod/*' to match all API paths
          origin: apiGatewayOrigin,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED, /// apiCachePolicy,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER, // Use all viewer headers for API requests
          responseHeadersPolicy,

        },
        '/assets/*': {
          origin: assetsOrigin,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          responseHeadersPolicy,
          //originRequestPolicy: assetsRequestPolicy,
        },
        // '/js/authCognito.js': {
        //   origin: assetsOrigin,
        //   viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        //   allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        //   cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        //   responseHeadersPolicy: jsHeadersPolicy,
        // },
      },
      certificate: certificate,
      domainNames: props.domainNames,
      enableIpv6: true,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
      logBucket: logBucket,
      logFilePrefix: 'cloudfront-logs/',
      logIncludesCookies: true, // Set to true if you need to analyze cookie data
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/403.html',
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/404.html',
        },
      ],
    });
  }
}

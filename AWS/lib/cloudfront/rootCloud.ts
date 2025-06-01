import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { CloudFrontCognitoAuth } from '../cognito/cognitoCloudFront';
import * as dotenv from 'dotenv';
dotenv.config();
// const AWS_HOSTED_ZONE_ID = process.env.AWS_HOSTED_ZONE_ID || 'default_hosted_zone_id';
const AWS_HOSTED_ZONE_NAME = process.env.AWS_HOSTED_ZONE_NAME || 'default_hosted_zone_name';
const AWS_API_ENDPOINT_NAME = process.env.AWS_API_ENDPOINT_NAME || 'default_cert_domain';
// const AWS_CLOUDFRONT_SUBDOMAIN = process.env.AWS_CLOUDFRONT_SUBDOMAIN || 'www';
const COGNITO_AZURE_TENANT_ID= process.env.COGNITO_AZURE_TENANT_ID || 'default_azure_tenant_id';
// const COGNITO_AZURE_GROUP_NAME: process.env.COGNITO_AZURE_GROUP_NAME || 'default_azure_group_name';
const COGNITO_AZURE_CLIENT_ID= process.env.COGNITO_AZURE_CLIENT_ID || 'default_azure_client_id';
const COGNITO_AZURE_CLIENT_SECRET= process.env.COGNITO_AZURE_CLIENT_SECRET || 'default_azure_client_secret';
const COGNITO_AZURE_CALLBACK_URL= process.env.COGNITO_AZURE_CALLBACK_URL || `https://${AWS_API_ENDPOINT_NAME}/prod/cognito/callback`;
const COGNITO_AZURE_LOGOUT_URL= process.env.COGNITO_AZURE_LOGOUT_URL || `https://${AWS_API_ENDPOINT_NAME}/prod/cognito/logout`;
const COGNITO_AZURE_GROUP_ID= process.env.COGNITO_AZURE_GROUP_ID || 'default_azure_group_id';
export interface RootCloudProps {
  apiGateway: apigateway.RestApi;
  contentBucket: s3.Bucket;
  assetBucket: s3.Bucket;
  domainNames?: string[];
}

export class RootCloud extends Construct {
  public readonly distribution: cloudfront.Distribution;
  public readonly cloudFrontCognitoAuth: CloudFrontCognitoAuth;
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
    // Create cache policies
    const apiCachePolicy = new cloudfront.CachePolicy(this, 'ApiCachePolicy', {
      defaultTtl: cdk.Duration.seconds(0),
      minTtl: cdk.Duration.seconds(0),
      maxTtl: cdk.Duration.minutes(1),
      headerBehavior: cloudfront.CacheHeaderBehavior.allowList(
        'Authorization', 'Content-Type', 'Accept'
      ),
      queryStringBehavior: cloudfront.CacheQueryStringBehavior.all(),
      cookieBehavior: cloudfront.CacheCookieBehavior.none(),
    });

    // Common security headers
    const responseHeadersPolicy = new cloudfront.ResponseHeadersPolicy(this, 'SecurityHeadersPolicy', {
      responseHeadersPolicyName: 'SecurityHeadersPolicy',
      securityHeadersBehavior: {
        contentSecurityPolicy: {
          contentSecurityPolicy: "default-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self' 'unsafe-inline';",
          override: true,
        },
        strictTransportSecurity: {
          accessControlMaxAge: cdk.Duration.days(2 * 365),
          includeSubdomains: true,
          preload: true,
          override: true, // Add the required override property
        },
        contentTypeOptions: {
          override: true,
        },
        frameOptions: {
          frameOption: cloudfront.HeadersFrameOption.DENY,
          override: true,
        },
        xssProtection: {
          protection: true,
          modeBlock: true,
          override: true,
        },
        referrerPolicy: {
          referrerPolicy: cloudfront.HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
          override: true,
        },
      },
    });

    // Get the certificate from its ARN
    const certificate = acm.Certificate.fromCertificateArn(
      this, 'Certificate',
      ssm.StringParameter.valueForStringParameter(
        this,
        '/certificates/cloudfront/sslCertificateArn',
      )
    );

    this.cloudFrontCognitoAuth = new CloudFrontCognitoAuth(this, 'CloudFrontCognitoAuth', {
      origin: assetsOrigin,
      userPoolName: `${AWS_API_ENDPOINT_NAME}-${AWS_HOSTED_ZONE_NAME}`.replace(/\./g, '-').toLocaleLowerCase(), // Replace dots with underscores for valid user pool name
      azureTenantId: COGNITO_AZURE_TENANT_ID, // Use the environment variable
      azureClientId: COGNITO_AZURE_CLIENT_ID, // Use the environment variable
      azureGroupName: COGNITO_AZURE_GROUP_ID,
      azureClientSecret: COGNITO_AZURE_CLIENT_SECRET, // Use the environment variable
    });

    // Create function associations for the CloudFront distribution behaviors
    const edgeLambdas = [
      {
        functionVersion: this.cloudFrontCognitoAuth.edgeFunctionVersion,
        eventType: cloudfront.LambdaEdgeEventType.VIEWER_REQUEST
      }
    ];

    // Create the CloudFront distribution
    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: contentBucketOrigin,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        responseHeadersPolicy: responseHeadersPolicy,
        edgeLambdas: edgeLambdas,
      },
      additionalBehaviors: {
        '/prod/*': { // Changed from '/prod' to '/prod/*' to match all API paths
          origin: apiGatewayOrigin,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: apiCachePolicy,
          responseHeadersPolicy,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
        },
        '/assets/*': {
          origin: assetsOrigin,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          responseHeadersPolicy,
          //originRequestPolicy: assetsRequestPolicy,
        },
      },
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      enableIpv6: true,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
      domainNames: props.domainNames,
      certificate: certificate,
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
    });

    // Output the distribution URL
    new cdk.CfnOutput(this, 'CloudFrontURL', {
      value: `https://${this.distribution.distributionDomainName}`,
      description: 'URL of the CloudFront distribution',
    });
  }
}

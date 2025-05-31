import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export interface RootCloudProps {
  apiGateway: apigateway.RestApi;
  contentBucket: s3.Bucket;
  assetBucket: s3.Bucket;
  domainNames?: string[];
}

export class RootCloud extends Construct {
  public readonly distribution: cloudfront.Distribution;

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



    const cognito = new CognitoConstruct(this, 'Cognito', {
      userPoolName: 'MyUserPool',
      identityPoolName: 'MyIdentityPool',
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

    // Create the CloudFront distribution
    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultRootObject: 'index.html', // Add this line to serve index.html at the root path
      defaultBehavior: {
        origin: contentBucketOrigin,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        responseHeadersPolicy,
      },
      additionalBehaviors: {
        '/prod': {
          origin: apiGatewayOrigin,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: apiCachePolicy,
          responseHeadersPolicy,
          //originRequestPolicy: apiGatewayRequestPolicy,
                   originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
        },
      },
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      enableIpv6: true,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
      domainNames: props.domainNames, // Add the alternate domain names
      certificate: certificate, // Add the ACM certificate for HTTPS
    });

    // Create a custom origin request policy for assets
    const assetsRequestPolicy = new cloudfront.OriginRequestPolicy(this, 'AssetsRequestPolicy', {
      originRequestPolicyName: 'AssetsRequestPolicy',
      headerBehavior: cloudfront.OriginRequestHeaderBehavior.none(),
      queryStringBehavior: cloudfront.OriginRequestQueryStringBehavior.all(),
      cookieBehavior: cloudfront.OriginRequestCookieBehavior.none(),
    });

    const pathPattern = `/assets/*`;
    this.distribution.addBehavior(pathPattern, assetsOrigin, {
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
      cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      responseHeadersPolicy,
      originRequestPolicy: assetsRequestPolicy,
    });
  }
}

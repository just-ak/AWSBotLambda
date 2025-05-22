import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as path from 'path';
import * as iam from 'aws-cdk-lib/aws-iam';

export interface AssetsBucketProps {
  /**
   * Flag to indicate if this bucket should be directly accessible via website URL.
   * Set to false when accessing through API Gateway.
   * @default false
   */
  enableDirectAccess?: boolean;
}

export class AssetsBucket extends Construct {
  public readonly bucket: s3.Bucket;
  // public readonly accessRole: iam.Role;
  
  constructor(scope: Construct, id: string, props?: AssetsBucketProps) {
    super(scope, id);

    const enableDirectAccess = props?.enableDirectAccess ?? false;

    // Create an S3 bucket for hosting documentation
    this.bucket = new s3.Bucket(this, 'BotAssetsBucket', {
      bucketName: `bot-assets-${cdk.Stack.of(this).account}-${cdk.Stack.of(this).region}`, 
      // Enable website configuration only if direct access is required
      ...(enableDirectAccess ? {
        websiteIndexDocument: 'index.html',
        websiteErrorDocument: 'error.html',
        publicReadAccess: true,
        blockPublicAccess: new s3.BlockPublicAccess({
          blockPublicAcls: false,
          blockPublicPolicy: false,
          ignorePublicAcls: false,
          restrictPublicBuckets: false
        }),
      } : {
        // When accessed through API Gateway, block public access
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        publicReadAccess: false,
      }),
      // Remove the bucket and contents when the stack is deleted (for dev environments)
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Create a role that API Gateway can assume to access the S3 content
    // this.accessRole = new iam.Role(this, 'DocumentationAccessRole', {
    //   assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
    //   description: 'Role for API Gateway to access documentation in S3',
    // });

    // // Grant read access to the bucket contents
    // this.bucket.grantRead(this.accessRole);

    // Deploy the static website content to the S3 bucket
    new s3deploy.BucketDeployment(this, 'DeployAssets', {
      sources: [s3deploy.Source.asset(path.join(__dirname, '../../documentationAssets'))],
      destinationBucket: this.bucket,
    });

    // // Output the S3 bucket name
    // new cdk.CfnOutput(this, 'S3BucketName', {
    //   description: 'Name of the documentation S3 bucket',
    //   value: this.bucket.bucketName,
    // });

    // // Only output website URL if direct access is enabled
    // if (enableDirectAccess) {
    //   new cdk.CfnOutput(this, 'WebsiteURL', {
    //     description: 'URL for bot documentation website hosted on S3 (direct access)',
    //     value: this.bucket.bucketWebsiteUrl || 'Website URL not available',
    //   });
    // }
    
    // // Add note about API Gateway integration
    // new cdk.CfnOutput(this, 'ApiGatewayAccess', {
    //   description: 'Access documentation via API Gateway',
    //   value: 'The documentation is intended to be accessed through API Gateway at /docs endpoint',
    // });
  }
}

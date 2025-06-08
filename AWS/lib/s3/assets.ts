import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as path from 'path';
import * as iam from 'aws-cdk-lib/aws-iam';

export interface AssetsBucketProps {
}

export class AssetsBucket extends Construct {
  public readonly bucket: s3.Bucket;
  // public readonly accessRole: iam.Role;
  
  constructor(scope: Construct, id: string, props?: AssetsBucketProps) {
    super(scope, id);

    // Create an S3 bucket for hosting documentation
    this.bucket = new s3.Bucket(this, 'BotAssetsBucket', {
      bucketName: `bot-assets-${cdk.Stack.of(this).account}-${cdk.Stack.of(this).region}`, 
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      publicReadAccess: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    new s3deploy.BucketDeployment(this, 'DeployAssets', {
      sources: [s3deploy.Source.asset(path.join(__dirname, '../../documentationAssets/build'))],
      destinationBucket: this.bucket,
      destinationKeyPrefix: 'assets', // Optional: specify a prefix for the assets
    });
  }
}

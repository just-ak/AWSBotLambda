import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as path from 'path';
export interface DocumentationBucketProps {
}

export class DocumentationBucket extends Construct {
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: DocumentationBucketProps) {
    super(scope, id);

    this.bucket = new s3.Bucket(this, 'BotDocumentationBucket', {
      bucketName: `bot-documentation-${cdk.Stack.of(this).account}-${cdk.Stack.of(this).region}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      publicReadAccess: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      // cors: [
      //   {
      //     allowedHeaders: ['*'],
      //     allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.HEAD],
      //     allowedOrigins: ['*'],  // Or your specific domains
      //     maxAge: 3600,
      //     exposedHeaders: ['ETag']
      //   }]
    });

    new s3deploy.BucketDeployment(this, 'DeployDocumentation', {
      sources: [s3deploy.Source.asset(path.join(__dirname, '../../documentation/build'))],
      destinationBucket: this.bucket,
    });

  }
}

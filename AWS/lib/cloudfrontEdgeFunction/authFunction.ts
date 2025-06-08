import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Duration } from 'aws-cdk-lib';

export interface AuthFunctionProps {
  cognitoUserPoolRegion: string;
  cognitoUserPoolId: string;
  cognitoGroup?: string;
}

export class AuthFunction extends Construct {
  public edgeFunction: cloudfront.experimental.EdgeFunction

  constructor(scope: Construct, id: string, props: AuthFunctionProps) {
    super(scope, id);

    // Create the Lambda@Edge function
    this.edgeFunction = new cloudfront.experimental.EdgeFunction(this, 'AuthFunction', {
      runtime: lambda.Runtime.NODEJS_18_X, // Lambda@Edge supports Node.js 18.x
      handler: 'index.handler',
      code: lambda.Code.fromAsset('./src/edgeAuth/build'),
      timeout: Duration.seconds(5), // Maximum allowed for viewer request/response is 5 seconds
      memorySize: 128,
      description: 'CloudFront authentication edge function',
    });
  }
}

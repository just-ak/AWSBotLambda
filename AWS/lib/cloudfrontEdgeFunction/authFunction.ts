import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Duration, Stack } from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

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
      
      code: lambda.Code.fromAsset('./src/edgeAuth/'),
      timeout: Duration.seconds(5), // Maximum allowed for viewer request/response is 5 seconds
      memorySize: 128,
      description: 'CloudFront authentication edge function',
    });
    
    // Set environment variables that will be used during build/deployment
    // Note: These won't be available at runtime as Lambda@Edge doesn't support env vars
    // this.edgeFunction.addEnvironment('COGNITO_USER_POOL_REGION', props.cognitoUserPoolRegion, { removeInEdge: true });
    // this.edgeFunction.addEnvironment('COGNITO_USER_POOL_ID', props.cognitoUserPoolId, { removeInEdge: true });
    
    // if (props.cognitoGroup) {
    //   this.edgeFunction.addEnvironment('COGNITO_GROUP', props.cognitoGroup, { removeInEdge: true });
    // }
  }
}

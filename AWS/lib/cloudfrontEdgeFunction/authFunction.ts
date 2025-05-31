
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Duration, Stack } from 'aws-cdk-lib';

export interface AuthFunctionProps {
  // cognitoUserPoolRegion: string;
  // cognitoUserPoolId: string;
  // cognitoGroup?: string;

}

export class AuthFunction extends Construct {
  public edgeFunction: cloudfront.experimental.EdgeFunction

  constructor(scope: Construct, id: string, props: AuthFunctionProps) {
    super(scope, id), {...props, };

  this.edgeFunction = new cloudfront.experimental.EdgeFunction(this, 'AuthFunction', {
            runtime: lambda.Runtime.NODEJS_LATEST,
            handler: 'index.handler',
            code: lambda.Code.fromAsset('./src/edgeAuth'),
            timeout: Duration.seconds(5),
            // environment: {
            //     COGNITO_USER_POOL_REGION: props.cognitoUserPoolRegion || 'eu-west-2', // Default to eu-west-1 if not provided
            //     COGNITO_USER_POOL_ID: props.cognitoUserPoolId || 'eu-west-2_123456789', // Default to a placeholder if not provided
            //     COGNITO_GROUP: props.cognitoGroup || 'AzureADGroup', // Default to a placeholder if not provided
            // }
        });
        // Get the stack this construct is part of
//   this.edgeFunction.addEnvironment('COGNITO_USER_POOL_REGION', 'eu-west-1', { removeInEdge: true });
// fn.addEnvironment('COGNITO_USER_POOL_ID', 'abc123', { removeInEdge: true });
// fn.addEnvironment('COGNITO_GROUP', 'admin', { removeInEdge: true });
    
  }
}

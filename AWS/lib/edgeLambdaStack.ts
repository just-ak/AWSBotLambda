import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as iam from 'aws-cdk-lib/aws-iam';
import { CrossRegionSsmParameter } from './ssm/crossRegion';
import { AuthFunction } from './cloudfrontEdgeFunction/authFunction';
import * as dotenv from 'dotenv';
dotenv.config();
const COGNITO_AWS_REGION = process.env.COGNITO_AWS_REGION || 'eu-west-2';
// const AWS_HOSTED_ZONE_ID = process.env.AWS_HOSTED_ZONE_ID || 'default_hosted_zone_id';

export interface EdgeLambdaStackProps extends cdk.StackProps {

}

export class EdgeLambdaStack extends cdk.Stack {
  public readonly crossRegionSsmParameter: CrossRegionSsmParameter;
  public readonly authFunction: AuthFunction;
  public readonly cognitoAuthUserPoolUserPoolArn: ssm.IStringParameter;
  public readonly cognitoUserPoolRegion: string = COGNITO_AWS_REGION;
  public readonly cognitoUserPoolId: string;

  constructor(scope: Construct, id: string, props: EdgeLambdaStackProps) {
    // Ensure the certificate is created in us-east-1
    super(scope, id, {
      ...props,
      env: { region: 'us-east-1' }, // Force us-east-1 region for CloudFront edge functions
    });

    // Try to get the Cognito User Pool ARN from SSM
    try {
      this.cognitoAuthUserPoolUserPoolArn = ssm.StringParameter.fromStringParameterAttributes(
        this, 'cognitoAuthUserPoolUserPoolArn',
        { parameterName: '/cognitoAuth/userPool/userPoolArn' }
      );
      
      // Extract the user pool ID from the ARN
      this.cognitoUserPoolId = cdk.Fn.select(1, cdk.Fn.split('/userPool/', this.cognitoAuthUserPoolUserPoolArn.stringValue));
    } catch (error) {
      // Use a default value if the parameter doesn't exist yet
      this.cognitoUserPoolId = 'placeholder-user-pool-id';
      console.warn('Could not find Cognito User Pool ARN in SSM, using placeholder value');
    }

    // Create the edge function with necessary permissions
    this.authFunction = new AuthFunction(this, 'AuthFunction', {
      cognitoUserPoolRegion: this.cognitoUserPoolRegion,
      cognitoUserPoolId: this.cognitoUserPoolId,
    });

    // Add explicit permissions for the Lambda@Edge function to access Cognito
    const cognitoPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'cognito-idp:DescribeUserPool',
        'cognito-idp:DescribeUserPoolClient',
        'cognito-idp:ListUserPoolClients',
        'cognito-idp:GetUser',
        'cognito-idp:GetUserPoolMfaConfig'
      ],
      resources: ['*'] // It's better to scope this down when possible
    });

    this.authFunction.edgeFunction.addToRolePolicy(cognitoPolicy);

    // Store the Lambda function ARN in a cross-region SSM parameter
    this.crossRegionSsmParameter = new CrossRegionSsmParameter(this, 'CrossRegionSsmParameter', {
      parameterName: '/edgelambda/authFunction/arn',
      parameterValue: this.authFunction.edgeFunction.currentVersion.functionArn,
      region: COGNITO_AWS_REGION
    });

    // Output the Lambda function ARN for reference
    new cdk.CfnOutput(this, 'EdgeFunctionArn', {
      value: this.authFunction.edgeFunction.functionArn,
      description: 'ARN of the edge function'
    });

    new cdk.CfnOutput(this, 'EdgeFunctionVersionArn', {
      value: this.authFunction.edgeFunction.currentVersion.functionArn,
      description: 'ARN of the edge function version'
    });
  }
}

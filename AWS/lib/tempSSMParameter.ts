import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { CrossRegionSsmParameter } from './ssm/crossRegion';
import { AuthFunction } from './cloudfrontEdgeFunction/authFunction';


export interface TempSSMParameterProps extends cdk.StackProps {

}

export class TempSSMParameterStack extends cdk.Stack {
  public readonly crossRegionSsmParameter: CrossRegionSsmParameter;
  public readonly authFunction: AuthFunction;
  public readonly cognitoAuthUserPoolUserPoolArn: ssm.IStringParameter;

  constructor(scope: Construct, id: string, props: TempSSMParameterProps) {
    // Ensure the certificate is created in us-east-1
    super(scope, id, {
      ...props,
      env: { region: 'us-east-1' }, // Force us-east-1 region for CloudFront certificates
    });


    new ssm.StringParameter(this, 'cognitoAuthUserPoolUserPoolArn', {
      parameterName: '/cognitoAuth/userPool/userPoolArn',
      stringValue: '*',   // literal asterisk character
      description: 'Temp SSM Parameter for Cognito User Pool ARN',
      tier: ssm.ParameterTier.STANDARD,
    });

    //   new ssm.StringParameter(this, 'cognitoAuthUserPoolUserPoolArn', {
    //   parameterName: '/cognitoAuth/userPool/userPoolArn',
    //   stringValue: '*',   // literal asterisk character
    //   description: 'Temp SSM Parameter for Cognito User Pool ARN',
    //   tier: ssm.ParameterTier.STANDARD,
    // });

    //   new ssm.StringParameter(this, 'cognitoAuthUserPoolUserPoolArn', {
    //   parameterName: '/cognitoAuth/userPool/userPoolArn',
    //   stringValue: '*',   // literal asterisk character
    //   description: 'Temp SSM Parameter for Cognito User Pool ARN',
    //   tier: ssm.ParameterTier.STANDARD,
    // });

    //   new ssm.StringParameter(this, 'cognitoAuthUserPoolUserPoolArn', {
    //   parameterName: '/cognitoAuth/userPool/userPoolArn',
    //   stringValue: '*',   // literal asterisk character
    //   description: 'Temp SSM Parameter for Cognito User Pool ARN',
    //   tier: ssm.ParameterTier.STANDARD,
    // });

  }
}

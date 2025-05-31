import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as iam from 'aws-cdk-lib/aws-iam';
import { CrossRegionSsmParameter } from './ssm/crossRegion';
import { AuthFunction } from './cloudfrontEdgeFunction/authFunction';


export interface EdgeLambdaStackProps extends cdk.StackProps {

}

export class EdgeLambdaStack extends cdk.Stack {
  public readonly crossRegionSsmParameter: CrossRegionSsmParameter;
  public readonly authFunction: AuthFunction;
  public readonly cognitoAuthUserPoolUserPoolArn: ssm.IStringParameter;
  public readonly cognitoUserPoolRegion: ssm.IStringParameter;
  public readonly cognitoUserPoolId: ssm.IStringParameter;
  public readonly cognitoGroup: ssm.IStringParameter;

  constructor(scope: Construct, id: string, props: EdgeLambdaStackProps) {
    // Ensure the certificate is created in us-east-1
    super(scope, id, {
      ...props,
      env: { region: 'us-east-1' }, // Force us-east-1 region for CloudFront certificates
    });

    this.cognitoAuthUserPoolUserPoolArn = ssm.StringParameter.fromStringParameterAttributes(
      this, 'cognitoAuthUserPoolUserPoolArn',
      { parameterName: '/cognitoAuth/userPool/userPoolArn' }
    );

    // this.cognitoUserPoolRegion = ssm.StringParameter.fromStringParameterAttributes(
    //   this, 'cognitoUserPoolRegion',
    //   { parameterName: '/cognitoUserPoolRegion' }
    // );

    // this.cognitoUserPoolId = ssm.StringParameter.fromStringParameterAttributes(
    //   this, 'cognitoUserPoolId',
    //   { parameterName: '/cognitoUserPoolId' }
    // );

    // this.cognitoGroup = ssm.StringParameter.fromStringParameterAttributes(
    //   this, 'cognitoGroup',
    //   { parameterName: '/cognitoGroup' }
    // );


    this.authFunction = new AuthFunction(this, 'AuthFunction', {
      // cognitoUserPoolRegion: this.cognitoUserPoolRegion.stringValue,
      // cognitoUserPoolId: this.cognitoUserPoolId.stringValue,
      // cognitoGroup: this.cognitoGroup.stringValue
    });


    // Allow the function to describe the user pool
    this.authFunction.edgeFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: ['cognito-idp:DescribeUserPool', 'cognito-idp:DescribeUserPoolClient'],
      resources: [this.cognitoAuthUserPoolUserPoolArn.stringValue
      ]
    }));

    this.crossRegionSsmParameter = new CrossRegionSsmParameter(this, 'CrossRegionSsmParameter', {
      parameterName: '/edgelambda/authFunction/arn',
      parameterValue: this.authFunction.edgeFunction.functionArn,
      region: 'eu-west-2'
    });
  }
}

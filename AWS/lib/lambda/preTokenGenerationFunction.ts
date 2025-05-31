import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export interface PreTokenGenerationFunctionProps {
  azureGroupName: string;
}

export class PreTokenGenerationFunction extends Construct {
  public lambdaFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: PreTokenGenerationFunctionProps) {
    super(scope, id);

    this.lambdaFunction = new lambda.Function(this, 'PreTokenGenerationFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('src/authTrigger'),
      timeout: cdk.Duration.seconds(30),
      environment: {
        AUTHORIZED_AZURE_GROUP: props.azureGroupName
      }
    });

  }
}

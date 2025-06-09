import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

export interface PreTokenGenerationFunctionProps {
  providerName: string; // Name of the identity provider, e.g., 'AzureAD'
}

export class PreTokenGenerationFunction extends Construct {
  public lambdaFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: PreTokenGenerationFunctionProps) {
    super(scope, id);

    // this.lambdaFunction = new lambda.Function(this, 'PreTokenGenerationFunction', {
    //  runtime: lambda.Runtime.NODEJS_20_X,
    //     handler: 'index.handler',
    //     code: lambda.Code.fromAsset('src/preTokenGenerationFunction'),
    //     timeout: cdk.Duration.seconds(30),


    this.lambdaFunction = new NodejsFunction(this, `preTokenGenerationFunction`, {

      functionName: `preTokenGenerationFunction`,
      entry: './src/preTokenGenerationFunction/index.ts',
      memorySize: 256,
      timeout: cdk.Duration.seconds(900),
      // role: lambdaRole,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      environment: {
        PROVIDER_NAME: props.providerName
      }
    });

  }
}

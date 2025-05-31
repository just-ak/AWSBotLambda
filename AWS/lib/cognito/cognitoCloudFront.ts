import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { CognitoAzureAuth } from './cognitoAzureAuth';
import { PreTokenGenerationFunction } from '../lambda/preTokenGenerationFunction';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { AuthFunction } from '../cloudfrontEdgeFunction/authFunction';
import { CrossRegionSsmParameter } from '../ssm/crossRegion';
/**
 * Properties for the CloudFrontCognitoAuth construct
 */
export interface CloudFrontCognitoAuthProps {
    /**
     * The origin to protect with Cognito authentication
     */
    origin: cloudfront.IOrigin;

    /**
     * The name of the user pool
     */
    userPoolName: string;

    /**
     * Azure AD tenant ID
     */
    azureTenantId: string;

    /**
     * Azure AD client ID
     */
    azureClientId: string;

    /**
     * Azure AD group to map to Cognito
     */
    azureGroupName: string;
    azureClientSecret: string;
}

/**
 * CloudFrontCognitoAuth construct creates a CloudFront distribution with a Cognito
 * authentication layer using Azure AD as the identity provider
 */
export class CloudFrontCognitoAuth extends Construct {
    /**
     * The CloudFront distribution
     */
    public readonly distribution: cloudfront.Distribution;
    public readonly edgeFunctionVersion: lambda.IVersion;
    /**
     * The Cognito authentication construct
     */
    public readonly cognitoAuth: CognitoAzureAuth;
    public readonly preTokenGenerationFunction: PreTokenGenerationFunction;
    public readonly authFunction: AuthFunction;
    public readonly cognitoAuthUserPoolUserPoolArn: CrossRegionSsmParameter;
    public readonly lambdaVersionArn: string;


    constructor(scope: Construct, id: string, props: CloudFrontCognitoAuthProps) {
        super(scope, id);

        this.preTokenGenerationFunction = new PreTokenGenerationFunction(this, 'PreTokenGenerationFunction', {
            azureGroupName: props.azureGroupName
        });

        // Create the Cognito authentication construct
        this.cognitoAuth = new CognitoAzureAuth(this, 'CognitoAuth', {
            userPoolName: props.userPoolName,
            azureTenantId: props.azureTenantId,
            azureClientId: props.azureClientId,
            azureClientSecret: props.azureClientSecret, // Add this line
            azureGroupName: props.azureGroupName,
            preTokenGenerationFunction: this.preTokenGenerationFunction.lambdaFunction,
        });
        //  the ssm parameter to stors the auth function ARN '/edgelambda/authFunction/FunctionArn' reteive the auth function ARN from the authFunction construct

        // this.lambdaVersionArn = ssm.StringParameter.valueForStringParameter(
        //     this,
        //     '/edgelambda/authFunction/arn'
        // );

        this.lambdaVersionArn = ssm.StringParameter.fromStringParameterAttributes(
            this, 'edgelambdaAuthFunctionArn',
            { parameterName: '/edgelambda/authFunction/arn' }
        ).stringValue;


        this.edgeFunctionVersion = lambda.Version.fromVersionArn(
            this,
            'ImportedEdgeLambdaVersion',
            this.lambdaVersionArn
        );


        this.cognitoAuthUserPoolUserPoolArn = new CrossRegionSsmParameter(this, 'CrossRegionSsmParameter', {
            parameterName: '/cognitoAuth/userPool/userPoolArn',
            parameterValue: this.cognitoAuth.userPool.userPoolArn,
            region: 'us-east-1'
        });
    }
}
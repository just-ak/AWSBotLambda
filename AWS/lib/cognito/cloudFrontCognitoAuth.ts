import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { CognitoAzureAuth } from './cognitoAzureOIDC';
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
    providerName: string; // Optional provider name for the pre-token generation function
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
            // azureGroupName: props.azureGroupName,
            providerName: props.providerName, //'AzureAD' // Default provider name, can be customized
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
        // First check if the SSM parameter exists
        try {
            this.lambdaVersionArn = ssm.StringParameter.valueForStringParameter(
                this,
                '/edgelambda/authFunction/arn'
            );
            // Import the edge function version from the ARN
            this.edgeFunctionVersion = lambda.Version.fromVersionArn(
                this,
                'ImportedEdgeLambdaVersion',
                this.lambdaVersionArn
            );
        } catch (error) {
            // If the parameter doesn't exist, create a placeholder - this will be updated after deployment
            console.warn('Could not find edge function ARN in SSM,expo the stack might need to be deployed in multiple stages');

            // Create a dummy version ARN for first deployment
            this.lambdaVersionArn = `arn:aws:lambda:us-east-1:123456789012:function:placeholder-function:1`;

            // Create a dummy version - this will cause an error if referenced before the actual resource is created
            this.edgeFunctionVersion = lambda.Version.fromVersionArn(
                this,
                'PlaceholderEdgeLambdaVersion',
                this.lambdaVersionArn
            );
        }

        // Create an SSM parameter for the Cognito user pool ARN for the edge function to use
        this.cognitoAuthUserPoolUserPoolArn = new CrossRegionSsmParameter(this, 'CrossRegionSsmParameter', {
            parameterName: '/cognitoAuth/userPool/userPoolArn',
            parameterValue: this.cognitoAuth.userPool.userPoolArn,
            region: 'us-east-1'
        });
    }
}
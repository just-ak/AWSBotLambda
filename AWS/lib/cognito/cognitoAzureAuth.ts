import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import * as dotenv from 'dotenv';
dotenv.config();
// const AWS_HOSTED_ZONE_ID = process.env.AWS_HOSTED_ZONE_ID || 'default_hosted_zone_id';
const AWS_HOSTED_ZONE_NAME = process.env.AWS_HOSTED_ZONE_NAME || 'default_hosted_zone_name';
const AWS_API_ENDPOINT_NAME = process.env.AWS_API_ENDPOINT_NAME || 'default_cert_domain';
const COGNITO_USER_POOL_DOMAIN = process.env.COGNITO_USER_POOL_DOMAIN || 'default_cognito_domain';
// const AWS_CLOUDFRONT_SUBDOMAIN = process.env.AWS_CLOUDFRONT_SUBDOMAIN || 'www';


/**
 * Properties for the CognitoAzureAuth construct
 */
export interface CognitoAzureAuthProps {
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

  /**
   * Azure AD client secret
   */
  azureClientSecret: string;

  /**
   * Optional pre-token generation Lambda function
   */
  preTokenGenerationFunction?: lambda.IFunction;
}

/**
 * CognitoAzureAuth construct creates a Cognito User Pool with Azure AD integration
 * for authentication and authorization with CloudFront
 */
export class CognitoAzureAuth extends Construct {
  /**
   * The Cognito User Pool
   */
  public readonly userPool: cognito.UserPool;

  /**
   * The Cognito User Pool Client
   */
  public readonly userPoolClient: cognito.UserPoolClient;

  /**
   * The Cognito Identity Provider
   */
  public readonly identityProvider: cognito.UserPoolIdentityProviderOidc;

  constructor(scope: Construct, id: string, props: CognitoAzureAuthProps) {
    super(scope, id);

    // Create the user pool with email as the primary attribute
    this.userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: props.userPoolName,
      selfSignUpEnabled: false,
      signInAliases: {
        email: true
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true
        }
      },
      customAttributes: {
        groups: new cognito.StringAttribute({ mutable: true }),  // for groups claim mapping
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });

    // Add pre-token generation Lambda trigger if provided
    if (props.preTokenGenerationFunction) {
      this.userPool.addTrigger(
        cognito.UserPoolOperation.PRE_TOKEN_GENERATION,
        props.preTokenGenerationFunction
      );
    }

    // Configure the Azure AD Identity Provider

    this.identityProvider = new cognito.UserPoolIdentityProviderOidc(this, 'AzureADProvider', {
      userPool: this.userPool,
      name: 'AzureAD',
      clientId: props.azureClientId,
      clientSecret: props.azureClientSecret,
      issuerUrl: `https://login.microsoftonline.com/${props.azureTenantId}/v2.0`,
      // https://login.microsoftonline.com/${props.azureTenantId}/v2.0/.well-known/openid-configuration

      attributeMapping: {
        email: cognito.ProviderAttribute.other('email'),
        givenName: cognito.ProviderAttribute.other('given_name'),
        familyName: cognito.ProviderAttribute.other('family_name'),
        // custom: {
        //   'groups': cognito.ProviderAttribute.other('groups')
        // }
      },
      scopes: ['openid', 'profile', 'email'],
    });

    // Create a user pool client
    this.userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool: this.userPool,
      authFlows: {
        userPassword: true,
        userSrp: true,
        custom: true
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
          implicitCodeGrant: true
        },
        scopes: [cognito.OAuthScope.OPENID, cognito.OAuthScope.EMAIL, cognito.OAuthScope.PROFILE],
        callbackUrls: [`https://${AWS_API_ENDPOINT_NAME}.${AWS_HOSTED_ZONE_NAME}/callback`], // Replace with your actual callback URLs
        logoutUrls: [`https://${AWS_API_ENDPOINT_NAME}.${AWS_HOSTED_ZONE_NAME}/logout`]     // Replace with your actual logout URLs
      },
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.COGNITO,
        cognito.UserPoolClientIdentityProvider.custom((this.identityProvider as cognito.UserPoolIdentityProviderOidc).providerName)
      ]
    });

    // Wait for the identity provider to be created before creating the user pool domain
    this.userPoolClient.node.addDependency(this.identityProvider);


    this.userPool.addDomain('UserPoolDomain', {
      cognitoDomain: {
        domainPrefix: `${COGNITO_USER_POOL_DOMAIN}`
      }
    });
  }
}
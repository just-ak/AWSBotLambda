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
const COGNITO_APP_FEDERATION_METADATA_URL = process.env.COGNITO_APP_FEDERATION_METADATA_URL || `https://${AWS_API_ENDPOINT_NAME}.${AWS_HOSTED_ZONE_NAME}/prod/cognito/federation/metadata`;
const COGNITO_AZURE_CALLBACK_URL = process.env.COGNITO_AZURE_CALLBACK_URL || `https://${AWS_API_ENDPOINT_NAME}.${AWS_HOSTED_ZONE_NAME}/callback.html`;
// const AWS_CLOUDFRONT_SUBDOMAIN = process.env.AWS_CLOUDFRONT_SUBDOMAIN || 'www';
const COGNITO_PROVIDER_NAME = process.env.COGNITO_PROVIDER_NAME || 'default_user_pool_name';
const COGNITO_USER_POOL_NAME = process.env.COGNITO_USER_POOL_NAME || 'default_user_pool_name';
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
export class CognitoAuth extends Construct {
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
  // public readonly identityProvider: cognito.UserPoolIdentityProviderOidc;
  public readonly userPoolAzureSaml: cognito.UserPoolIdentityProviderSaml;
  public readonly cfnManagedLoginBranding: cognito.CfnManagedLoginBranding;

  constructor(scope: Construct, id: string, props: CognitoAzureAuthProps) {
    super(scope, id);

    // Create the user pool with email as the primary attribute
    this.userPool = new cognito.UserPool(this, 'userPool', {
      userPoolName: `${props.userPoolName}`,
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
        groups: new cognito.StringAttribute({ mutable: true })
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    this.userPoolAzureSaml = new cognito.UserPoolIdentityProviderSaml(this, 'userPoolAzureSaml', {
      userPool: this.userPool,
      name: COGNITO_PROVIDER_NAME,
      metadata: {
        metadataType: cognito.UserPoolIdentityProviderSamlMetadataType.URL,
        metadataContent: COGNITO_APP_FEDERATION_METADATA_URL, // `https://login.microsoftonline.com/${props.azureTenantId}/federationmetadata/2007-06/federationmetadata.xml`,
      },
      attributeMapping: {
        email: cognito.ProviderAttribute.other('http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'),
        givenName: cognito.ProviderAttribute.other('http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'),
        familyName: cognito.ProviderAttribute.other('http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname'),
        custom: {
          'custom:groups': cognito.ProviderAttribute.other('http://schemas.xmlsoap.org/ws/2005/05/identity/claims/groups')
        }
      },
      identifiers: [props.azureClientId],
    });


    // Add pre-token generation Lambda trigger if provided
    if (props.preTokenGenerationFunction) {
      this.userPool.addTrigger(
        cognito.UserPoolOperation.PRE_TOKEN_GENERATION,
        props.preTokenGenerationFunction
      );
    }

    this.userPoolClient = new cognito.UserPoolClient(this, 'userPoolClient', {
      userPoolClientName: COGNITO_USER_POOL_NAME, // 'AzureADClient',
      generateSecret: false, // Set to true if you need a client secret
      userPool: this.userPool,
      authFlows: {
        userPassword: false,
        userSrp: false,
        custom: false
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
          // implicitCodeGrant: false
        },
        scopes: [
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.PROFILE
        ],
        callbackUrls: [`https://${AWS_API_ENDPOINT_NAME}.${AWS_HOSTED_ZONE_NAME}/callback.html`], // Replace with your actual callback URLs
        logoutUrls: [`https://${AWS_API_ENDPOINT_NAME}.${AWS_HOSTED_ZONE_NAME}/logout.html`,
          `https://${AWS_API_ENDPOINT_NAME}.${AWS_HOSTED_ZONE_NAME}/logout.html?logoutComplete=true`
        ]     // Replace with your actual logout URLs
      },
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.COGNITO,
        cognito.UserPoolClientIdentityProvider.custom(this.userPoolAzureSaml.providerName)
      ]
    });

    // Wait for the identity provider to be created before creating the user pool domain
    // this.userPoolClient.node.addDependency(this.identityProvider);
    this.userPool.addDomain('UserPoolDomain', {
      cognitoDomain: {
        domainPrefix: `${COGNITO_USER_POOL_DOMAIN}`
      }

    });
    const cfnDomain = this.userPool.node.findChild('UserPoolDomain') as cognito.CfnUserPoolDomain;
    cfnDomain.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    const settings: any = {};
    this.cfnManagedLoginBranding = new cognito.CfnManagedLoginBranding(this, 'MyCfnManagedLoginBranding', {
      userPoolId: this.userPool.userPoolId,

      // the properties below are optional
      // assets: [{
      //   category: 'category',
      //   colorMode: 'colorMode',
      //   extension: 'extension',

      //   // the properties below are optional
      //   bytes: 'bytes',
      //   resourceId: 'resourceId',
      // }],
      clientId:  this.userPoolClient.userPoolClientId,
      // returnMergedResources: true,
      // settings: settings,
      useCognitoProvidedValues: true,
    });
  }
}
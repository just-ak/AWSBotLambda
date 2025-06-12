import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
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
      enableTokenRevocation: true,
      accessTokenValidity: cdk.Duration.minutes(15),
      idTokenValidity: cdk.Duration.minutes(15),
      refreshTokenValidity: cdk.Duration.days(30),
      authSessionValidity: cdk.Duration.minutes(15),
      preventUserExistenceErrors: true,
      // preventUserExistenceErrors: cognito.PreventUserExistenceErrorType.ENABLED,
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
        
      },
       managedLoginVersion: cognito.ManagedLoginVersion.NEWER_MANAGED_LOGIN,

    });
    const cfnDomain = this.userPool.node.findChild('UserPoolDomain') as cognito.CfnUserPoolDomain;
    cfnDomain.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

const backgroundImage = fs.readFileSync(path.join(__dirname, 'bg.jpg')).toString('base64');

    // https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-cognito-managedloginbranding.html
    // https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-properties-cognito-managedloginbranding-assettype.html
    /*
        Bytes
            The image file, in Base64-encoded binary.
            Required: No
            Type: String
            Maximum: 1000000
            Update requires: No interruption
        Category
            The category that the image corresponds to in your managed login configuration. Managed login has asset categories for different types of logos, backgrounds, and icons.
            Required: Yes
            Type: String
            Allowed values: FAVICON_ICO | FAVICON_SVG | EMAIL_GRAPHIC | SMS_GRAPHIC | AUTH_APP_GRAPHIC | PASSWORD_GRAPHIC | PASSKEY_GRAPHIC | PAGE_HEADER_LOGO | PAGE_HEADER_BACKGROUND | PAGE_FOOTER_LOGO | PAGE_FOOTER_BACKGROUND | PAGE_BACKGROUND | FORM_BACKGROUND | FORM_LOGO | IDP_BUTTON_ICON
            Update requires: No interruption
        ColorMode
            The display-mode target of the asset: light, dark, or browser-adaptive. For example, Amazon Cognito displays a dark-mode image only when the browser or application is in dark mode, but displays a browser-adaptive file in all contexts.
            Required: Yes
            Type: String
            Allowed values: LIGHT | DARK | DYNAMIC
            Update requires: No interruption
        Extension
            The file type of the image file.
            Required: Yes
            Type: String
            Allowed values: ICO | JPEG | PNG | SVG | WEBP
            Update requires: No interruption
        ResourceId
            The ID of the asset.
            Required: No
            Type: String
            Pattern: ^[\w\- ]+$
            Minimum: 1
            Maximum: 40
            Update requires: No interruption
    */

    const settings: any = {};
    this.cfnManagedLoginBranding = new cognito.CfnManagedLoginBranding(this, 'MyCfnManagedLoginBranding', {
      userPoolId: this.userPool.userPoolId,
      assets: [ {
        category: 'PAGE_BACKGROUND',
        colorMode: 'LIGHT',
        extension: 'JPEG',
        bytes: backgroundImage, // Replace with your actual base64 encoded logo
        // resourceId: 'logo-light',
      }, {
        category: 'PAGE_BACKGROUND',
        colorMode: 'DARK',
        extension: 'JPEG', // Replace with your actual base64 encoded logo
        bytes: backgroundImage, // Replace with your actual base64 encoded logo
        // resourceId: 'logo-dark',
      }],
      clientId:  this.userPoolClient.userPoolClientId,
      // returnMergedResources: true,
      // settings: settings,
      useCognitoProvidedValues: true,
    });
  }
}
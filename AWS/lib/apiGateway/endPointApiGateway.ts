import { Construct } from 'constructs';
import { ApiGateWayLogs } from '../cloudWatch/apiGateWayLogs';
import { RestApi, LogGroupLogDestination, AccessLogFormat, MethodLoggingLevel, RequestAuthorizer, LambdaIntegration, Period, CfnRestApi, ContentHandling } from 'aws-cdk-lib/aws-apigateway';
import { Role, ServicePrincipal, ManagedPolicy } from 'aws-cdk-lib/aws-iam';
import { Authorizer } from '../lambda/authorizer';
import { Duration } from 'aws-cdk-lib';
import { IFunction } from 'aws-cdk-lib/aws-lambda';


export interface EndPointApiGatewayProps {
  // assetsBucket: Bucket;
  // documentationBucket: Bucket
  postLambda: IFunction;
}

export class EndPointApiGateway extends Construct {
  readonly api: RestApi;

  constructor(scope: Construct, id: string, props: EndPointApiGatewayProps) {
    super(scope, id);


    const apiGateWayLogs = new ApiGateWayLogs(this, 'ApiGateWayLogs', {});

    // create role for aws cloudwatchlogs AmazonAPIGatewayPushToCloudWatchLogs
    const apiGatewayRole = new Role(this, 'ApiGatewayRole', {
      roleName: 'CustomApiGatewayRole',
      assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
      managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonAPIGatewayPushToCloudWatchLogs')],
    });
    // Add API Gateway
    this.api = new RestApi(this, 'notificationsApi', {
      restApiName: 'Notifications Service',
      description: 'This service handles notifications.',
      // binaryMediaTypes: ['image/png', 'image/jpeg'],
      deployOptions: {
        accessLogDestination: new LogGroupLogDestination(apiGateWayLogs.logGroup),
        accessLogFormat: AccessLogFormat.jsonWithStandardFields(),
        tracingEnabled: true, // Enable X-Ray tracing
        loggingLevel: MethodLoggingLevel.INFO, // Set logging level

      },
    });

    // log api requests
    this.api.addRequestValidator('RequestValidator', {
      validateRequestBody: true,
      validateRequestParameters: true,
    });


    // const proxyLambda = new ProxyLambda(this, 'messageReducerLambda', {
    //   bucket: props.bucket
    // });

    // const lambdaIntegration = new LambdaIntegration(proxyLambda.lambda, {
    //   proxy: true,
    //   contentHandling: ContentHandling.CONVERT_TO_BINARY,
    // });
    // this.api.root.addResource('{proxy+}').addMethod('GET', lambdaIntegration);

    const adaptiveBotAPI = new LambdaIntegration(props.postLambda);

    const apiKey = this.api.addApiKey('ApiKey', {
      apiKeyName: 'TeamsBotApiKey',
      description: 'API key for Microsoft Teams bot',
    });


    // Create a usage plan
    const usagePlan = this.api.addUsagePlan('UsagePlan', {
      name: 'TeamsBotUsagePlan',
      throttle: {
        rateLimit: 10,
        burstLimit: 20,
      },
      quota: {
        limit: 1000,
        period: Period.DAY,
      },
    });

    // Associate the API key with the usage plan
    usagePlan.addApiKey(apiKey);
    usagePlan.addApiStage({
      stage: this.api.deploymentStage,
    });


    // Additional security configuration for API Gateway
    const cfnApi = this.api.node.defaultChild as CfnRestApi;
    cfnApi.addPropertyOverride('MinimumCompressionSize', 0); // Enable compression

    // Add WAF if needed (requires additional imports and configuration)
    // Consider adding AWS WAF for additional protection against common exploits


    // Create a Lambda authorizer function
    const authorizer = new Authorizer(this, 'authorizerFunction', {
    });
    // Create the authorizer for API Gateway
    const bearerAuthorizer = new RequestAuthorizer(this, 'BearerTokenAuthorizer', {
      handler: authorizer.lambda,
      identitySources: ['method.request.header.Authorization'],
      resultsCacheTtl: Duration.minutes(5),
    });
    // Add authorization to your methods
    this.api.root.addMethod('POST', adaptiveBotAPI, {
      // apiKeyRequired: true, // Require API key
      authorizer: bearerAuthorizer, // Require bearer token authorization
    });

  }
}
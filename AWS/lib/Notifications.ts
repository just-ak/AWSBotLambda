import { Stack, RemovalPolicy, Duration, StackProps } from "aws-cdk-lib";
import { AccessLogFormat, EndpointType, LambdaIntegration, LogGroupLogDestination, MethodLoggingLevel, Period, RestApi, SecurityPolicy } from "aws-cdk-lib/aws-apigateway";
import { Certificate, CertificateProps, CertificateValidation, ValidationMethod } from "aws-cdk-lib/aws-certificatemanager";
import { Table, AttributeType, BillingMode } from "aws-cdk-lib/aws-dynamodb";
import { Rule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import { PolicyStatement, Effect, ManagedPolicy, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Runtime, Tracing } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { ARecord, HostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { ApiGatewayDomain } from "aws-cdk-lib/aws-route53-targets";
import { Topic } from "aws-cdk-lib/aws-sns";
import { Construct } from "constructs";

import * as dotenv from 'dotenv';
dotenv.config();

const AWS_HOSTED_ZONE_ID = process.env.AWS_HOSTED_ZONE_ID || 'default_hosted_zone_id';
const AWS_HOSTED_ZONE_NAME = process.env.AWS_HOSTED_ZONE_NAME || 'default_hosted_zone_name';
const AWS_API_ENDPOINT_NAME = process.env.AWS_API_ENDPOINT_NAME || 'default_cert_domain';
const BOT_ID = process.env.BOT_ID || 'default_bot_id';
const BOT_TYPE = process.env.BOT_TYPE || 'default_bot_type';
const BOT_TENANT_ID = process.env.BOT_TENANT_ID || 'default_bot_tenant_id';
const BOT_PASSWORD = process.env.BOT_PASSWORD || 'default_bot_password';
const BOT_NAME = process.env.BOT_NAME || 'default_bot_name';


export class Notifications extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id);

    const snsTopic = new Topic(this, 'awsNotificationsTopic', {
      displayName: `awsNotificationsTopic`,
    });

    const messageDeduplicationTable = new Table(this, 'MessageDeduplicationTable', {
      partitionKey: { name: 'id', type: AttributeType.STRING },
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const notificationPermissions = new PolicyStatement({
      sid: 'AcmPermissions',
      effect: Effect.ALLOW,
      //TODO:  Complete List of Permissions
      actions: ['sns:*', 'tag:*', 'dynamodb:*', 'ssm:*', 'trustedadvisor:*', 'iam:*', 'cloudwatch:*'],
      resources: ['*'],
    });

    const lambdaRolePolicy: ManagedPolicy = new ManagedPolicy(this, 'notificationPermissionsPolicy,', {
      description: `lambdaRolePolicy`,
      managedPolicyName: `lambdaRolePolicy`,
      statements: [/*lambdaPolicyStatement,*/ notificationPermissions],
    });

    const notificationsLambdaROle = new Role(this, 'notificationPermissionsLambdaRole', {
      path: '/infrastructure/',
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'), lambdaRolePolicy],
    });

    const messageReducerFunction = new NodejsFunction(this, `messageReducer`, {
      functionName: `messageReducer`,
      entry: './src/notifications/messageReducer.ts',
      memorySize: 256,
      timeout: Duration.seconds(900),
      role: notificationsLambdaROle,
      runtime: Runtime.NODEJS_20_X,
      handler: 'handler',
      environment: {
        SNS_TOPIC_ARN: snsTopic.topicArn,
        dynamoDb: messageDeduplicationTable.tableName,
      },
      tracing: Tracing.ACTIVE, // Enable X-Ray tracing

    });

    const adaptiveBot = new NodejsFunction(this, `adaptiveBot`, {
      functionName: `adaptiveBot`,
      entry: './src/adaptiveBot/adaptiveBot.ts',
      memorySize: 512,
      timeout: Duration.seconds(900),
      role: notificationsLambdaROle,
      runtime: Runtime.NODEJS_20_X,
      handler: 'handler',
      environment: {
        BOT_ID: BOT_ID,
        BOT_TYPE: BOT_TYPE,
        BOT_TENANT_ID: BOT_TENANT_ID,
        BOT_PASSWORD: BOT_PASSWORD,
        BOT_NAME: BOT_NAME,
      },
      tracing: Tracing.ACTIVE, // Enable X-Ray tracing

    });

    const healthEventConversationsTable = new Table(this, 'HealthEventConversationsTable', {
      partitionKey: {
        name: 'conversationId',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'userId',
        type: AttributeType.STRING,
      },
      tableName: 'HealthEventConversations',  // Optional, name the table if required
      billingMode: BillingMode.PAY_PER_REQUEST,  // On-demand billing, suitable for unknown traffic patterns
      removalPolicy: RemovalPolicy.DESTROY, // Automatically delete the table if stack is deleted (use carefully in production)
    });

    adaptiveBot.addToRolePolicy(new PolicyStatement({
      actions: ['dynamodb:GetItem', 'dynamodb:PutItem'],
      resources: [healthEventConversationsTable.tableArn],
    }));
    

    interface RuleConfig {
      source: string[];
      detailType?: string[];
      detail?: {
        'status-details': {
          status: string[];
        };
      };
    }

    const rules: RuleConfig[] = [
      // {
      //   source: ['aws.chatbot'],
      // },
      // {
      //   source: ['aws.trustedadvisor'],
      //   detailType: ['Trusted Advisor Pursuit Daily Digest'],
      // },
      {
        source: ['aws.ssm'],
        detailType: ['Parameter Store Change', 'Parameter Store Policy Action'],
      },
      // {
      //   source: ['aws.iam'],
      // },
      // {
      //   source: ['aws.health'],
      // },
      // {
      //   source: ['aws.support'],
      // },
      // {
      //   source: ['aws.budgets'],
      // },
      // {
      //   source: ['aws.cloudformation'],
      //   detailType: ['CloudFormation Stack Status Change'],
      //   detail: {
      //     'status-details': {
      //       status: [
      //         'FAILED',
      //         'ROLLBACK_FAILED',
      //         'ROLLBACK_COMPLETE',
      //         'DELETE_FAILED',
      //         'UPDATE_ROLLBACK_FAILED',
      //         'UPDATE_ROLLBACK_COMPLETE',
      //         'CREATE_FAILED',
      //         'UPDATE_FAILED',
      //       ],
      //     },
      //   },
      // },
      // {
      //   source: ['aws.quotas'], // TestMe
      // },
      // {
      //   source: ['aws.codepipeline'], // TestMe
      // },
    ];
    rules.map((rule) => {
      new Rule(this, `${rule.source.join().replace('.', '_').replace(',', '_')}`, {
        eventPattern: rule,
        targets: [new LambdaFunction(messageReducerFunction)],
      });
    });

    const logGroup = new LogGroup(this, 'ApiGatewayAccessLogs', {
      retention: RetentionDays.ONE_DAY,
    });

  // create role for aws cloudwatchlogs AmazonAPIGatewayPushToCloudWatchLogs
  const apiGatewayRole = new Role(this, 'ApiGatewayRole', {
    roleName: 'CustomApiGatewayRole',
    assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
    managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonAPIGatewayPushToCloudWatchLogs')],
  });
  // Add API Gateway
  const api = new RestApi(this, 'notificationsApi', {
    restApiName: 'Notifications Service',
    description: 'This service handles notifications.',
    
    deployOptions: {
      accessLogDestination: new LogGroupLogDestination(logGroup),
      accessLogFormat: AccessLogFormat.jsonWithStandardFields(),
      tracingEnabled: true, // Enable X-Ray tracing
      loggingLevel: MethodLoggingLevel.INFO, // Set logging level
   
    },
  });

  const adaptiveBotAPI = new LambdaIntegration(adaptiveBot);
  // const getNotificationsIntegration = new LambdaIntegration(teamsbot);
  
  // api.root.addMethod('GET', getNotificationsIntegration); // GET /
  api.root.addMethod('POST', adaptiveBotAPI); // GET /

  // // add method for path notifications
  // const notifications = api.root.addResource('notifications');
  // notifications.addMethod('POST', getNotificationsIntegration); // GET /notifications

  // const help = api.root.addResource('help');
  // help.addMethod('POST', adaptiveBotAPI); // GET /notifications

  // const trusted = api.root.addResource('trusted');
  // trusted.addMethod('POST', adaptiveBotAPI); // GET /notifications


  // const adaptiveAPI = api.root.addResource('adaptive');
  // adaptiveAPI.addMethod('POST', adaptiveBotAPI); // POST /adaptive

  // log api requests
  api.addRequestValidator('RequestValidator', {
    validateRequestBody: true,
    validateRequestParameters: true,
  });
  
  const apiKey = api.addApiKey('ApiKey', {
    apiKeyName: 'TeamsBotApiKey',
    description: 'API key for Microsoft Teams bot',
  });

  // // Create a usage plan
  // const usagePlan = api.addUsagePlan('UsagePlan', {
  //   name: 'TeamsBotUsagePlan',
  //   throttle: {
  //     rateLimit: 10,
  //     burstLimit: 10,
  //   },
  //   quota: {
  //     limit: 1000,
  //     period: Period.DAY,
  //   },
  // });

  // usagePlan.addApiKey(apiKey);

  const hostedZoneId = AWS_HOSTED_ZONE_ID; // Replace with your hosted zone ID
  const hostedZone = HostedZone.fromHostedZoneId(this,'HostedZone', hostedZoneId);
  const newCert = new Certificate(this, 'Certificate', {
    domainName: `${AWS_API_ENDPOINT_NAME}.${AWS_HOSTED_ZONE_NAME}`, 
    validation: CertificateValidation.fromDns(hostedZone),
     
    });
  const domainName = api.addDomainName('CustomDomainA', {
    domainName: `${AWS_API_ENDPOINT_NAME}.${AWS_HOSTED_ZONE_NAME}`, 
    certificate: newCert,
    endpointType: EndpointType.REGIONAL,
    securityPolicy: SecurityPolicy.TLS_1_2,
  });
  

// // Map the custom domain to the API stage
// domainName.addBasePathMapping(api, {
//   basePath: '', // Root path
//   stage: api.deploymentStage,
// });

// // Add Route 53 alias record for the custom domain
new ARecord(this, 'CustomDomainAliasRecord', {
  zone:  HostedZone.fromHostedZoneAttributes(this,'HostedZoneAtr', {
    hostedZoneId: hostedZoneId,
    zoneName: AWS_HOSTED_ZONE_NAME,
  }),
  recordName: AWS_API_ENDPOINT_NAME, // Subdomain
  target: RecordTarget.fromAlias(new ApiGatewayDomain(domainName)),
});
  }
}

import { Construct } from 'constructs';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Duration } from 'aws-cdk-lib';
import { PolicyStatement, Effect, ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Runtime, Tracing } from 'aws-cdk-lib/aws-lambda';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import * as dotenv from 'dotenv';
dotenv.config();
const BOT_ID = process.env.BOT_ID || 'default_bot_id';
const BOT_TYPE = process.env.BOT_TYPE || 'default_bot_type';
const BOT_TENANT_ID = process.env.BOT_TENANT_ID || 'default_bot_tenant_id';
const BOT_PASSWORD = process.env.BOT_PASSWORD || 'default_bot_password';
const BOT_NAME = process.env.BOT_NAME || 'default_bot_name';


export interface AdaptiveBotProps {
  topic: Topic;
  table: Table
}

export class AdaptiveBot extends Construct {
  readonly lambda: NodejsFunction;

  constructor(scope: Construct, id: string, props: AdaptiveBotProps) {
    super(scope, id);

    const permissionPolicyStatement = new PolicyStatement({
      sid: 'AcmPermissions',
      effect: Effect.ALLOW,
      //TODO:  Complete List of Permissions
      actions: ['sns:*', 'tag:*', 'dynamodb:*', 'ssm:*', 'trustedadvisor:*', 'iam:*', 'cloudwatch:*'],
      resources: ['*'],
    });

    const lambdaRolePolicy: ManagedPolicy = new ManagedPolicy(this, 'notificationPermissionsPolicy,', {
      description: `lambdaRolePolicy`,
      managedPolicyName: `AdaptiveBotLambdaPolicy`,
      statements: [/*lambdaPolicyStatement,*/ permissionPolicyStatement],
    });

    const lambdaRole = new Role(this, 'notificationPermissionsLambdaRole', {
      path: '/infrastructure/',
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'), lambdaRolePolicy],
    });

    this.lambda = new NodejsFunction(this, `adaptiveBot`, {
      functionName: `adaptiveBot`,
      entry: './src/adaptiveBot/adaptiveBot.ts',
      memorySize: 512,
      timeout: Duration.seconds(900),
      role: lambdaRole,
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

    this.lambda.addToRolePolicy(new PolicyStatement({
      actions: ['dynamodb:GetItem', 'dynamodb:PutItem'],
      resources: [props.table.tableArn],
    }));

  }
}
import { Construct } from 'constructs';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Duration } from 'aws-cdk-lib';
import { PolicyStatement, Effect, ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Runtime, Tracing } from 'aws-cdk-lib/aws-lambda';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import * as dotenv from 'dotenv';
dotenv.config();

export interface MessageReducerProps {
  topic: Topic;
  table: Table
}

export class MessageReducer extends Construct {
  readonly lambda: NodejsFunction;

  constructor(scope: Construct, id: string, props: MessageReducerProps) {
    super(scope, id);


        const notificationPermissions = new PolicyStatement({
          sid: 'AcmPermissions',
          effect: Effect.ALLOW,
          //TODO:  Complete List of Permissions
          actions: ['sns:*', 'tag:*', 'dynamodb:*', 'ssm:*', 'trustedadvisor:*', 'iam:*', 'cloudwatch:*'],
          resources: ['*'],
        });
    
        const lambdaRolePolicy: ManagedPolicy = new ManagedPolicy(this, 'notificationPermissionsPolicy,', {
          description: `lambdaRolePolicy`,
          managedPolicyName: `MessageReducerLambdaPolicy`,
          statements: [/*lambdaPolicyStatement,*/ notificationPermissions],
        });
    
        const lambdaRole = new Role(this, 'notificationPermissionsLambdaRole', {
          path: '/infrastructure/',
          assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
          managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'), lambdaRolePolicy],
        });
    
        this.lambda = new NodejsFunction(this, `messageReducer`, {
          functionName: `messageReducer`,
          entry: './src/notifications/messageReducer.ts',
          memorySize: 256,
          timeout: Duration.seconds(900),
          role: lambdaRole,
          runtime: Runtime.NODEJS_20_X,
          handler: 'handler',
          environment: {
            SNS_TOPIC_ARN: props.topic.topicArn,
            dynamoDb: props.table.tableName,
          },
          tracing: Tracing.ACTIVE, // Enable X-Ray tracing
    
        });

  }
}
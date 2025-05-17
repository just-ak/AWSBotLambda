import { Stack, RemovalPolicy, StackProps } from "aws-cdk-lib";
import { Table, AttributeType } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import { NotificationsTopic } from "./sns/notificationsTopic";
import { AdaptiveBot } from "./lambda/adaptiveBot";
import { MessageReducer } from "./lambda/messageReducer";
import { HealthEventConversations } from "./dynamoDb/healthEventConversions";
import { EventBridgeRules } from "./eventBridge/rules";
import { EndPointApiGateway } from "./apiGateway/endPointApiGateway";
import { Route53EndPoint } from "./route53/endPoint";


export class Notifications extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id);

    const snsTopic = new NotificationsTopic(this, 'NotificationsTopic', {
      displayName: 'awsNotificationsTopic'
    });

    const messageDeduplicationTable = new Table(this, 'MessageDeduplicationTable', {
      partitionKey: { name: 'id', type: AttributeType.STRING },
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const messageReducer = new MessageReducer(this, 'messageReducerLambda', {
      topic: snsTopic.topic,
      table: messageDeduplicationTable,
    });

    const healthEventConversations = new HealthEventConversations(this, 'HealthEventConversations', {
    });

    const adaptiveBot = new AdaptiveBot(this, 'adaptiveBot', {
      topic: snsTopic.topic,
      table: healthEventConversations.table,
    });

    new EventBridgeRules(this, 'EventBridgeRule', {
      targetLambda: messageReducer.lambda,
    });

    const endPointApiGateway = new EndPointApiGateway(this, 'EndPointApiGateway', {
      postLambda: adaptiveBot.lambda,
    });

    new Route53EndPoint(this, 'EndPoint', {
      api: endPointApiGateway.api,
    });




  }


}

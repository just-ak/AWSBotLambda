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
import { DocumentationBucket } from "./s3/documentation";
import { DocsEndpoint } from "./apiGateway/docsEndpoint";
import { EventRecorder } from "./dynamoDb/events";


export class Notifications extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id);

    const snsTopic = new NotificationsTopic(this, 'NotificationsTopic', {
      displayName: 'awsNotificationsTopic'
    });

    // const eventTable = new Table(this, 'MessageDeduplicationTable', {
    //   partitionKey: { name: 'id', type: AttributeType.STRING },
    //   removalPolicy: RemovalPolicy.DESTROY,
    // });

     const eventTable = new EventRecorder(this, 'EventRecorder', {
    });

    const messageReducer = new MessageReducer(this, 'messageReducerLambda', {
      topic: snsTopic.topic,
      table: eventTable.table,
    });
    new EventBridgeRules(this, 'EventBridgeRule', {
      targetLambda: messageReducer.lambda,
    });

    // const healthEventConversations = new HealthEventConversations(this, 'HealthEventConversations', {
    // });

    const adaptiveBot = new AdaptiveBot(this, 'adaptiveBot', {
      topic: snsTopic.topic,
      table: eventTable.table,
    });

 

    const endPointApiGateway = new EndPointApiGateway(this, 'EndPointApiGateway', {
      postLambda: adaptiveBot.lambda,
    });

    new Route53EndPoint(this, 'EndPoint', {
      api: endPointApiGateway.api,
    });

    // Create the documentation bucket with public access disabled
    const docsBucket = new DocumentationBucket(this, 'DocumentationBucket', {
      enableDirectAccess: false, // Access only through API Gateway
    });


    // Add the docs endpoint to the API Gateway
    new DocsEndpoint(this, 'DocsEndpoint', {
      api: endPointApiGateway.api,
      bucket: docsBucket.bucket,
      accessRole: docsBucket.accessRole,
    });

  }


}

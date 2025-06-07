import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { NotificationsTopic } from "./sns/notificationsTopic";
import { AdaptiveBot } from "./lambda/adaptiveBot";
import { MessageReducer } from "./lambda/messageReducer";
import { EventBridgeRules } from "./eventBridge/rules";
import { EndPointApiGateway } from "./apiGateway/endPointApiGateway";
import { Route53EndPoint } from "./route53/endPoint";
import { DocumentationBucket } from "./s3/documentation";
import { EventRecorder } from "./dynamoDb/events";
import { AssetsBucket } from "./s3/assets";
import { RootCloud } from "./cloudfront/rootCloud";
import * as dotenv from 'dotenv';
dotenv.config();
// const AWS_HOSTED_ZONE_ID = process.env.AWS_HOSTED_ZONE_ID || 'default_hosted_zone_id';
const AWS_HOSTED_ZONE_NAME = process.env.AWS_HOSTED_ZONE_NAME || 'default_hosted_zone_name';
const AWS_API_ENDPOINT_NAME = process.env.AWS_API_ENDPOINT_NAME || 'default_cert_domain';
// const AWS_CLOUDFRONT_SUBDOMAIN = process.env.AWS_CLOUDFRONT_SUBDOMAIN || 'www';


export class Notifications extends Stack {
  public readonly notificationsTopic: NotificationsTopic;
  public readonly adaptiveBot: AdaptiveBot;
  public readonly messageReducer: MessageReducer;
  public readonly endPointApiGateway: EndPointApiGateway;
  public readonly rootCloud: RootCloud;
  public readonly eventTable: EventRecorder;
  public readonly docsBucket: DocumentationBucket;
  public readonly assetsBucket: AssetsBucket;
  public readonly route53EndPoint: Route53EndPoint;
  public readonly eventBridgeRules: EventBridgeRules;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id);

    this.notificationsTopic = new NotificationsTopic(this, 'NotificationsTopic', {
      displayName: 'awsNotificationsTopic'
    });

    this.docsBucket = new DocumentationBucket(this, 'DocumentationBucket', {});

    this.assetsBucket = new AssetsBucket(this, 'AssetsBucket', {});


    this.eventTable = new EventRecorder(this, 'EventRecorder', {});

    this.messageReducer = new MessageReducer(this, 'messageReducerLambda', {
      topic: this.notificationsTopic.topic,
      table: this.eventTable.table,
    });
    this.eventBridgeRules = new EventBridgeRules(this, 'EventBridgeRule', {
      targetLambda: this.messageReducer.lambda,
    });

    this.adaptiveBot = new AdaptiveBot(this, 'adaptiveBot', {
      topic: this.notificationsTopic.topic,
      table: this.eventTable.table,
    });
    // Add the event table to the stack
    this.eventTable.table.grantReadWriteData(this.messageReducer.lambda);
    this.eventTable.table.grantReadWriteData(this.adaptiveBot.lambda);


    this.endPointApiGateway = new EndPointApiGateway(this, 'EndPointApiGateway', {
      postLambda: this.adaptiveBot.lambda,
    });

    this.rootCloud = new RootCloud(this, 'RootCloud', {
      apiGateway: this.endPointApiGateway.api,
      contentBucket: this.docsBucket.bucket,
      assetBucket: this.assetsBucket.bucket,
      domainNames: [`${AWS_API_ENDPOINT_NAME}.${AWS_HOSTED_ZONE_NAME}`]
    });

    this.route53EndPoint = new Route53EndPoint(this, 'EndPoint', {
      // api: endPointApiGateway.api,
      cloudFrontDistribution: this.rootCloud.distribution, // Pass the CloudFront distribution
    });

  }
}

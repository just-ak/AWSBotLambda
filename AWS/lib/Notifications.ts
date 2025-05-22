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
import { SslCertificates } from "./certificates/sslCertificates";
dotenv.config();
// const AWS_HOSTED_ZONE_ID = process.env.AWS_HOSTED_ZONE_ID || 'default_hosted_zone_id';
const AWS_HOSTED_ZONE_NAME = process.env.AWS_HOSTED_ZONE_NAME || 'default_hosted_zone_name';
const AWS_API_ENDPOINT_NAME = process.env.AWS_API_ENDPOINT_NAME || 'default_cert_domain';
// const AWS_CLOUDFRONT_SUBDOMAIN = process.env.AWS_CLOUDFRONT_SUBDOMAIN || 'www';


export class Notifications extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id);

    const snsTopic = new NotificationsTopic(this, 'NotificationsTopic', {
      displayName: 'awsNotificationsTopic'
    });

    const docsBucket = new DocumentationBucket(this, 'DocumentationBucket', {
      enableDirectAccess: false, // Access only through API Gateway
    });

    const assetsBucket = new AssetsBucket(this, 'AssetsBucket', {
      enableDirectAccess: false, // Access only through API Gateway
    });

    const eventTable = new EventRecorder(this, 'EventRecorder', {
    });

    const messageReducer = new MessageReducer(this, 'messageReducerLambda', {
      topic: snsTopic.topic,
      table: eventTable.table,
    });
    new EventBridgeRules(this, 'EventBridgeRule', {
      targetLambda: messageReducer.lambda,
    });

    const adaptiveBot = new AdaptiveBot(this, 'adaptiveBot', {
      topic: snsTopic.topic,
      table: eventTable.table,
    });
    // Add the event table to the stack
    eventTable.table.grantReadWriteData(messageReducer.lambda);
    eventTable.table.grantReadWriteData(adaptiveBot.lambda);


    const endPointApiGateway = new EndPointApiGateway(this, 'EndPointApiGateway', {
      postLambda: adaptiveBot.lambda,
    });

    // const sslCertificates = new SslCertificates(this, 'SslCertificates', {
    // });

    const rootCloud = new RootCloud(this, 'RootCloud', {
      apiGateway: endPointApiGateway.api,
      contentBucket: docsBucket.bucket,
      assetBucket: assetsBucket.bucket,
      domainNames: [`${AWS_API_ENDPOINT_NAME}.${AWS_HOSTED_ZONE_NAME}`]
      // additionalBuckets: [assetsBucket.bucket],
    });

    new Route53EndPoint(this, 'EndPoint', {
      // api: endPointApiGateway.api,
      cloudFrontDistribution: rootCloud.distribution, // Pass the CloudFront distribution
    });

  }
}

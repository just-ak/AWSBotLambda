interface SNSMessage {
  Message: string;
  MessageId: string;
  Timestamp: string;
  TopicArn: string;
  Subject: string;
}

interface HealthEvent {
  service: string;
  status: string;
  description: string;
  timestamp: string;
  region?: string;
  eventTypeCode?: string;
  startTime?: string;
  endTime?: string;
}
interface AdaptiveCardBody {
  type: string;
  attachments: {
    contentType: string;
    content: any;
  }[];
}

interface BotTokenResponse {
  access_token: string;
}

interface SendReplyOptions {
  hostname: string;
  path: string;
  method: string;
  headers: {
    Authorization: string;
    'Content-Type': string;
    'Content-Length': number;
  };
}

interface GenericEvent {
  version: string;
  id: string;
  'detail-type': string;
  source: string;
  account: string;
  time: string;
  region: string;
  resources: string[];
  dynamoDBUUID: string;
  dynamoDBUUIDConversationId: string;
  dynamoDBUUIDUserId: string;
  dynamoDBUUIDActivityId: string;
  detail: {
    name: string;
    type: string;
    operation: string;

  };
}


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
  
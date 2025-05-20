import { config } from "../internal/config";
// import DynamoDB from 'aws-sdk/clients/dynamodb';
import https from 'https';
import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';

const dynamoDbClient = new DynamoDBClient({ });
const TABLE_NAME = process.env.dynamoDb;

export async function startNewConversation(
  serviceUrl: string,
  userId: string,
//   tenantId: string,   // <-- ADD tenantId to function input
  token: string
): Promise<string> {
  console.log('Starting new conversation with userId:', userId);

  const postData = JSON.stringify({
    bot: {
      id: config.MicrosoftAppId,
      name: config.BOT_NAME,
    },
    members: [
      {
        id: '29:11ZqsLNEfRoTOeN6NytLfBKZd0BXaQ--FZnhX90tMWlWKov8sMlqKnoLay3RnI1eQlLFM3rdKkaYdPZyk6jIWsg',
      }
    ],
    channelData: {
        // channel: {
        //     id: "msteams"
        //   },
      tenant: {
        id: config.MicrosoftAppTenantId,
      }
    },
    isGroup: false,
    activity: {
      type: 'message',
      text: 'Starting a new conversation.',
    }
  });

  const url = new URL(`${serviceUrl.endsWith('/') ? serviceUrl.slice(0, -1) : serviceUrl}/v3/conversations`);

  const options = {
    hostname: url.hostname,
    path: url.pathname + url.search,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
  };
  
  // console.log('Request options:', JSON.stringify(options, null, 2));
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseBody = '';

      res.on('data', (chunk) => {
        responseBody += chunk;
      });

      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          const response = JSON.parse(responseBody);
          const conversationId = response.id;
          // console.log('New conversation started with ID:', conversationId);
          resolve(conversationId);
        } else {
          reject(
            new Error(
              `Request failed with status code ${res.statusCode}: ${responseBody}`
            )
          );
        }
      });
    });

    req.on('error', (e) => reject(new Error(`Request error: ${e.message}`)));
    req.write(postData);
    req.end();
  });
}

  export const storeInDynamoDB = async (id: string, event: any): Promise<void> => {
  // delete after 30 days
  const ttl = Math.floor(Date.now() / 1000) + 2592000;

  const command = new PutItemCommand({
    TableName: TABLE_NAME,
    Item: {
      id: { S: id },
      timestamp: { S: new Date().toISOString() },
      event: { S: JSON.stringify(event) },
      ttl: { N: ttl.toString() },
    },
  });

  try {
    await dynamoDbClient.send(command);
    console.log(`Stored message ID: ${id} in DynamoDB.`);
  } catch (error) {
    console.error('Error storing message in DynamoDB', error);
  }
};

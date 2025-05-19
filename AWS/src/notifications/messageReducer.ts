import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { Callback, Context, Handler } from 'aws-lambda';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { createHash } from 'crypto';
// import { msTeamsHandler } from './msTeams';

const dynamoDbClient = new DynamoDBClient({ });
const TABLE_NAME = process.env.dynamoDb;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;

// Define the JSON document specifying fields to remove per event type
const FIELD_REMOVAL_RULES: Record<string, string[]> = {
  'aws.ssm': ['version', 'id', 'time','detail'
     ],
};

//eslint-disable-next-line
export const handler: Handler = async (event: any, context: Context, callback: Callback) => {
  console.log('Received event message:', event);

  const eventType = event.source;
  const message = sanitizeMessage(event, eventType);
  console.log('Received sanitizeMessage:', message);
  const uniqueIdentifier = createHash('sha256').update(JSON.stringify(message)).digest('hex');
  event.dynamoDBUUIDCount = 1;
  event.dynamoDBUUIDTimeStamp = new Date().toISOString();
  event.dynamoDBUUIDConversationId = 'unknown';
  event.dynamoDBUUIDUserId = 'unknown';
  // Check if message already exists in DynamoDB
  const result = await checkIfExists(uniqueIdentifier);
  if (result.exists) {
    console.log(`Duplicate message detected: ${uniqueIdentifier}, updating count.`);
    const existingEvent = JSON.parse(result.item.event.S);
    event.dynamoDBUUIDCount = (existingEvent.dynamoDBUUIDCount || 0) + 1;
    event.dynamoDBUUIDTimeStamp = new Date().toISOString();
    event.dynamoDBUUID = uniqueIdentifier;
    event.dynamoDBUUIDConversationId = existingEvent.dynamoDBUUIDConversationId || 'unknown';
    event.dynamoDBUUIDUserId = existingEvent.dynamoDBUUIDUserId || 'unknown';
    event.dynamoDBUUIDActivityId = existingEvent.dynamoDBUUIDActivityId || 'unknown';
    await storeInDynamoDB(uniqueIdentifier, event);
  } else {
    await storeInDynamoDB(uniqueIdentifier, event);
    console.log(`Processing event type: ${eventType} with ID: ${uniqueIdentifier}`);
    event.detail.name = `${event.detail.name}`;
    event.dynamoDBUUID = uniqueIdentifier;
  }
  const command = new PublishCommand({
      Message: JSON.stringify(event),
      TopicArn: SNS_TOPIC_ARN,
    });
    try {
      const config = {  };
      const client = new SNSClient(config);
      await client.send(command);
      console.log(`Message sent to SNS topic: ${SNS_TOPIC_ARN}`);
    } catch (error) {
      console.error('Error publishing message to SNS', error);
    }
};
// eslint-disable-next-line
  const sanitizeMessage = (message: any, eventType: string): any => {
  const fieldsToRemove = FIELD_REMOVAL_RULES[eventType] || [];
  return removeFields(message, fieldsToRemove);
};

// eslint-disable-next-line
  const removeFields = (obj: any, fields: string[]): any => {
  if (Array.isArray(obj)) {
    return obj.map((item) => removeFields(item, fields));
  } else if (obj !== null && typeof obj === 'object') {
    // eslint-disable-next-line
      const newObj: any = {};
    for (const key of Object.keys(obj)) {
      if (!fields.includes(key)) {
        newObj[key] = removeFields(obj[key], fields);
      }
    }
    return newObj;
  }
  return obj;
};

const checkIfExists = async (id: string): Promise<{ exists: boolean; item?: any }> => {
  const command = new GetItemCommand({
    TableName: TABLE_NAME,
    Key: { id: { S: id } },
  });

  try {
    const response = await dynamoDbClient.send(command);
    if (response.Item !== undefined) {
      return { exists: true, item: response.Item };
    }
    return { exists: false };
  } catch (error) {
    console.log('Item not found', error);
    return { exists: false };
  }
};
//eslint-disable-next-line
const storeInDynamoDB = async (id: string, event: any): Promise<void> => {
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

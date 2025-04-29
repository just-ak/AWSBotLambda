import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { Callback, Context, Handler } from 'aws-lambda';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { createHash } from 'crypto';
import { msTeamsHandler } from './msTeams';

const dynamoDbClient = new DynamoDBClient({ region: `eu-west-1` });
const TABLE_NAME = process.env.dynamoDb;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;

// Define the JSON document specifying fields to remove per event type
const FIELD_REMOVAL_RULES: Record<string, string[]> = {
  'aws.ssm': ['version', 'id', 'time'],
};

//eslint-disable-next-line
export const handler: Handler = async (event: any, context: Context, callback: Callback) => {
  console.log('Received event message:', event);

  const eventType = event.source;
  const message = sanitizeMessage(event, eventType);

  console.log('Received sanitizeMessage:', message);

  const uniqueIdentifier = createHash('sha256').update(JSON.stringify(message)).digest('hex');

  // Check if message already exists in DynamoDB
  const exists = await checkIfExists(uniqueIdentifier);
  if (exists) {
    console.log(`Duplicate message detected: ${uniqueIdentifier}, skipping processing.`);
    // continue;
  } else {
    // Store the UUID in DynamoDB to mark it as processed
    const messageID = await msTeamsHandler(event);

    event.msTeamsMessageId = messageID;
    await storeInDynamoDB(uniqueIdentifier, event);

    // Process the message (implement your own processing logic)
    console.log(`Processing event type: ${eventType} with ID: ${uniqueIdentifier}`);
    event.detail.name = `${event.detail.name}`;

    const command = new PublishCommand({
      Message: JSON.stringify(event),
      TopicArn: SNS_TOPIC_ARN,
    });
    try {
      const config = { region: 'eu-west-1' };
      const client = new SNSClient(config);
      await client.send(command);
    } catch (error) {
      console.error('Error publishing message to SNS', error);
    }
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

const checkIfExists = async (id: string): Promise<boolean> => {
  const command = new GetItemCommand({
    TableName: TABLE_NAME,
    Key: { id: { S: id } },
  });

  try {
    const response = await dynamoDbClient.send(command);
    return response.Item !== undefined;
  } catch (error) {
    console.log('Item not found', error);
    return false;
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

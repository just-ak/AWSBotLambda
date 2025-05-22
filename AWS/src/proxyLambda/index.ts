import { S3 } from 'aws-sdk';
import { APIGatewayProxyHandler } from 'aws-lambda';

const s3client = new S3();
const BUCKET_NAME = process.env.BUCKET_NAME!;

export const handler: APIGatewayProxyHandler = async (event) => {
  const key = event.pathParameters?.['proxy'];
  if (!key) {
    return {
      statusCode: 400,
      body: 'No key specified',
    };
  }

  try {
    const object = await s3client.getObject({
      Bucket: BUCKET_NAME,
      Key: key,
    }).promise();

    const contentType = object.ContentType || 'application/octet-stream';
    const isBinary = contentType.startsWith('image/') || contentType === 'application/octet-stream';

    return {
      statusCode: 200,
      headers: { 'Content-Type': contentType },
      body: isBinary && object.Body
        ? object.Body.toString('base64')
        : object.Body?.toString('utf-8') ?? '',
      isBase64Encoded: isBinary,
    };
  } catch (err) {
    return {
      statusCode: 404,
      body: 'Not found',
    };
  }
};
import { APIGatewayProxyHandler } from 'aws-lambda';
import * as AWS from 'aws-sdk';

export const handler: APIGatewayProxyHandler = async (event, _context) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    try {
        const body = JSON.parse(event.body || '{}');
        const message = body.message || 'Hello from Lambda!';
        const timestamp = new Date().toISOString();

        const response = {
            message: `Echo: ${message}`,
            timestamp: timestamp
        };

        return {
            statusCode: 200,
            body: JSON.stringify(response),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'An error occurred' }),
        };
    }
};
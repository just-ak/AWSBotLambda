import { APIGatewayRequestAuthorizerEvent, APIGatewayAuthorizerResult } from 'aws-lambda';
import { verifyJwt } from './lib/verifyJwt';

export const handler = async (event: APIGatewayRequestAuthorizerEvent): Promise<APIGatewayAuthorizerResult> => {
  try {
    console.log('Auth function invoked : v1.1');
    const authHeader = event.headers?.Authorization || event.headers?.authorization;

    if (!authHeader) {
      console.log('Authorization header is missing');
      return generatePolicy('user', 'Deny', event.methodArn);
    }
    if (!authHeader.startsWith('Bearer ')) {
      console.log('Authorization header is not a Bearer token');
      return generatePolicy('user', 'Deny', event.methodArn);
    }

    const isValid = await verifyJwt(authHeader.substring(7));
    if (!isValid) {
      console.log('JWT validation failed');
      return generatePolicy('user', 'Deny', event.methodArn);
    }

    console.log('Valid token, allowing access');
    return generatePolicy('user', 'Allow', event.methodArn);

  } catch (error) {
    console.error('Error in authorizer:', error);
    return generatePolicy('user', 'Deny', event.methodArn);
  }
};

/**
 * Generate IAM policy for API Gateway
 */
function generatePolicy(principalId: string, effect: 'Allow' | 'Deny', resource: string): APIGatewayAuthorizerResult {
  return {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resource,
        },
      ],
    },
    context: {
      // Optional: add additional context that will be passed to the target Lambda
      // For example: 'userId': '123'
    },
  };
}

import { CloudFrontRequestHandler } from 'aws-lambda';
import { verify } from 'jsonwebtoken';
const jwkToPem = require('jwk-to-pem');
import fetch from 'node-fetch';

// Cache for JWKs
let jwkCache: any = null;
let jwkCacheTime = 0;
const jwkCacheMaxAge = 60 * 60 * 1000; // 1 hour


const COGNITO_USER_POOL_REGION = 'eu-west-2';
const COGNITO_USER_POOL_ID = 'eu-west-2_hUnONOh8V';
const COGNITO_GROUP = 'eu-west-2_hUnONOh8V_callback';
/**
 * CloudFront Edge Lambda function to validate JWT tokens from Cognito
 */
export const handler: CloudFrontRequestHandler = async (event) => {
  const request = event.Records[0].cf.request;
  const headers = request.headers;
  
  // Check if this is a public path - skip auth
  if (request.uri.startsWith('/public/')) {
    return request;
  }
  
  try {
    // Check for Cookie header with JWT
    const cookieHeader = headers.cookie || [];
    const cookies = parseCookies(cookieHeader);
    
    // Get the JWT from the cookie
    const idToken = cookies['AWSBotAuth'];
    if (!idToken) {
      return redirectToLogin(request);
    }
    
    // Get the JWKs from Cognito
    const userPoolRegion = COGNITO_USER_POOL_REGION;
    const userPoolId = COGNITO_USER_POOL_ID;
    
    if (!userPoolId) {
      console.error('USER_POOL_ID environment variable not set');
      return generateError('500', 'Server Configuration Error');
    }
    
    // Get JWKs from cache or fetch them
    const jwks = await getJwks(userPoolRegion, userPoolId);
    
    // Verify the JWT
    const decodedToken = await verifyToken(idToken, jwks);
    
    // Check if the user has the required group
    const requiredGroup = COGNITO_GROUP;
    if (requiredGroup && (!decodedToken.groups || !decodedToken.groups.includes(requiredGroup))) {
      return generateError('403', 'Forbidden - Insufficient permissions');
    }
    
    // Add user info to the request headers
    headers['x-user-id'] = [{ key: 'X-User-Id', value: decodedToken.sub }];
    headers['x-user-email'] = [{ key: 'X-User-Email', value: decodedToken.email || '' }];
    
    if (decodedToken.groups) {
      headers['x-user-groups'] = [{ key: 'X-User-Groups', value: decodedToken.groups.join(',') }];
    }
    
    return request;
  } catch (error) {
    console.error('Authentication error:', error);
    // If the token is expired or invalid, redirect to login
    return redirectToLogin(request);
  }
};

/**
 * Parse cookies from the Cookie header
 */
function parseCookies(cookieHeader: { key?: string, value: string }[]): Record<string, string> {
  const cookies: Record<string, string> = {};
  
  if (!cookieHeader || cookieHeader.length === 0) {
    return cookies;
  }
  
  cookieHeader.forEach((header) => {
    header.value.split(';').forEach((cookie) => {
      const parts = cookie.trim().split('=');
      if (parts.length >= 2) {
        cookies[parts[0]] = decodeURIComponent(parts[1]);
      }
    });
  });
  
  return cookies;
}

/**
 * Get JWKs from Cognito, using cache if available
 */
async function getJwks(region: string, userPoolId: string): Promise<any> {
  const now = Date.now();
  
  if (jwkCache && (now - jwkCacheTime < jwkCacheMaxAge)) {
    return jwkCache;
  }
  
  const jwksUrl = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;
  const response = await fetch(jwksUrl);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch JWKS: ${response.statusText}`);
  }
  
  jwkCache = await response.json();
  jwkCacheTime = now;
  
  return jwkCache;
}

/**
 * Verify a JWT token using the JWKs
 */
async function verifyToken(token: string, jwks: any): Promise<any> {
  // Find the JWK that matches the token's key ID
  const decodedHeader = JSON.parse(Buffer.from(token.split('.')[0], 'base64').toString());
  const kid = decodedHeader.kid;
  
  const jwk = jwks.keys.find((key: any) => key.kid === kid);
  if (!jwk) {
    throw new Error('Invalid token: Key ID not found in JWKs');
  }
  
  // Convert JWK to PEM format
  const pem = jwkToPem(jwk);
  
  // Verify the token
  return new Promise((resolve, reject) => {
    verify(token, pem, { algorithms: ['RS256'] }, (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded as any);
      }
    });
  });
}

/**
 * Redirect to the Cognito login page
 */
function redirectToLogin(request: any): any {
  const userPoolClient = process.env.USER_POOL_CLIENT_ID;
  const userPoolDomain = process.env.USER_POOL_DOMAIN;
  
  if (!userPoolClient || !userPoolDomain) {
    console.error('Missing USER_POOL_CLIENT_ID or USER_POOL_DOMAIN environment variable');
    return generateError('500', 'Server Configuration Error');
  }
  
  const redirectUri = `https://${request.headers.host[0].value}${request.uri}`;
  const loginUrl = `https://${userPoolDomain}/login?client_id=${userPoolClient}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}`;
  
  const response = {
    status: '302',
    statusDescription: 'Found',
    headers: {
      location: [{ key: 'Location', value: loginUrl }],
      'set-cookie': [
        { 
          key: 'Set-Cookie', 
          value: `AWSBotAuthRedirect=${encodeURIComponent(request.uri)}; Path=/; Secure; HttpOnly` 
        }
      ]
    }
  };
  
  return response;
}

/**
 * Generate an error response
 */
function generateError(status: string, message: string): any {
  return {
    status,
    statusDescription: message,
    headers: {
      'content-type': [{ key: 'Content-Type', value: 'text/html; charset=utf-8' }]
    },
    body: `<html><body><h1>${status} - ${message}</h1></body></html>`
  };
}
'use strict';

exports.handler = async (event) => {
  console.log('EdgeAuth V1.0 - Received event:', JSON.stringify(event, null, 2));

  const request = event.Records[0].cf.request;
  const headers = request.headers;
  const uri = request.uri;
  const queryString = request.querystring || '';


  if (request.method === 'OPTIONS') {
    return {
      status: '204',
      statusDescription: 'No Content',
      headers: {
        'access-control-allow-origin': [{ key: 'Access-Control-Allow-Origin', value: '*' }],
        'access-control-allow-methods': [{ key: 'Access-Control-Allow-Methods', value: 'GET, HEAD, OPTIONS' }],
        'access-control-allow-headers': [{ key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' }],
        'access-control-max-age': [{ key: 'Access-Control-Max-Age', value: '86400' }],
      }
    };
  }


  // === Configure these ===
  const cognitoDomain = `https://__COGNITO_USER_POOL_DOMAIN__.auth.__COGNITO_AWS_REGION__.amazoncognito.com`;
  const clientId = `__COGNITO_CLIENT_ID__`;
  const redirectPath = '/callback.html';

  console.log('EdgeAuth - Processing request for host:', headers.host?.[0]?.value);
  console.log('EdgeAuth - URI:', uri);
  console.log('EdgeAuth - Query string:', queryString);

  const host = headers.host?.[0]?.value;
  const redirectUri = `https://${host}${redirectPath}`;
  console.log('EdgeAuth - Redirect URI:', redirectUri);


  // Allow the callback URL with code to pass through without authentication
  if (uri === redirectPath )
    //&& queryString.includes('code=')) 
  {
    console.log('EdgeAuth - Auth callback detected, allowing through without authentication');

    // Add appropriate CSP headers to allow Cognito domain
    if (!request.headers['content-security-policy']) {
      request.headers['content-security-policy'] = [];
    }

    request.headers['content-security-policy'].push({
      key: 'Content-Security-Policy',
      value: `default-src 'self'; img-src 'self' data: ${cognitoDomain}; connect-src 'self' ${cognitoDomain}; form-action 'self' ${cognitoDomain};`
    });

    // Add CORS headers for the callback page
    if (!request.headers['access-control-allow-origin']) {
      request.headers['access-control-allow-origin'] = [];
    }

    request.headers['access-control-allow-origin'].push({
      key: 'Access-Control-Allow-Origin',
      value: '*'  // Or the specific origin that's making the request
    });

    return request;
  }

  // Allow favicon.ico to pass through without authentication
  if (uri === '/favicon.ico') {
    console.log('EdgeAuth - Favicon request detected, allowing through without authentication');
    return request;
  }


  // Parse cookies safely
  const cookieHeader = headers.cookie?.[0]?.value || '';
  console.log('EdgeAuth - Cookie header:', cookieHeader);

  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const parts = c.trim().split('=');
      return [parts[0], parts.slice(1).join('=')]; // Handle values that might contain =
    })
  );
  console.log('EdgeAuth - Parsed cookies:', JSON.stringify(cookies, null, 2));

  // Check if id_token exists
  const idToken = cookies['id_token'];
  let isAuthenticated = idToken !== undefined;
  
  // Check if token is expired
  if (isAuthenticated) {
    try {
      // JWT tokens consist of three parts: header.payload.signature
      // We need to decode the payload (second part)
      const tokenParts = idToken.split('.');
      if (tokenParts.length !== 3) {
        console.log('EdgeAuth - Invalid token format');
        isAuthenticated = false;
      } else {
        // Base64-decode the payload
        const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString('utf8'));
        console.log('EdgeAuth - Token payload:', JSON.stringify(payload, null, 2));
        
        // Check expiration time
        const currentTime = Math.floor(Date.now() / 1000);
        if (!payload.exp || payload.exp < currentTime) {
          console.log('EdgeAuth - Token expired:', payload.exp, 'Current time:', currentTime);
          isAuthenticated = false;
        } else {
          console.log('EdgeAuth - Token valid until:', new Date(payload.exp * 1000).toISOString());
        }
      }
    } catch (error) {
      console.log('EdgeAuth - Error decoding token:', error.message);
      isAuthenticated = false;
    }
  }
  
  if (!isAuthenticated) {
    const loginUrl = `${cognitoDomain}/login?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    console.log('EdgeAuth - Redirecting to login URL:', loginUrl);

    return {
      status: '302',
      statusDescription: 'Found',
      headers: {
        location: [{ key: 'Location', value: loginUrl }],
        'cache-control': [{ key: 'Cache-Control', value: 'no-cache' }]
      }
    };
  } else {
     return request;
  }

  // User is authenticated
  console.log('EdgeAuth - Authentication successful, proceeding with request');
  // For authenticated requests, add CORS headers
  if (isAuthenticated) {
    // Add CORS headers to the request that will be forwarded
    if (!request.headers['origin']) {
      // Don't add CORS headers for non-CORS requests
      return request;
    }

    // You could add headers here, but it's better to let CloudFront handle this
    // through the response headers policy
    return request;
  }

};
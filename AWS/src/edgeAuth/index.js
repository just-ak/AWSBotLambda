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
  const cognitoDomain = 'https://api2-akfdev.auth.eu-west-2.amazoncognito.com';
  const clientId = '7455fem1ti4qrb21uu24b51em2';
  const redirectPath = '/callback.html';

  console.log('EdgeAuth - Processing request for host:', headers.host?.[0]?.value);
  console.log('EdgeAuth - URI:', uri);
  console.log('EdgeAuth - Query string:', queryString);

  const host = headers.host?.[0]?.value;
  const redirectUri = `https://${host}${redirectPath}`;
  console.log('EdgeAuth - Redirect URI:', redirectUri);


  // Allow the callback URL with code to pass through without authentication
  if (uri === redirectPath && queryString.includes('code=')) {
    console.log('EdgeAuth - Auth callback detected, allowing through without authentication');

    // Add appropriate CSP headers to allow Cognito domain
    if (!request.headers['content-security-policy']) {
      request.headers['content-security-policy'] = [];
    }

    request.headers['content-security-policy'].push({
      key: 'Content-Security-Policy',
      value: "default-src 'self'; img-src 'self' data: https://api2-akfdev.auth.eu-west-2.amazoncognito.com; connect-src 'self' https://api2-akfdev.auth.eu-west-2.amazoncognito.com; form-action 'self' https://api2-akfdev.auth.eu-west-2.amazoncognito.com;"
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

  const isAuthenticated = cookies['id_token'] !== undefined;
  console.log('EdgeAuth - Authentication status:', isAuthenticated ? 'Authenticated' : 'Not Authenticated');

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
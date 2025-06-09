processLogout = () => {
  const domain = `https://__COGNITO_USER_POOL_DOMAIN__.auth.__COGNITO_AWS_REGION__.amazoncognito.com`;
  const clientId = `__COGNITO_CLIENT_ID__`;
  const redirectUri = 'https://__AWS_API_ENDPOINT_NAME__.__AWS_HOSTED_ZONE_NAME__/logout.html?logoutComplete=true'; // full URL with origin
  const region = '__COGNITO_AWS_REGION__';
  const userPoolDomain = '__COGNITO_USER_POOL_DOMAIN__';

  // Get the ID token before removing it
  const idToken = localStorage.getItem('idToken');

  // Clear local storage tokens
  localStorage.removeItem('accessToken');
  localStorage.removeItem('idToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('cognitoUser');

  // Construct logout URL with id_token for proper server-side invalidation
  const logoutUrl = `https://${userPoolDomain}.auth.${region}.amazoncognito.com/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(redirectUri)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&id_token_hint=${idToken}`;

  console.log('Redirecting to Cognito logout URL with token invalidation');

  // Redirect browser to Cognito logout endpoint
  window.location.href = logoutUrl;
};

// Check if we're already in a post-logout state
const isPostLogout = () => {
  // Check URL parameters that would indicate we're already in post-logout state
  const urlParams = new URLSearchParams(window.location.search);
  // Return true if logout-related parameters exist
  return urlParams.has('logout') || urlParams.has('logoutComplete');
};

// Run logout once page is loaded, but only if we're not already in post-logout state
document.addEventListener('DOMContentLoaded', () => {
  if (!isPostLogout()) {
    processLogout();
  } else {
    console.log('Already in post-logout state, not redirecting again.');
    window.location.href = 'https://__AWS_API_ENDPOINT_NAME__.__AWS_HOSTED_ZONE_NAME__/'; // Redirect to home or another page
    // You could display a logout success message here
  }
});
processLogout = () => {
  const domain = `https://__COGNITO_USER_POOL_DOMAIN__.auth.__COGNITO_AWS_REGION__.amazoncognito.com`;
  const clientId = `__COGNITO_CLIENT_ID__`;
  const redirectUri = 'https://__AWS_API_ENDPOINT_NAME__.__AWS_HOSTED_ZONE_NAME__'; // full URL with origin
  const region = '__COGNITO_AWS_REGION__';
  const userPoolDomain = '__COGNITO_USER_POOL_DOMAIN__';

  // Clear local storage tokens
  // localStorage.removeItem('accessToken');
  // localStorage.removeItem('idToken');
  // localStorage.removeItem('refreshToken');
  // localStorage.removeItem('cognitoUser');

  // Construct logout URL
  const logoutUrl = `https://${userPoolDomain}.auth.${region}.amazoncognito.com/logout?client_id=${clientId}logout_uri=${encodeURIComponent(redirectUri)}`;

  console.log('Redirecting #2 to Cognito logout URL:', logoutUrl);

  // Redirect browser to Cognito logout endpoint
  window.location.href = logoutUrl;
};

// Run logout once page is loaded
document.addEventListener('DOMContentLoaded', () => {
  processLogout();
});

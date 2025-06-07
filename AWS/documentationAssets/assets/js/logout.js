processLogout = () => {
  const clientId = '7455fem1ti4qrb21uu24b51em2';
  const redirectUri = window.location.origin + '/'; // full URL with origin
  const region = 'eu-west-2';
  const userPoolDomain = 'api2-akfdev';

  // Clear local storage tokens
  localStorage.removeItem('accessToken');
  localStorage.removeItem('idToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('cognitoUser');

  // Construct logout URL
  const logoutUrl = `https://${userPoolDomain}.auth.${region}.amazoncognito.com/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(redirectUri)}`;

  console.log('Redirecting to Cognito logout URL:', logoutUrl);

  // Redirect browser to Cognito logout endpoint
  window.location.href = logoutUrl;
};

// Run logout once page is loaded
document.addEventListener('DOMContentLoaded', () => {
  processLogout();
});

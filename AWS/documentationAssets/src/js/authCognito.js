// Create a function to update status with timestamps
function logStatus(message, isError = false) {
  const timestamp = new Date().toISOString();
  console[isError ? 'error' : 'log'](`[${timestamp}] ${message}`);
  
  // Update UI with status
  const statusElement = document.getElementById('status');
  const entry = document.createElement('p');
  entry.style.color = isError ? 'red' : 'black';
  entry.style.margin = '4px 0';
  entry.textContent = `[${timestamp.split('T')[1].split('.')[0]}] ${message}`;
  statusElement.appendChild(entry);
}

async function processAuthentication() {
  try {
    logStatus("Starting v2 authentication process...");
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (!code) {
      const errorMsg = "Missing authorization code in redirect URL.";
      logStatus(errorMsg, true);
      document.body.innerHTML = `<p style="color: red">${errorMsg}</p>`;
      return;
    }
    // logStatus(`Authorization code received: ${code.substring(0, 5)}...`);

    const domain = `https://__COGNITO_USER_POOL_DOMAIN__.auth.__COGNITO_AWS_REGION__.amazoncognito.com`;
    const clientId = `__COGNITO_CLIENT_ID__`;
    const redirectUri = window.location.origin + "/callback.html";

    const tokenEndpoint = `${domain}/oauth2/token`;
    // logStatus(`Token endpoint: ${tokenEndpoint}`);

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      code: code,
      redirect_uri: redirectUri,
    });

    logStatus("Exchanging code for token...");
    const startTime = performance.now();
    const res = await fetch(tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });
    const endTime = performance.now();
    logStatus(`Token request completed in ${Math.round(endTime - startTime)}ms`);
    
    if (!res.ok) {
      const errorText = await res.text();
      logStatus(`Token request failed with status ${res.status}: ${errorText}`, true);
      document.body.innerHTML = `
        <p style="color: red">Authentication failed (${res.status})</p>
        <pre style="background: #f5f5f5; padding: 10px; max-width: 600px; overflow: auto;">${errorText}</pre>
      `;
      return;
    }

    const result = await res.json();
    logStatus(`Token response received: ${Object.keys(result).join(', ')}`);

    if (result.id_token) {
      logStatus(`ID token received (length: ${result.id_token.length})`);
      // Store ID token in a cookie for Lambda@Edge
      document.cookie = `id_token=${result.id_token}; Secure; SameSite=None; Path=/`;
      logStatus("ID token stored in cookie");
      // Redirect to homepage (or another page)
      logStatus("Redirecting to homepage...");
      // Add a small delay before redirect to ensure logs are visible
       window.location.href = "/";
      // setTimeout(() => {
      //   window.location.href = "/";
      // }, 1000);
    } else {
      const errorMsg = "Login failed: Token response missing ID token";
      logStatus(errorMsg, true);
      logStatus(`Response details: ${JSON.stringify(result)}`, true);
      document.body.innerHTML = `
        <p style="color: red">${errorMsg}</p>
        <pre style="background: #f5f5f5; padding: 10px; max-width: 600px; overflow: auto;">${JSON.stringify(result, null, 2)}</pre>
      `;
    }
  } catch (err) {
    logStatus(`Unhandled error: ${err.message}`, true);
    console.error("Full error details:", err);
    document.body.innerHTML = `
      <p style="color: red">Authentication error</p>
      <pre style="background: #f5f5f5; padding: 10px; max-width: 600px; overflow: auto;">${err.stack || err.message}</pre>
    `;
  }
}
// Initialize the authentication process when the script loads
document.addEventListener('DOMContentLoaded', () => {
  processAuthentication();
});
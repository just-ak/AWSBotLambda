import https from 'https';

export async function sendAdaptiveCard(
  serviceUrl: string,
  conversationId: string,
  adaptiveCardBody: Record<string, any>,
  token: string
): Promise<void> {
  const postData = JSON.stringify({
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        content: adaptiveCardBody,
      },
    ],
  });

  const url = new URL(`${serviceUrl}/v3/conversations/${conversationId}/activities`);

  const options = {
    hostname: url.hostname,
    path: url.pathname + url.search,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseBody = '';

      res.on('data', (chunk) => {
        responseBody += chunk;
      });

      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve();
        } else {
          reject(
            new Error(
              `Request failed with status code ${res.statusCode}: ${responseBody}`
            )
          );
        }
      });
    });

    req.on('error', (e) => reject(new Error(`Request error: ${e.message}`)));
    req.write(postData);
    req.end();
  });
}
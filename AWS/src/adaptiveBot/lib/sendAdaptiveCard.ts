import https from 'https';

export async function sendAdaptiveCard(
  serviceUrl: string,
  conversationId: string,
  adaptiveCardBody: Record<string, any>,
  token: string,
  activityId?: string,
  replyToId?: string,
): Promise<string> {
  const postData = JSON.stringify({
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        content: adaptiveCardBody,
      },
    ],
    // Include replyToId if provided to create a threaded reply
    //...(replyToId && { replyToId: replyToId }),
  });

  // Construct URL based on whether we're updating or sending a new card
  let urlPath: string;
  let method: string;
  
  if (replyToId) {
    console.log('Replying to existing card with ID:', replyToId);
    // Reply to an existing card
    urlPath = `/v3/conversations/${conversationId}/activities/${replyToId}`;
    method = 'POST';
  } else if (activityId) {
    console.log('Updating existing card with ID:', activityId);
    // Updating an existing card
    urlPath = `/v3/conversations/${conversationId}/activities/${activityId}`;
    method = 'PUT';
  } else {
    console.log('Sending new card to conversation:', conversationId);
    //Sending a new card or replying to an existing card
    urlPath = `/v3/conversations/${conversationId}/activities`;
    method = 'POST';
  }

  const url = new URL(`${serviceUrl}${urlPath}`);
  console.log('Service URL:', serviceUrl);
  console.log(`Sending card with method: ${url.hostname} ${method}, ${postData}`);

  const options = {
    hostname: url.hostname,
    path: url.pathname + url.search,
    method: method,
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
          try {
            // Try to parse the response to get the activity ID
            const response = JSON.parse(responseBody);
            console.log('API Response:', JSON.stringify(response, null, 2));
            
            // The activity ID might be in different locations depending on the response
            // Common patterns: id, activityId, or id as a property of a nested object
            const activityId = response.id || 
                               response.activityId || 
                               (response.body && response.body.id) ||
                               '';
            
            console.log('Extracted Activity ID:', activityId);
            resolve(activityId);
          } catch (e) {
            console.log('Failed to parse response:', responseBody, e);
            resolve('');
          }
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
import querystring from 'querystring';
import { config } from './internal/config';
import https from 'https';

export async function getBotToken(): Promise<string> {
    const postData = querystring.stringify({
      grant_type: 'client_credentials',
      client_id: config.MicrosoftAppId,
      client_secret: config.MicrosoftAppPassword,
      scope: 'https://api.botframework.com/.default',
    });
  
    const options = {
      hostname: 'login.microsoftonline.com',
      path: '/botframework.com/oauth2/v2.0/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': postData.length,
      },
    };
  
    return new Promise((resolve, reject) => {
      const req = https.request(options, (res: any) => {
        let data = '';
        res.on('data', (chunk: any) => (data += chunk));
        res.on('end', () => resolve((JSON.parse(data) as BotTokenResponse).access_token));
      });
      req.on('error', (e: any) => reject(e));
      req.write(postData);
      req.end();
    });
  }
  
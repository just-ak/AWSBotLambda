// import axios from 'axios';
import * as https from 'https';

const url =
  'NOTIFICATION_WBEHOOKURL';


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const msTeamsHandler = async (event: any) => {
  console.log('Sending message to MS Teams', event);


  const tableRows = Object.entries(event.detail).map(([key, value]) => ({
    type: 'ColumnSet',
    columns: [
      { type: 'Column', width: 'stretch', items: [{ type: 'TextBlock', text: key, weight: 'Bolder' }] },
      { type: 'Column', width: 'stretch', items: [{ type: 'TextBlock', text: JSON.stringify(value) }] },
    ],
  }));

  //https://adaptivecards.io/designer
  //https://github.com/OfficeDev/Microsoft-Teams-Adaptive-Card-Samples/tree/main
  /* 
{
            type: 'AdaptiveCard',
            $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
            version: '1.6',
            body: [
              {
                type: 'TextBlock',
                text: 'Please confirm your order:',
                wrap: true,
                style: 'heading',
              },
              {
                type: 'FactSet',
                facts: [
                  {
                    title: 'Name',
                    value: 'John Smith',
                  },
                  {
                    title: 'Phone number',
                    value: '(555) 555-5555',
                  },
                ],
              },
              {
                type: 'Container',
                items: [
                  {
                    type: 'FactSet',
                    facts: [
                      {
                        title: '1x',
                        value: 'Steak',
                      },
                      {
                        title: '2x',
                        value: 'Side Rice',
                      },
                      {
                        title: '1x',
                        value: 'Soft Drink',
                      },
                    ],
                    spacing: 'Small',
                  },
                ],
                spacing: 'Small',
              },
            ],
          },
  */
  // // Build MS Teams Adaptive Card
  const adaptiveCard = {
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    type: 'AdaptiveCard',
    version: '1.4',
    body: [
      { type: 'TextBlock', text: '**AWS Notification**', weight: 'Bolder', size: 'Medium' },
      { type: 'TextBlock', text: `**Event Type:** ${event['detail-type']}`, wrap: true },
      { type: 'TextBlock', text: `**Source:** ${event.source}`, wrap: true },
      { type: 'TextBlock', text: `**Region:** ${event.region}`, wrap: true },
      { type: 'TextBlock', text: `**Time:** ${event.times}`, wrap: true },
      { type: 'TextBlock', text: `**AWS Account:** ${event.account}`, wrap: true },
      // ...accountRows,
      { type: 'TextBlock', text: `**Details**`, wrap: true },
      // { type: 'TextBlock', text: `📜 **Details:**\n${details}`, wrap: true },
      ...tableRows,
    ],
  };
  const uniqueIDForAttachmentSeed = '74d20c7f34aa4a7fb74e2b30004247c5'; //Math.random().toString(36).substring(7);
  const teamsMessage = {
    subject: null,
    body: {
      contentType: 'html',
      content: '<attachment id="' + uniqueIDForAttachmentSeed + '"></attachment>',
    },
    attachments: [
      {
        id: uniqueIDForAttachmentSeed,
        contentType: 'application/vnd.microsoft.card.adaptive',
        contentUrl: null,
        content: JSON.stringify(
          /*
            Adaptive Card Designer
          */
          adaptiveCard,
        ),
        name: null,
        thumbnailUrl: null,
      },
    ],
  };

  const postData = JSON.stringify(teamsMessage);
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const req = https.request(url, options, (res: any) => {
      let responseData = '';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      res.on('data', (chunk: any) => {
        responseData += chunk;
      });

      res.on('end', () => {
        console.log({
          message: event.Records[0].Sns.Message,
          statusCode: res.statusCode,
          response: responseData,
        });
        resolve({
          statusCode: res.statusCode,
          body: responseData,
        });
      });
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    req.on('error', (error: any) => {
      console.error('Error sending request:', error);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
  // try {
  //   // Send message to MS Teams using Graph API
  //   const response = await axios.post(GRAPH_API_URL, teamsMessage, {
  //     headers: {
  //       Authorization: `Bearer ${MS_GRAPH_TOKEN}`,
  //       'Content-Type': 'application/json',
  //     },
  //   });

  //   const teamsMessageId = response.data.id;
  //   return teamsMessageId;
  // } catch (error) {
  //   console.error('Error sending message to MS Teams', error);
  // }
};

// import { APIGatewayProxyHandler } from "aws-lambda";
import { renderAdaptiveCard } from "./lib/renderAdaptiveCard";
import { getBotToken } from "./lib/getBotToken";
import { sendAdaptiveCard } from "./lib/sendAdaptiveCard";
import { processSNSMessage } from "./processSNSMessage";
import { config } from "./internal/config";


export const handler: any = async (event: any) => {
  // console.log('Received event body:', JSON.stringify(event, null, 2));

  if (event.Records) {
    // console.log('Processing SNS event');
    for (const record of event.Records) {
      const snsMessage = record.Sns;
      await processSNSMessage(snsMessage);
    }
  } else {
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (error) {
      console.error('Error parsing request body:', error);
      return { statusCode: 400, body: "Invalid request body" };
    }

    console.log('Received event body:', JSON.stringify(body, null, 2));

    const serviceUrl: string | undefined = body.serviceUrl;
    const conversationId: string | undefined = body.conversation?.id;
    const incomingText: string = (body.text ?? "").toLowerCase();
    const userName: string = body.from?.name ?? "there";

    if (!serviceUrl || !conversationId) {
      console.log('Missing serviceUrl or conversationId.');
      return { statusCode: 400, body: "Bad Request" };
    }

    console.log('Service URL:', serviceUrl);
    console.log('Conversation ID:', conversationId);

    const botToken = await getBotToken(); // You define this securely
    let adaptiveCard;
    if (incomingText.includes("/hello")) {
      adaptiveCard = renderAdaptiveCard({
        title: `Hello, ${userName}!`,
        appName: "W7Bot",
        description: "You sent the command: /hello",
        notificationUrl: `https://${config.AWS_API_ENDPOINT_NAME}.${config.AWS_HOSTED_ZONE_NAME}/docs`,
      });
    } else {
      // Handle other commands if needed
      adaptiveCard = renderAdaptiveCard({
        title: `Hello, ${userName}!`,
        appName: "W7Bot",
        description: `Sorry I don't know how to respond to: ${incomingText}`,
        notificationUrl: `https://${config.AWS_API_ENDPOINT_NAME}.${config.AWS_HOSTED_ZONE_NAME}/docs`,
      });
    }

    await sendAdaptiveCard(serviceUrl, conversationId, adaptiveCard, botToken);
  }
  return {
    statusCode: 200,
    body: "ok",
  };
};



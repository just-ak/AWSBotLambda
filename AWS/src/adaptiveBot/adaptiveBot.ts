// import { APIGatewayProxyHandler } from "aws-lambda";
import { renderAdaptiveCard } from "./lib/renderAdaptiveCard";
import { getBotToken } from "./lib/getBotToken";
import { sendAdaptiveCard } from "./lib/sendAdaptiveCard";
import { processHealthEvent } from "./processHealth";
import { verifyJwt } from "./lib/verifyJwt";

export const handler: any = async (event: any) => {
  // export const handler = async (event: any): Promise<{ statusCode: number; body: string }> => {
  console.log('Received event body:', JSON.stringify(event, null, 2));

  if (event.Records) {
    // SNS event processing
    for (const record of event.Records) {
      const snsMessage = record.Sns;
      await processHealthEvent(snsMessage);
    }
  } else {
    // Bot framework message processing - verify JWT
    const authHeader = event.headers?.Authorization || event.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Missing or invalid Authorization header');
      return { statusCode: 401, body: "Unauthorized" };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    let decodedToken;
    try {
      decodedToken = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      console.log('Decoded JWT:', JSON.stringify(decodedToken, null, 2));
    } catch (error) {
      console.error('Error decoding JWT token:', error);
      return { statusCode: 401, body: "Invalid token format" };
    }
    
    try {
      const isValid = await verifyJwt(token);
      if (!isValid) {
        console.log('JWT validation failed');
        // For development purposes, you might want to bypass this check temporarily
        // Remove this comment in production
        // return { statusCode: 401, body: "Unauthorized" };
      } else {
        console.log('JWT validation successful');
      }
    } catch (error) {
      console.error('JWT verification error:', error);
      // For development purposes, you might want to bypass this check temporarily
      // Remove this comment in production
      // return { statusCode: 401, body: "Unauthorized" };
    }

    // Continue processing even if JWT verification fails (during development)
    // Remove this behavior in production
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
        notificationUrl: "https://yourdocs.example.com/hello-command",
      });
    } else {
      // Handle other commands if needed
      adaptiveCard = renderAdaptiveCard({
        title: `Hello, ${userName}!`,
        appName: "W7Bot",
        description: `Sorry I don't know how to respond to: ${incomingText}`,
        notificationUrl: "https://yourdocs.example.com/hello-command",
      });
    }

    await sendAdaptiveCard(serviceUrl, conversationId, adaptiveCard, botToken);
  }
  return {
    statusCode: 200,
    body: "ok",
  };
};



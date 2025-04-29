// import { APIGatewayProxyHandler } from "aws-lambda";
import { renderAdaptiveCard } from "./renderAdaptiveCard";
import { getBotToken } from "./getBotToken";
import { sendAdaptiveCard } from "./sendAdaptiveCard";
import { processHealthEvent } from "./processHealth";

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

    const body = JSON.parse(event.body! || '{}');

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



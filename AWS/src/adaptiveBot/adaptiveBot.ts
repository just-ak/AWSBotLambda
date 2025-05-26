// import { APIGatewayProxyHandler } from "aws-lambda";
import { getBotToken } from "./lib/getBotToken";
import { sendAdaptiveCard } from "./lib/sendAdaptiveCard";
import { processSNSMessage } from "./lib/processSNSMessage";
import { config } from "./internal/config";
import { processBotIncommingText } from "./lib/processBotIncommingText";
import { processBotAction } from "./lib/processBotAction";


export interface botParams {
  body: any,
  channelId: string,
  config: typeof config,
  conversationId: string,
  conversationType: string,
  incomingText: string,
  locale: string,
  serviceUrl: string,
  tenantId: string,
  timezone: string,
  userAadObjectId: string,
  userId: string,
  userName: string,
  helpURl: string,
}


export const handler: any = async (event: any) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
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

    if (!serviceUrl || !conversationId) {
      console.error('Missing serviceUrl or conversationId.');
      return { statusCode: 400, body: "Bad Request" };
    }

    const botToken = await getBotToken(); // You define this securely
    const channelId = body.channelId || "Not available";
    const conversationType = body.conversation?.conversationType || "Not available";
    const incomingText: string = (body.text ?? "").toLowerCase();
    const locale = body.locale || "Not available";
    const tenantId = body.conversation?.tenantId || body.channelData?.tenant?.id || "Not available";
    const timezone = body.localTimezone || body.entities?.find((e: { type: string; }) => e.type === "clientInfo")?.timezone || "Not available";
    const userAadObjectId = body.from?.aadObjectId || "Not available";
    const userId = body.from?.id || "Not available";
    const userName: string = body.from?.name ?? "Unknown User";
    const helpURl = `https://${config.AWS_API_ENDPOINT_NAME}.${config.AWS_HOSTED_ZONE_NAME}/`;
    let adaptiveCard: any;
    if (body && body.type && body.value && body.value.actionType && body.type === "message") {
      adaptiveCard = await processBotAction({
        body: body,
        channelId: channelId,
        config: config,
        conversationId: conversationId,
        conversationType: conversationType,
        incomingText: incomingText,
        locale: locale,
        serviceUrl: serviceUrl,
        tenantId: tenantId,
        timezone: timezone,
        userAadObjectId: userAadObjectId,
        userId: userId,
        userName: userName,
        helpURl: helpURl,
      });
    }
    else if (incomingText) {
      adaptiveCard = await processBotIncommingText({
        body: body,
        channelId: channelId,
        config: config,
        conversationId: conversationId,
        conversationType: conversationType,
        incomingText: incomingText,
        locale: locale,
        serviceUrl: serviceUrl,
        tenantId: tenantId,
        timezone: timezone,
        userAadObjectId: userAadObjectId,
        userId: userId,
        userName: userName,
        helpURl: helpURl,
      });
      //await sendAdaptiveCard(serviceUrl, conversationId, adaptiveCard, botToken);
    }
    if (adaptiveCard) {
      await sendAdaptiveCard(serviceUrl, conversationId, adaptiveCard, botToken);
    }
    return {
      statusCode: 200,
      body: "ok",
    };
  }
}

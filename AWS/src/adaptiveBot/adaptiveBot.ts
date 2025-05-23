// import { APIGatewayProxyHandler } from "aws-lambda";
import { renderAdaptiveCard } from "./lib/renderAdaptiveCard";
import { getBotToken } from "./lib/getBotToken";
import { sendAdaptiveCard } from "./lib/sendAdaptiveCard";
import { processSNSMessage } from "./lib/processSNSMessage";
import { config } from "./internal/config";


export const handler: any = async (event: any) => {
  // console.log('Received event body:', JSON.stringify(event, null, 2));
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
    if (body && body.type && body.value && body.value.actionType &&
      body.type === "message" && body.value.actionType === "createRepo") {
      const actionData = body.value;

      if (actionData?.actionType === "createRepo") {
        const repoName = actionData.repoName;
        const repoDescription = actionData.repoDescription;
        const visibility = actionData.visibility;
        const initializeReadme = actionData.initializeReadme === "true";

        // Log the submission data
        console.log('Repository creation requested:', {
          repoName,
          repoDescription,
          visibility,
          initializeReadme
        });

        // Here you would implement the actual GitHub repo creation
        // For now, just send a confirmation message
        const responseCard = renderAdaptiveCard({
          adaptiveCard: 'confirmation-card',
          title: "Thank You!",
          appName: "W7Bot",
          description: `We're creating your repository '${repoName}' now. You'll receive a notification when it's ready.`,
          notificationUrl: `https://${config.AWS_API_ENDPOINT_NAME}.${config.AWS_HOSTED_ZONE_NAME}/`
        });

        await sendAdaptiveCard(actionData.serviceUrl, actionData.conversationId, responseCard, botToken);
        return { statusCode: 200, body: "ok" };
      }
    } else if (incomingText.includes("hello")) {
      adaptiveCard = renderAdaptiveCard({
        adaptiveCard: 'hello-card',
        title: `Hello, ${userName}!`,
        appName: "W7Bot",
        logo: `https://${config.AWS_API_ENDPOINT_NAME}.${config.AWS_HOSTED_ZONE_NAME}/assets/logo.png`,
        description: "You sent the command: /hello",
        notificationUrl: `https://${config.AWS_API_ENDPOINT_NAME}.${config.AWS_HOSTED_ZONE_NAME}/`,
      });
    } else if (incomingText.includes("echo")) {
      // Extract relevant information from the request
      const userId = body.from?.id || "Not available";
      const userAadObjectId = body.from?.aadObjectId || "Not available";
      const conversationType = body.conversation?.conversationType || "Not available";
      const tenantId = body.conversation?.tenantId || body.channelData?.tenant?.id || "Not available";
      const channelId = body.channelId || "Not available";
      const locale = body.locale || "Not available";
      const timezone = body.localTimezone || body.entities?.find((e: { type: string; }) => e.type === "clientInfo")?.timezone || "Not available";

      adaptiveCard = renderAdaptiveCard({
        adaptiveCard: 'echo-card',
        title: `Request Information Echo`,
        appName: "W7Bot",
        description: "Here's the important information from your request that can be used in IaC configuration:",
        notificationUrl: `https://${config.AWS_API_ENDPOINT_NAME}.${config.AWS_HOSTED_ZONE_NAME}/`,
        userId,
        userName,
        aadObjectId: userAadObjectId,
        conversationId,
        conversationType,
        tenantId,
        channelId,
        serviceUrl,
        locale,
        timezone
      });
    } else if (incomingText.toLowerCase().includes("new repository")) {
      // Form for creating a new GitHub repository
      adaptiveCard = renderAdaptiveCard({
        adaptiveCard: 'repo-form-card',
        title: `Create a New GitHub Repository`,
        appName: "W7Bot",
        description: "Please fill in the details for your new repository:",
        notificationUrl: `https://${config.AWS_API_ENDPOINT_NAME}.${config.AWS_HOSTED_ZONE_NAME}/`,
        formData: {
          serviceUrl,
          conversationId
        }
      });
    } else {
      // Handle other commands if needed
      adaptiveCard = renderAdaptiveCard({
        adaptiveCard: 'generic-card',
        title: `Hello, ${userName}!`,
        appName: "W7Bot",
        description: `Sorry I don't know how to respond to: ${incomingText}`,
        notificationUrl: `https://${config.AWS_API_ENDPOINT_NAME}.${config.AWS_HOSTED_ZONE_NAME}/`,
      });
    }

    await sendAdaptiveCard(serviceUrl, conversationId, adaptiveCard, botToken);
  }
  return {
    statusCode: 200,
    body: "ok",
  };
};



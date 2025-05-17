import { getConversationState, startNewConversation, updateConversationState } from "./conversation";
import { getBotToken } from "./lib/getBotToken";
import { config } from "./internal/config";
import { renderAdaptiveCard } from "./lib/renderAdaptiveCard";
import { sendAdaptiveCard } from "./lib/sendAdaptiveCard";

import * as uuid from 'uuid';



export async function processHealthEvent(event: SNSMessage): Promise<void> {
    console.log('Received SNS Event:', JSON.stringify(event, null, 2));

    const healthEvent: HealthEvent = JSON.parse(event.Message);
    console.log('Parsed Health Event:', healthEvent);

    const botToken = await getBotToken(); // Function to retrieve bot token
    const serviceUrl = `https://smba.trafficmanager.net/uk/${config.MicrosoftAppTenantId}/`; // Fetch the service URL dynamically if needed


    const userId = config.MicrosoftAppId!; // You'll want to dynamically retrieve the user ID
    const existingConversation = await getConversationState('conversationId', userId);

    if (existingConversation) {
        console.log('Continuing conversation with:', existingConversation);

        const adaptiveCard = renderAdaptiveCard({
            title: `Health Event Update: ${healthEvent.service}`,
            appName: "AWS Health Bot",
            description: healthEvent.description,
            notificationUrl: "https://aws.amazon.com/health/",
        });

        await sendAdaptiveCard(serviceUrl, 'existingConversation', adaptiveCard, botToken);
    } else {
        console.log('No existing conversation found. Starting new conversation...');
        const conversationId = await startNewConversation(serviceUrl, userId, botToken);

        console.log('No existing conversation found. Starting new conversation...');
        // Start a new conversation or log this as a new health event
        await updateConversationState(conversationId, userId, healthEvent);
        const adaptiveCard2 = renderAdaptiveCard({
            title: `New Health Event Update: ${healthEvent.service}`,
            appName: "AWS Health Bot",
            description: healthEvent.description,
            notificationUrl: "https://aws.amazon.com/health/",
        });

        const adaptiveCard = renderAdaptiveCard({
            eventTypeCode: healthEvent.eventTypeCode, // Ensure this field exists in healthEvent
            service: healthEvent.service,
            region: healthEvent.region,
            startTime: healthEvent.startTime,
            endTime: healthEvent.endTime,
            description: healthEvent.description,
        });

        await sendAdaptiveCard(serviceUrl, conversationId, adaptiveCard, botToken);
    }
}

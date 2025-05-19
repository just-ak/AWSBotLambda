import { getConversationState, startNewConversation, updateConversationState } from "./conversation";
import { getBotToken } from "./lib/getBotToken";
import { config } from "./internal/config";
import { renderAdaptiveCard } from "./lib/renderAdaptiveCard";
import { sendAdaptiveCard } from "./lib/sendAdaptiveCard";

// Factory function to create appropriate card data based on event source
function createCardDataForEvent(parsedEvent: GenericEvent): any {
    // Determine the event source and return appropriate card data
    switch (parsedEvent.source) {
        case 'aws.ssm':
            return {
                adaptiveCard: 'ssm-card',
                title: `Parameter Store Change: ${parsedEvent.detail?.name || 'Unknown Parameter'}`,
                appName: "AWS SSM Bot",
                description: `Operation: ${parsedEvent.detail?.operation || 'Unknown'}\nType: ${parsedEvent.detail?.type || 'Unknown'}`,
                notificationUrl: "https://console.aws.amazon.com/systems-manager/parameters",
                additionalInfo: `Region: ${parsedEvent.region || 'Unknown'}\nTime: ${parsedEvent.time || 'Unknown'}`,
                ...parsedEvent
            };
            
        // case 'aws.health':
        //     return {
        //         eventTypeCode: parsedEvent.eventTypeCode,
        //         service: parsedEvent.service,
        //         region: parsedEvent.region,
        //         startTime: parsedEvent.startTime,
        //         endTime: parsedEvent.endTime,
        //         description: parsedEvent.description
        //     };
            
        default:
            // Generic card for unknown event types
            return {
                adaptiveCard: 'notification-detail',
                title: `AWS Event: ${parsedEvent.source || 'Unknown Source'}`,
                appName: "AWS Notification Bot",
                description:  JSON.stringify(parsedEvent.detail, null, 2),
                notificationUrl: "https://console.aws.amazon.com/",
                additionalInfo: `Time: ${parsedEvent.time || 'Unknown'}\nRegion: ${parsedEvent.region || 'Unknown'}`,
                 ...parsedEvent
            };
    }
}

export async function processSNSMessage(event: SNSMessage): Promise<void> {
    console.log('Received SNS Event:', JSON.stringify(event, null, 2));

    const parsedEvent: GenericEvent = JSON.parse(event.Message);
    console.log('Parsed Event:', parsedEvent);

    const botToken = await getBotToken(); // Function to retrieve bot token
    const serviceUrl = `https://smba.trafficmanager.net/uk/${config.MicrosoftAppTenantId}/`; // Fetch the service URL dynamically if needed
    const userId = config.MicrosoftAppId!; // You'll want to dynamically retrieve the user ID
    const existingConversation = await getConversationState('conversationId', userId);

    if (existingConversation) {
        console.log('Continuing conversation with:', existingConversation);

        const cardData = createCardDataForEvent(parsedEvent);
        const adaptiveCard = renderAdaptiveCard(cardData);

        await sendAdaptiveCard(serviceUrl, 'existingConversation', adaptiveCard, botToken);
    } else {
        console.log('No existing conversation found. Starting new conversation...');
        const conversationId = await startNewConversation(serviceUrl, userId, botToken);

        console.log('No existing conversation found. Starting new conversation...');
        // Start a new conversation or log this as a new health event
        await updateConversationState(conversationId, userId, parsedEvent);

        const cardData = createCardDataForEvent(parsedEvent);
        const adaptiveCard = renderAdaptiveCard(cardData);

        await sendAdaptiveCard(serviceUrl, conversationId, adaptiveCard, botToken);
    }
}

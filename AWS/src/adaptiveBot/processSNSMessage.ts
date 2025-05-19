import { startNewConversation, storeInDynamoDB } from "./conversation";
import { getBotToken } from "./lib/getBotToken";
import { config } from "./internal/config";
import { renderAdaptiveCard } from "./lib/renderAdaptiveCard";
import { sendAdaptiveCard } from "./lib/sendAdaptiveCard";

const ASSETS =`https://${config.AWS_API_ENDPOINT_NAME}.${config.AWS_HOSTED_ZONE_NAME}/docs/assets`;
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
                logo: `${ASSETS}/systems-manager.png`,
                // image: `${ASSETS}/Systems Manager.png`,
                imageAltText: "SSM Image",
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
                logo: `${ASSETS}/generic-logo.png`,
                // image: `${ASSETS}/generic-image.png`,
                imageAltText: "Generic Image",
                 ...parsedEvent
            };
    }
}

export async function processSNSMessage(event: SNSMessage): Promise<void> {
    // console.log('Received SNS Event:', JSON.stringify(event, null, 2));

    const parsedEvent: GenericEvent = JSON.parse(event.Message);
    console.log('Parsed Event:', parsedEvent);

    const botToken = await getBotToken(); 
    const serviceUrl = `https://smba.trafficmanager.net/uk/${config.MicrosoftAppTenantId}/`;
    
    if (parsedEvent.dynamoDBUUIDUserId === 'unknown') {
        console.log('User ID is unknown. Using MicrosoftAppId as User ID.');
        parsedEvent.dynamoDBUUIDUserId = config.MicrosoftAppId!;
    }

    if (parsedEvent.dynamoDBUUIDConversationId != 'unknown' ) { 
        console.log('Continuing conversation with:', parsedEvent.dynamoDBUUIDUserId);

        const cardData = createCardDataForEvent(parsedEvent);
        const adaptiveCard = renderAdaptiveCard(cardData);

        await sendAdaptiveCard(serviceUrl, parsedEvent.dynamoDBUUIDConversationId, adaptiveCard, botToken);
    } else {
        // console.log('No existing conversation found. Starting new conversation...');
        const conversationId = await startNewConversation(serviceUrl, parsedEvent.dynamoDBUUIDUserId, botToken);
        // console.log('New conversation ID:', conversationId);
        parsedEvent.dynamoDBUUIDConversationId = conversationId

        console.log('Storing event in DynamoDB with conversation ID:', JSON.stringify(parsedEvent, null, 2));
        const cardData = createCardDataForEvent(parsedEvent);
        const adaptiveCard = renderAdaptiveCard(cardData);
        // console.log('Adaptive Card:', JSON.stringify(adaptiveCard, null, 2));
        const activityId = await sendAdaptiveCard(serviceUrl, parsedEvent.dynamoDBUUIDConversationId , adaptiveCard, botToken,  parsedEvent.dynamoDBUUIDActivityId || undefined);
        parsedEvent.dynamoDBUUIDActivityId = activityId;
        console.log('Activity ID:', activityId);
        await storeInDynamoDB(parsedEvent.dynamoDBUUID, parsedEvent);

    }
}

import { startNewConversation, storeInDynamoDB } from "./conversation";
import { getBotToken } from "./getBotToken";
import { config } from "../internal/config";
import { renderAdaptiveCard } from "./renderAdaptiveCard";
import { sendAdaptiveCard } from "./sendAdaptiveCard";

const ASSETS =`https://${config.AWS_API_ENDPOINT_NAME}.${config.AWS_HOSTED_ZONE_NAME}/assets`;
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
        console.log('Previous activity ID:', parsedEvent.dynamoDBUUIDActivityId || 'none');

        const cardData = createCardDataForEvent(parsedEvent);
        const adaptiveCard = renderAdaptiveCard(cardData);

        try {
            // Pass the previous activity ID to link cards in the conversation
            const activityId = await sendAdaptiveCard(
                serviceUrl, 
                parsedEvent.dynamoDBUUIDConversationId, 
                adaptiveCard, 
                botToken,
                undefined, // Used for Updating the original card
                parsedEvent.dynamoDBUUIDActivityId
            );
            parsedEvent.dynamoDBUUIDActivityId = activityId;
            console.log('New activity ID created:', activityId);
            await storeInDynamoDB(parsedEvent.dynamoDBUUID, parsedEvent);
        } catch (error) {
            console.error('Error sending adaptive card:', error);
            throw error; // Re-throw to handle at higher level if needed
        }
    } else {
        // console.log('No existing conversation found. Starting new conversation...');
        let conversationId;
        try {
            conversationId = await startNewConversation(serviceUrl, parsedEvent.dynamoDBUUIDUserId, botToken);
            console.log('New conversation ID:', conversationId);
            parsedEvent.dynamoDBUUIDConversationId = conversationId;

            const cardData = createCardDataForEvent(parsedEvent);
            const adaptiveCard = renderAdaptiveCard(cardData);
            
            const activityId = await sendAdaptiveCard(
                serviceUrl, 
                parsedEvent.dynamoDBUUIDConversationId, 
                adaptiveCard, 
                botToken,
                undefined,// First message in conversation, no previous activity ID
                undefined // Used for Replying the original card
            );
            parsedEvent.dynamoDBUUIDActivityId = activityId;
            console.log('New activity ID created:', activityId);
            await storeInDynamoDB(parsedEvent.dynamoDBUUID, parsedEvent);
        } catch (error) {
            console.error('Error in starting conversation or sending card:', error);
            throw error;
        }
    }
}

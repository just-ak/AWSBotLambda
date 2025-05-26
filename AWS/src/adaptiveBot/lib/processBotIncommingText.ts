import { botParams } from "../adaptiveBot";
import { renderAdaptiveCard } from "./renderAdaptiveCard";

export async function processBotIncommingText(props: botParams): Promise<any> {
    let adaptiveCard: any;

    // Determine which command is being used
    let command = "unknown";
    if (props.incomingText.includes("hello")) {
        command = "hello";
    } else if (props.incomingText.includes("echo")) {
        command = "echo";
    } else if (props.incomingText.toLowerCase().includes("new repository")) {
        command = "new-repository";
    }  else if (props.incomingText.toLowerCase().includes("new jira")) {
        command = "new-jira";
    } else if (props.incomingText.toLowerCase().includes("new pagerduty")) {
        command = "new-pagerduty";
    } else if (props.incomingText.toLowerCase().includes("new confluence")) {
        command = "new-confluence";
    }

    // Use switch statement to process the command
    switch (command) {
        case "hello":
            adaptiveCard = renderAdaptiveCard({
                adaptiveCard: 'hello-card',
                title: `Hello, ${props.userName}!`,
                appName: "W7Bot",
                logo: `https://${props.config.AWS_API_ENDPOINT_NAME}.${props.config.AWS_HOSTED_ZONE_NAME}/assets/logo.png`,
                description: "You sent the command: /hello",
                notificationUrl: props.helpURl,
            });
            break;

        case "echo":
            // Extract relevant information from the request
            adaptiveCard = renderAdaptiveCard({
                adaptiveCard: 'echo-card',
                title: `Request Information Echo`,
                appName: "W7Bot",
                description: "Here's the important information from your request that can be used in IaC configuration:",
                notificationUrl: props.helpURl,
                userId: props.userId,
                userName: props.userName,
                aadObjectId: props.userAadObjectId,
                conversationId: props.conversationId,
                conversationType: props.conversationType,
                tenantId: props.tenantId,
                channelId: props.channelId,
                serviceUrl: props.serviceUrl,
                locale: props.locale,
                timezone: props.timezone
            });
            break;

        case "new-repository":
            adaptiveCard = renderAdaptiveCard({
                adaptiveCard: 'repo-form-card',
                title: `Create a New GitHub Repository`,
                appName: "W7Bot",
                description: "Please fill in the details for your new repository:",
                notificationUrl: props.helpURl,
                formData: {
                    serviceUrl: props.serviceUrl,
                    conversationId: props.conversationId
                }
            });
            break;
        case "new-jira":
            adaptiveCard = renderAdaptiveCard({
                adaptiveCard: 'jira-form-card',
                title: `Create a New JIRA Ticket`,
                appName: "W7Bot",
                description: "Please fill in the details for your new Jira Ticket:",
                notificationUrl: props.helpURl,
                formData: {
                    serviceUrl: props.serviceUrl,
                    conversationId: props.conversationId
                }
            });
            break;
        case "new-pagerduty":
            adaptiveCard = renderAdaptiveCard({
                adaptiveCard: 'pagerduty-form-card',
                title: `Create a New PagerDuty Incident`,
                appName: "W7Bot",
                description: "Please fill in the details for your new PagerDuty incident:",
                notificationUrl: props.helpURl,
                formData: {
                    serviceUrl: props.serviceUrl,
                    conversationId: props.conversationId
                }
            });
            break;
        case "new-confluence":
            adaptiveCard = renderAdaptiveCard({
                adaptiveCard: 'confluence-form-card',
                title: `Create a New Confluence Page`,
                appName: "W7Bot",
                description: "Please fill in the details for your new Confluence page:",
                notificationUrl: props.helpURl,
                formData: {
                    serviceUrl: props.serviceUrl,
                    conversationId: props.conversationId
                }
            });
            break;

        default:
            adaptiveCard = renderAdaptiveCard({
                adaptiveCard: 'generic-card',
                title: `Hello, ${props.userName}!`,
                appName: "W7Bot",
                description: `Sorry I don't know how to respond to: ${props.incomingText}`,
                notificationUrl: props.helpURl,
            });
    }

    return adaptiveCard;
}

import { botParams } from "../adaptiveBot";
import { createConfluencePage } from "./confluenceIntegration";
import { createJiraTicket } from "./jiraIntegration";
import { createPagerDutyIncident } from "./pageDutyIntegration";
import { renderAdaptiveCard } from "./renderAdaptiveCard";

export async function processBotAction(props: botParams): Promise<any> {

    // Determine which command is being used
    let command = props.body.value.actionType || "unknown";
    const actionData = props.body.value;
    // Use switch statement to process the command
    switch (command) {
        case "createRepo":

            const repoName = actionData.repoName;
            const repoDescription = actionData.repoDescription;
            const visibility = actionData.visibility;
            const initializeReadme = actionData.initializeReadme === "true";

            console.log('Repository creation requested:', {
                repoName,
                repoDescription,
                visibility,
                initializeReadme
            });
            const adaptiveCard = renderAdaptiveCard({
                adaptiveCard: 'confirmation-card',
                title: "Thank You!",
                appName: "W7Bot",
                description: `We're creating your repository '${repoName}' now. You'll receive a notification when it's ready.`,
                notificationUrl: props.helpURl,
            });

            return adaptiveCard;
        case "createJiraTicket":
            try {
                const summary = actionData.summary;
                const description = actionData.description;
                const issueType = actionData.issueType;
                const priority = actionData.priority;
                const labels = actionData.labels ? actionData.labels.split(',').map((label: string) => label.trim()) : [];

                // Log the submission data
                // console.log('JIRA ticket creation requested:', {
                //     summary,
                //     description,
                //     issueType,
                //     priority,
                //     labels
                // });

                // Create the JIRA ticket
                const ticketKey = await createJiraTicket({
                    summary,
                    description,
                    issueType,
                    priority,
                    labels
                });

                // Send confirmation card
                const ticketUrl = `${props.config.JIRA_BASE_URL}/browse/${ticketKey}`;
                const responseCard = renderAdaptiveCard({
                    adaptiveCard: 'confirmation-card',
                    title: "Ticket Created!",
                    appName: "W7Bot",
                    description: `Successfully created ticket <a href="${ticketUrl}" target="_blank">${ticketKey}</a>.`,
                    notificationUrl: props.helpURl,
                });

                return responseCard;
            } catch (error: any) {
                console.error('Error creating JIRA ticket:', error);

                // Send error card
                const errorCard = renderAdaptiveCard({
                    adaptiveCard: 'confirmation-card',
                    title: "Error Creating Ticket",
                    appName: "W7Bot",
                    description: `Failed to create JIRA ticket: ${error.message}`,
                    notificationUrl: props.helpURl,
                });

                return errorCard;
            }
        case "createConfluencePage":
            try {
                const title = actionData.title;
                const description = actionData.description;
                const location = actionData.location;

                // Create the Confluence page
                const pageId = await createConfluencePage({
                    title,
                    description,
                    location
                });

                // Send confirmation card
                const pageUrl = `${props.config.CONFLUENCE_BASE_URL}/pages/viewpage.action?pageId=${pageId}`;
                const responseCard = renderAdaptiveCard({
                    adaptiveCard: 'confirmation-card',
                    title: "Confluence Page Created!",
                    appName: "W7Bot",
                    description: `Successfully created page <a href="${pageUrl}" target="_blank">${title}</a>.`,
                    notificationUrl: props.helpURl,
                });

                return responseCard;
            } catch (error: any) {
                console.error('Error creating Confluence page:', error);

                // Send error card
                const errorCard = renderAdaptiveCard({
                    adaptiveCard: 'confirmation-card',
                    title: "Error Creating Confluence Page",
                    appName: "W7Bot",
                    description: `Failed to create Confluence page: ${error.message}`,
                    notificationUrl: props.helpURl,
                });

                return errorCard;
            }
        case "createPagerDutyIncident":
            try {
                const title = actionData.title;
                const description = actionData.description;
                const serviceId = actionData.serviceId;
                const urgency = actionData.urgency;
                const priority = actionData.priority;
                const assigneeId = actionData.assigneeId || undefined;

                // Create the PagerDuty incident
                const incidentId = await createPagerDutyIncident({
                    title,
                    description,
                    serviceId,
                    urgency,
                    priority,
                    assigneeId
                });

                // Send confirmation card
                const incidentUrl = `https://${props.config.PAGERDUTY_SUBDOMAIN}.pagerduty.com/incidents/${incidentId}`;
                const responseCard = renderAdaptiveCard({
                    adaptiveCard: 'confirmation-card',
                    title: "Incident Created!",
                    appName: "W7Bot",
                    description: `Successfully created PagerDuty incident <a href="${incidentUrl}" target="_blank">${incidentId}</a>.`,
                    notificationUrl: props.helpURl,
                });

                return responseCard;
            } catch (error: any) {
                console.error('Error creating PagerDuty incident:', error);

                // Send error card
                const errorCard = renderAdaptiveCard({
                    adaptiveCard: 'confirmation-card',
                    title: "Error Creating Incident",
                    appName: "W7Bot",
                    description: `Failed to create PagerDuty incident: ${error.message}`,
                    notificationUrl: props.helpURl,
                });

                return errorCard;
            }
    }
}
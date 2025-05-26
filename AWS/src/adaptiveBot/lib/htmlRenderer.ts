import { renderHTMLPage } from './renderAdaptiveHTMLPage';

/**
 * Example function to demonstrate how to use the HTML rendering with placeholder data
 * @param {string} templateName - The name of the HTML template to use
 * @param {any} eventData - The event data to populate into the template
 * @returns {string} - The rendered HTML
 */
export function generateHealthEventPage(templateName: string, eventData: any): string {
  // Sample event data object with placeholder values that match the template
  const data = {
    EVENT_TITLE: eventData.title || 'AWS Health Event',
    EVENT_STATUS: eventData.status || 'In Progress',
    EVENT_TYPE: eventData.type || 'AWS Service Event',
    EVENT_TIME: eventData.time || new Date().toISOString(),
    AFFECTED_REGIONS: eventData.regions?.join(', ') || 'All Regions',
    AFFECTED_SERVICES: eventData.services?.join(', ') || 'Multiple Services',
    EVENT_ARN: eventData.arn || 'arn:aws:health::event/example',
    ACCOUNT_ID: eventData.accountId || '123456789012',
    EVENT_DESCRIPTION: eventData.description || 'No description provided',
    BUSINESS_IMPACT: eventData.businessImpact || 'Under assessment',
    TECHNICAL_IMPACT: eventData.technicalImpact || 'Under assessment',
    USER_IMPACT: eventData.userImpact || 'Under assessment',
    // Add other required placeholders with default values
  };

  // Merge any additional data provided 
  const mergedData = { ...data, ...eventData };

  // Render the HTML template
  return renderHTMLPage(templateName, mergedData);
}

/**
 * Create a HTML renderer for a specific template 
 * @param {string} templateName - The template name to use
 * @returns {function} - A renderer function that accepts data for this template
 */
export function createTemplateRenderer(templateName: string) {
  return (data: any): string => {
    return renderHTMLPage(templateName, data);
  };
}

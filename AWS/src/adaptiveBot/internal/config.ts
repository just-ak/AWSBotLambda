export const config = {
  MicrosoftAppId: process.env.BOT_ID,
  MicrosoftAppType: process.env.BOT_TYPE,
  MicrosoftAppTenantId: process.env.BOT_TENANT_ID,
  MicrosoftAppPassword: process.env.BOT_PASSWORD,
  BOT_NAME: process.env.BOT_NAME,
  AWS_HOSTED_ZONE_NAME: process.env.AWS_HOSTED_ZONE_NAME,
  AWS_API_ENDPOINT_NAME: process.env.AWS_API_ENDPOINT_NAME,
  JIRA_BASE_URL: process.env.JIRA_BASE_URL || 'https://unknown.atlassian.net',
  JIRA_EMAIL: process.env.JIRA_EMAIL || 'unknown',
  JIRA_API_TOKEN: process.env.JIRA_API_TOKEN || 'unknown',
  JIRA_PROJECT_KEY: process.env.JIRA_PROJECT_KEY || 'unknown',
  CONFLUENCE_BASE_URL: process.env.CONFLUENCE_BASE_URL || 'https://unknown.atlassian.net/wiki',
  CONFLUENCE_EMAIL: process.env.JIRA_EMAIL || 'unknown',
  CONFLUENCE_API_TOKEN: process.env.JIRA_API_TOKEN || 'unknown',
  PAGERDUTY_API_KEY: process.env.PAGERDUTY_API_KEY || 'unknown',
  PAGERDUTY_SUBDOMAIN: process.env.PAGERDUTY_SUBDOMAIN || 'unknown',
  PAGERDUTY_SERVICE_ID: process.env.PAGERDUTY_SERVICE_ID || 'unknown',
};



export const TABLE_NAME = 'HealthEventConversations'; // The DynamoDB table name



export const config = {
  MicrosoftAppId: process.env.BOT_ID,
  MicrosoftAppType: process.env.BOT_TYPE,
  MicrosoftAppTenantId: process.env.BOT_TENANT_ID,
  MicrosoftAppPassword: process.env.BOT_PASSWORD,
  BOT_NAME: process.env.BOT_NAME,
  AWS_HOSTED_ZONE_NAME: process.env.AWS_HOSTED_ZONE_NAME,
  AWS_API_ENDPOINT_NAME: process.env.AWS_API_ENDPOINT_NAME,
};

export const TABLE_NAME = 'HealthEventConversations'; // The DynamoDB table name



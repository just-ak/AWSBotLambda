# 🚀 Setup & Installation Guide

## Prerequisites

Before installing AWS Bot Lambda, ensure you have the following installed and configured:

### Required Software
- **Node.js**: Version 14.x or later
- **Yarn**: Package manager (preferred) or npm
- **AWS CLI**: Version 2.x
- **AWS CDK**: Version 2.x
- **Git**: For version control

### AWS Account Requirements
- AWS account with administrative permissions
- AWS CLI configured with appropriate credentials
- Sufficient permissions for:
  - Lambda functions
  - API Gateway
  - DynamoDB
  - SNS/SQS
  - S3
  - CloudFormation
  - EventBridge
  - Cognito (if using authentication)

### External Integrations (Optional)
- **Microsoft Teams**: Bot registration and webhook configuration
- **Slack**: Bot token and workspace permissions  
- **JIRA**: API token and project access
- **Confluence**: API token and space access
- **PagerDuty**: API key and service integration
- **Azure AD**: For Cognito federation (if using SSO)

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/just-ak/AWSBotLambda.git
cd AWSBotLambda
```

### 2. Install Dependencies

```bash
# Install root dependencies
yarn install

# Install workspace dependencies
yarn workspaces run install
```

### 3. Configure Environment Variables

Create a `.env` file in the AWS directory with the following variables:

```bash
# Bot Configuration
BOT_ID=your-bot-id
BOT_TYPE=MultiTenant
BOT_TENANT_ID=your-tenant-id
BOT_PASSWORD=your-bot-password
BOT_NAME=your-bot-name

# AWS Infrastructure
AWS_HOSTED_ZONE_ID=your-hosted-zone-id
AWS_HOSTED_ZONE_NAME=your-domain-name
AWS_API_ENDPOINT_NAME=your-api-endpoint

# JIRA Integration (Optional)
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-jira-token
JIRA_PROJECT_KEY=your-project-key

# Confluence Integration (Optional)
CONFLUENCE_BASE_URL=https://your-domain.atlassian.net
CONFLUENCE_EMAIL=your-email@example.com
CONFLUENCE_API_TOKEN=your-confluence-token

# PagerDuty Integration (Optional)
PAGERDUTY_API_KEY=your-pagerduty-api-key
PAGERDUTY_SUBDOMAIN=your-subdomain
PAGERDUTY_SERVICE_ID=your-service-id

# Cognito Authentication (Optional)
COGNITO_AZURE_TENANT_ID=your-azure-tenant-id
COGNITO_AZURE_CLIENT_ID=your-azure-client-id
COGNITO_AZURE_CLIENT_SECRET=your-azure-client-secret
COGNITO_AZURE_GROUP_ID=your-azure-group-id
COGNITO_USER_POOL_CLIENT_NAME=AzureADClient
COGNITO_USER_POOL_NAME=your-pool-name
COGNITO_PROVIDER_NAME=AzureAD
COGNITO_AZURE_CALLBACK_URL=callback
COGNITO_LOGOUT_URL=logout.html
COGNITO_USER_POOL_DOMAIN=your-pool-domain
COGNITO_CLIENT_ID=your-cognito-client-id
COGNITO_AWS_REGION=your-aws-region

# Azure AD URLs
ENTRA_ID_LOGIN_URL=https://login.microsoftonline.com/your-tenant-id/saml2
ENTRA_MICROSOFT_ENTRA_IDENTIFIER=https://sts.windows.net/your-tenant-id/
ENTRA_ID_LOGOUT_URL=https://login.microsoftonline.com/your-tenant-id/saml2
```

### 4. Configure AWS Credentials

```bash
# Configure AWS CLI
aws configure

# Or set environment variables
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_DEFAULT_REGION=your-region
```

### 5. Build the Project

```bash
# Build all workspaces
yarn build

# Or build specific components
cd AWS
yarn build
```

### 6. Deploy Infrastructure

```bash
# Navigate to AWS directory
cd AWS

# Bootstrap CDK (first time only)
yarn cdk bootstrap

# Deploy the stack
yarn cdk deploy

# Deploy with specific profile
yarn cdk deploy --profile your-profile
```

## Configuration Details

### Bot Platform Setup

#### Microsoft Teams

1. **Register Bot**: Go to [Microsoft Bot Framework](https://dev.botframework.com/)
2. **Create App**: Register a new bot application
3. **Configure Messaging**: Set the messaging endpoint to your API Gateway URL
4. **Get Credentials**: Note the App ID and App Password
5. **Add to Teams**: Install the bot in your Teams workspace

#### Slack

1. **Create App**: Go to [Slack API](https://api.slack.com/apps)
2. **Bot Token**: Generate a bot user OAuth token
3. **Event Subscriptions**: Configure webhook URL
4. **Permissions**: Add required OAuth scopes
5. **Install App**: Install to your workspace

### Event Configuration

Configure which AWS events trigger notifications in `src/adaptiveBot/internal/config.ts`:

```typescript
export const eventMappings = {
  "aws.ec2": "ec2-card",
  "aws.ssm": "ssm-card", 
  "aws.cloudwatch": "cloudwatch-card",
  "aws.health": "health-notification-card",
  "default": "notification-default"
};

export const fieldRemovalRules = {
  "aws.ssm": ["version", "id", "time"],
  "aws.ec2": ["responseElements", "requestParameters"]
};
```

### Integration Setup

#### JIRA Integration

1. **API Token**: Generate from [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)
2. **Project Key**: Find in JIRA project settings
3. **Permissions**: Ensure token has project access

#### Confluence Integration

1. **API Token**: Same as JIRA (shared Atlassian token)
2. **Space Key**: Find in Confluence space settings
3. **Permissions**: Ensure token has space access

#### PagerDuty Integration

1. **API Key**: Generate from PagerDuty account settings
2. **Service ID**: Find in PagerDuty service configuration
3. **Integration**: Create AWS CloudWatch integration

## Verification

### Test Deployment

1. **Check Stack**: Verify all resources are created
   ```bash
   aws cloudformation describe-stacks --stack-name your-stack-name
   ```

2. **Test API**: Send a test request to your API Gateway
   ```bash
   curl -X POST https://your-api-gateway-url/ \
     -H "Content-Type: application/json" \
     -d '{"test": "message"}'
   ```

3. **Check Logs**: Monitor CloudWatch logs for any errors
   ```bash
   aws logs describe-log-groups --log-group-name-prefix /aws/lambda/
   ```

### Test Notifications

1. **Manual Event**: Create a test EventBridge event
2. **Monitor Processing**: Check DynamoDB for deduplication entries
3. **Verify Delivery**: Confirm messages appear in messaging platform

## Common Setup Issues

### CDK Bootstrap Issues
```bash
# If bootstrap fails, try with explicit account/region
yarn cdk bootstrap aws://ACCOUNT-NUMBER/REGION
```

### Permission Issues
- Ensure AWS credentials have sufficient permissions
- Check IAM policies for Lambda execution roles
- Verify S3 bucket permissions for documentation

### Build Failures
```bash
# Clear cache and rebuild
yarn cache clean
rm -rf node_modules
yarn install
yarn build
```

### Documentation Not Loading
- Check S3 bucket deployment
- Verify API Gateway configuration
- Test S3 object access through console

## Next Steps

After successful installation:

1. **Configure Notifications**: Set up EventBridge rules for your AWS accounts
2. **Customize Cards**: Modify adaptive card templates as needed
3. **Set Up Monitoring**: Configure CloudWatch alarms and dashboards
4. **Test Integrations**: Verify external service integrations work correctly
5. **Documentation**: Access your documentation at `https://your-domain/docs`

For detailed configuration options, see the [Configuration Guide](./configuration.md).
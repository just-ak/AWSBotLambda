# ⚙️ Configuration Guide

## Environment Variables

### Core Bot Configuration

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `BOT_ID` | Microsoft Bot Framework App ID | Yes | - | `12345678-1234-1234-1234-123456789012` |
| `BOT_TYPE` | Bot type configuration | No | `MultiTenant` | `MultiTenant` |
| `BOT_TENANT_ID` | Azure tenant ID for the bot | Yes | - | `87654321-4321-4321-4321-210987654321` |
| `BOT_PASSWORD` | Microsoft Bot Framework App Password | Yes | - | `your-bot-password` |
| `BOT_NAME` | Display name for the bot | Yes | - | `AWS Notifications Bot` |

### AWS Infrastructure

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `AWS_HOSTED_ZONE_ID` | Route53 hosted zone ID | Yes | - | `Z1234567890ABC` |
| `AWS_HOSTED_ZONE_NAME` | Domain name for the hosted zone | Yes | - | `example.com` |
| `AWS_API_ENDPOINT_NAME` | API Gateway subdomain | Yes | - | `api` |

### JIRA Integration

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `JIRA_BASE_URL` | JIRA instance URL | No | - | `https://company.atlassian.net` |
| `JIRA_EMAIL` | JIRA account email | No | - | `admin@company.com` |
| `JIRA_API_TOKEN` | JIRA API token | No | - | `ATATT3x...` |
| `JIRA_PROJECT_KEY` | Default JIRA project key | No | - | `PROJ` |

### Confluence Integration

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `CONFLUENCE_BASE_URL` | Confluence instance URL | No | - | `https://company.atlassian.net` |
| `CONFLUENCE_EMAIL` | Confluence account email | No | - | `admin@company.com` |
| `CONFLUENCE_API_TOKEN` | Confluence API token | No | - | `ATATT3x...` |

### PagerDuty Integration

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `PAGERDUTY_API_KEY` | PagerDuty API key | No | - | `u+1234567890abcdef` |
| `PAGERDUTY_SUBDOMAIN` | PagerDuty subdomain | No | - | `company` |
| `PAGERDUTY_SERVICE_ID` | PagerDuty service ID | No | - | `P123ABC` |

### Cognito Authentication

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `COGNITO_AZURE_TENANT_ID` | Azure AD tenant ID | No | - | `12345678-1234-1234-1234-123456789012` |
| `COGNITO_AZURE_CLIENT_ID` | Azure AD client ID | No | - | `87654321-4321-4321-4321-210987654321` |
| `COGNITO_AZURE_CLIENT_SECRET` | Azure AD client secret | No | - | `your-client-secret` |
| `COGNITO_AZURE_GROUP_ID` | Azure AD group ID for access | No | - | `group-id-123` |
| `COGNITO_USER_POOL_CLIENT_NAME` | Cognito client name | No | `AzureADClient` | `AzureADClient` |
| `COGNITO_USER_POOL_NAME` | Cognito pool name | No | - | `aws-bot-pool` |
| `COGNITO_PROVIDER_NAME` | Identity provider name | No | `AzureAD` | `AzureAD` |
| `COGNITO_AZURE_CALLBACK_URL` | OAuth callback path | No | `callback` | `callback` |
| `COGNITO_LOGOUT_URL` | Logout redirect path | No | `logout.html` | `logout.html` |
| `COGNITO_USER_POOL_DOMAIN` | Cognito domain prefix | No | - | `aws-bot-auth` |
| `COGNITO_CLIENT_ID` | Cognito client ID | No | - | `generated-by-cognito` |
| `COGNITO_AWS_REGION` | AWS region for Cognito | No | - | `us-east-1` |

### Azure AD URLs

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `ENTRA_ID_LOGIN_URL` | Azure AD login URL | No | - | `https://login.microsoftonline.com/tenant-id/saml2` |
| `ENTRA_MICROSOFT_ENTRA_IDENTIFIER` | Azure AD identifier URL | No | - | `https://sts.windows.net/tenant-id/` |
| `ENTRA_ID_LOGOUT_URL` | Azure AD logout URL | No | - | `https://login.microsoftonline.com/tenant-id/saml2` |

## Event Configuration

### Event Mappings

Configure which AWS events trigger specific adaptive card templates in `src/adaptiveBot/internal/config.ts`:

```typescript
export const eventMappings = {
  // EC2 Events
  "aws.ec2": "ec2-card",
  "aws.ec2.instance-state-change": "ec2-card",
  
  // Systems Manager Events
  "aws.ssm": "ssm-card",
  "aws.ssm.maintenance-window": "ssm-card",
  
  // CloudWatch Events
  "aws.cloudwatch": "cloudwatch-card",
  "aws.cloudwatch.alarm": "cloudwatch-card",
  
  // Health Events
  "aws.health": "health-notification-card",
  "aws.health.event": "health-notification-card",
  
  // Security Events
  "aws.guardduty": "security-card",
  "aws.securityhub": "security-card",
  
  // Default fallback
  "default": "notification-default"
};
```

### Field Removal Rules

Configure which fields to ignore during deduplication to prevent noise:

```typescript
export const fieldRemovalRules = {
  "aws.ec2": [
    "responseElements", 
    "requestParameters",
    "awsRegion",
    "eventTime"
  ],
  "aws.ssm": [
    "version", 
    "id", 
    "time",
    "requestId"
  ],
  "aws.cloudwatch": [
    "timestamp",
    "requestId",
    "eventId"
  ],
  "aws.health": [
    "eventArn",
    "lastUpdatedTime"
  ]
};
```

### EventBridge Rules

Configure EventBridge rules in `lib/eventBridge/rules.ts`:

```typescript
// Example rule configuration
new events.Rule(this, 'EC2StateChangeRule', {
  eventPattern: {
    source: ['aws.ec2'],
    detailType: ['EC2 Instance State-change Notification'],
    detail: {
      state: ['running', 'stopped', 'terminated']
    }
  },
  targets: [new targets.LambdaFunction(props.targetLambda)]
});
```

## Adaptive Cards Configuration

### Card Templates

Available adaptive card templates are located in `src/adaptiveBot/adaptiveCards/`:

- `confirmation-card.json` - Generic confirmation messages
- `confluence-form-card.json` - Confluence integration forms
- `echo-card.json` - Simple echo/test messages
- `generic-card.json` - Generic notification template
- `health-notification-card.json` - AWS Health events
- `hello-card.json` - Welcome/greeting messages
- `jira-form-card.json` - JIRA integration forms
- `pagerduty-form-card.json` - PagerDuty incident forms
- `repo-form-card.json` - Repository action forms
- `ssm-card.json` - Systems Manager events

### Custom Card Templates

To create custom adaptive cards:

1. **Create Template**: Add a new JSON file in `src/adaptiveBot/adaptiveCards/`
2. **Register Template**: Add to the card registry in your configuration
3. **Add Variables**: Use `${variableName}` syntax for dynamic content

Example custom card:
```json
{
  "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
  "type": "AdaptiveCard",
  "version": "1.3",
  "body": [
    {
      "type": "TextBlock",
      "text": "Custom AWS Event: ${eventType}",
      "weight": "Bolder",
      "size": "Medium"
    },
    {
      "type": "TextBlock",
      "text": "${description}",
      "wrap": true
    }
  ]
}
```

## Integration Configuration

### JIRA Configuration

```typescript
// Example JIRA configuration
const jiraConfig = {
  baseUrl: process.env.JIRA_BASE_URL,
  email: process.env.JIRA_EMAIL,
  apiToken: process.env.JIRA_API_TOKEN,
  projectKey: process.env.JIRA_PROJECT_KEY,
  issueTypes: {
    incident: 'Bug',
    task: 'Task',
    story: 'Story'
  }
};
```

### PagerDuty Configuration

```typescript
// Example PagerDuty configuration
const pagerDutyConfig = {
  apiKey: process.env.PAGERDUTY_API_KEY,
  serviceId: process.env.PAGERDUTY_SERVICE_ID,
  escalationPolicy: 'default',
  urgency: 'high'
};
```

### Confluence Configuration

```typescript
// Example Confluence configuration
const confluenceConfig = {
  baseUrl: process.env.CONFLUENCE_BASE_URL,
  email: process.env.CONFLUENCE_EMAIL,
  apiToken: process.env.CONFLUENCE_API_TOKEN,
  spaceKey: 'DOCS',
  parentPageId: '12345'
};
```

## Deduplication Configuration

### Message Deduplication Settings

Configure deduplication behavior in `src/notifications/messageReducer.ts`:

```typescript
const deduplicationConfig = {
  // How long to keep deduplication records (seconds)
  ttl: 3600, // 1 hour
  
  // Hash algorithm for message fingerprinting
  hashAlgorithm: 'sha256',
  
  // Fields to include in hash calculation
  hashFields: [
    'source',
    'detailType', 
    'account',
    'region',
    'detail.eventName'
  ],
  
  // Maximum batch size for processing
  maxBatchSize: 25
};
```

### Retention Policies

```typescript
const retentionConfig = {
  // DynamoDB TTL settings
  messageDeduplication: 86400, // 24 hours
  conversations: 604800,       // 7 days
  
  // CloudWatch log retention
  logRetentionDays: 30,
  
  // S3 lifecycle policies
  documentationRetention: 90   // days
};
```

## Security Configuration

### API Gateway Security

```typescript
const apiGatewayConfig = {
  // CORS configuration
  cors: {
    allowOrigins: ['https://your-domain.com'],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization']
  },
  
  // Rate limiting
  throttle: {
    burstLimit: 100,
    rateLimit: 50
  },
  
  // Request validation
  validateRequestBody: true,
  validateRequestParameters: true
};
```

### Lambda Security

```typescript
const lambdaConfig = {
  // Environment encryption
  environmentEncryption: true,
  
  // Reserved concurrency
  reservedConcurrency: 10,
  
  // Dead letter queue
  deadLetterQueue: true,
  
  // VPC configuration
  vpc: {
    securityGroups: ['sg-12345'],
    subnets: ['subnet-12345', 'subnet-67890']
  }
};
```

## Monitoring Configuration

### CloudWatch Alarms

```typescript
const monitoringConfig = {
  alarms: {
    errorRate: {
      threshold: 5, // percent
      evaluationPeriods: 2
    },
    latency: {
      threshold: 5000, // milliseconds
      evaluationPeriods: 3
    },
    throttling: {
      threshold: 10, // count
      evaluationPeriods: 1
    }
  }
};
```

### X-Ray Tracing

```typescript
const tracingConfig = {
  enabled: true,
  mode: 'Active',
  samplingRate: 0.1 // 10% sampling
};
```

## Performance Tuning

### Lambda Performance

```typescript
const performanceConfig = {
  // Memory allocation
  memorySize: 512, // MB
  
  // Timeout settings
  timeout: 30, // seconds
  
  // Provisioned concurrency
  provisionedConcurrency: 5,
  
  // Connection pooling
  maxConnections: 10
};
```

### DynamoDB Performance

```typescript
const dynamoConfig = {
  // Billing mode
  billingMode: 'ON_DEMAND',
  
  // Auto-scaling (if using provisioned)
  readCapacity: {
    min: 5,
    max: 100
  },
  writeCapacity: {
    min: 5,
    max: 100
  }
};
```

For deployment-specific configurations, see the [Deployment Guide](./deployment.md).
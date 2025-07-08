# 🔗 Integrations Guide

## Overview

AWS Bot Lambda integrates with various external services to provide comprehensive incident management, documentation, and collaboration capabilities. This guide covers setup and usage for all supported integrations.

## Supported Integrations

- **JIRA** - Issue tracking and project management
- **Confluence** - Documentation and knowledge management
- **PagerDuty** - Incident response and alerting
- **Microsoft Teams** - Primary messaging platform
- **Slack** - Alternative messaging platform
- **Azure AD** - Identity and access management

## JIRA Integration

### Overview

The JIRA integration allows users to create, search, and manage JIRA issues directly from messaging platforms using interactive forms and commands.

### Prerequisites

- JIRA Cloud or Server instance
- JIRA account with appropriate permissions
- API token for authentication

### Setup

#### 1. Generate API Token

1. Go to [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click "Create API token"
3. Enter a label (e.g., "AWS Bot Lambda")
4. Copy the generated token

#### 2. Configure Environment Variables

```bash
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@company.com
JIRA_API_TOKEN=your-api-token
JIRA_PROJECT_KEY=PROJ
```

#### 3. Set Project Permissions

Ensure the API token user has permissions to:
- Browse projects
- Create issues
- Edit issues
- Add comments
- Transition issues

### Features

#### Create Issues

Users can create JIRA issues using the interactive form:

```
@bot create jira issue
```

**Form Fields:**
- **Project**: Dropdown of available projects
- **Issue Type**: Bug, Task, Story, Epic
- **Summary**: Brief description
- **Description**: Detailed information
- **Priority**: Highest, High, Medium, Low, Lowest
- **Assignee**: User selection

#### Search Issues

Search for existing issues using JQL:

```
@bot search jira [JQL query]
```

**Examples:**
- `@bot search jira project = PROJ AND status = Open`
- `@bot search jira assignee = currentUser()`
- `@bot search jira created >= -7d`

#### Issue Operations

- **View Details**: Get full issue information
- **Add Comments**: Add comments to existing issues
- **Update Status**: Transition issues between statuses
- **Assign Issues**: Change issue assignee

### Configuration

#### Custom Fields

Configure custom fields in `src/adaptiveBot/lib/jiraIntegration.ts`:

```typescript
const customFields = {
  'Environment': 'customfield_10001',
  'Severity': 'customfield_10002',
  'AWS Account': 'customfield_10003'
};
```

#### Issue Templates

Define issue templates for common scenarios:

```typescript
const issueTemplates = {
  'aws-incident': {
    issueType: 'Bug',
    priority: 'High',
    labels: ['aws', 'incident'],
    description: 'AWS incident template with standard fields'
  },
  'maintenance': {
    issueType: 'Task',
    priority: 'Medium',
    labels: ['maintenance', 'scheduled']
  }
};
```

### Automation

#### Auto-Create Issues

Automatically create JIRA issues for critical AWS events:

```typescript
// In event processing logic
if (event.severity === 'CRITICAL') {
  await createJiraIssue({
    project: 'OPS',
    issueType: 'Bug',
    summary: `Critical AWS Alert: ${event.eventType}`,
    description: generateIssueDescription(event),
    priority: 'Highest'
  });
}
```

## Confluence Integration

### Overview

The Confluence integration enables creation and management of documentation directly from the bot interface.

### Prerequisites

- Confluence Cloud or Server instance
- Confluence account with space permissions
- API token (same as JIRA if using Atlassian Cloud)

### Setup

#### 1. Configure Environment Variables

```bash
CONFLUENCE_BASE_URL=https://your-domain.atlassian.net
CONFLUENCE_EMAIL=your-email@company.com
CONFLUENCE_API_TOKEN=your-api-token
```

#### 2. Set Space Permissions

Ensure the API token user has permissions to:
- View space
- Create pages
- Edit pages
- Add attachments

### Features

#### Create Pages

Create Confluence pages for incident documentation:

```
@bot create confluence page
```

**Form Fields:**
- **Space**: Confluence space key
- **Title**: Page title
- **Content**: Page content (supports Confluence markup)
- **Parent Page**: Optional parent page
- **Labels**: Page labels

#### Search Content

Search Confluence content:

```
@bot search confluence [query]
```

#### Page Operations

- **Update Pages**: Edit existing pages
- **Add Comments**: Add page comments
- **Attach Files**: Upload attachments
- **Set Permissions**: Configure page permissions

### Templates

#### Incident Documentation Template

```confluence
h1. Incident Report: ${incidentId}

h2. Summary
${summary}

h2. Timeline
* *Start Time:* ${startTime}
* *Detection:* ${detectionTime}  
* *Resolution:* ${resolutionTime}

h2. Impact
* *Affected Services:* ${affectedServices}
* *User Impact:* ${userImpact}

h2. Root Cause
${rootCause}

h2. Action Items
* [ ] ${actionItem1}
* [ ] ${actionItem2}

h2. Lessons Learned
${lessonsLearned}
```

## PagerDuty Integration

### Overview

The PagerDuty integration provides incident management capabilities including incident creation, escalation, and status tracking.

### Prerequisites

- PagerDuty account
- API key with appropriate permissions
- Service integration configured

### Setup

#### 1. Generate API Key

1. Go to PagerDuty → Configuration → API Access
2. Click "Create New API Key"
3. Select "Full Access" or appropriate permissions
4. Copy the generated key

#### 2. Configure Environment Variables

```bash
PAGERDUTY_API_KEY=your-api-key
PAGERDUTY_SUBDOMAIN=your-company
PAGERDUTY_SERVICE_ID=P123ABC
```

#### 3. Service Configuration

Configure your PagerDuty service for AWS integration:
- Add AWS CloudWatch integration
- Set up escalation policies
- Configure notification rules

### Features

#### Create Incidents

Create PagerDuty incidents from critical alerts:

```
@bot create pagerduty incident
```

**Form Fields:**
- **Title**: Incident title
- **Service**: Target service
- **Urgency**: High or Low
- **Description**: Incident details
- **Escalation Policy**: Override default policy

#### Incident Management

- **Acknowledge**: Acknowledge incidents
- **Resolve**: Resolve incidents
- **Escalate**: Manual escalation
- **Add Notes**: Add incident notes

#### Status Monitoring

- **Service Status**: Check service health
- **On-Call Schedule**: View current on-call engineer
- **Incident History**: Review recent incidents

### Automation

#### Auto-Escalation

Automatically create incidents for critical AWS events:

```typescript
const shouldCreateIncident = (event: AWSEvent): boolean => {
  return event.severity === 'CRITICAL' || 
         event.source === 'aws.health' ||
         event.detailType.includes('FAILURE');
};

if (shouldCreateIncident(event)) {
  await createPagerDutyIncident({
    title: `AWS Alert: ${event.eventType}`,
    service: PAGERDUTY_SERVICE_ID,
    urgency: 'high',
    body: {
      type: 'incident_body',
      details: generateIncidentDetails(event)
    }
  });
}
```

## Microsoft Teams Integration

### Overview

Microsoft Teams is the primary messaging platform for the AWS Bot Lambda, providing rich adaptive card support and interactive experiences.

### Prerequisites

- Microsoft Teams workspace
- Bot Framework registration
- App registration in Azure AD

### Setup

#### 1. Register Bot in Azure

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to "Azure Bot" service
3. Create new bot registration
4. Configure messaging endpoint
5. Generate app password

#### 2. Configure Teams App

1. Use [App Studio](https://docs.microsoft.com/en-us/microsoftteams/platform/concepts/build-and-test/app-studio-overview) or Teams Developer Portal
2. Create new app manifest
3. Configure bot capabilities
4. Set up command menu
5. Deploy to Teams

#### 3. Environment Variables

```bash
BOT_ID=your-bot-app-id
BOT_PASSWORD=your-bot-app-password
BOT_TYPE=MultiTenant
BOT_TENANT_ID=your-azure-tenant-id
```

### Features

#### Rich Adaptive Cards

Teams supports the full Adaptive Cards specification:
- Interactive forms
- Action buttons
- Rich formatting
- Responsive layouts

#### Bot Commands

- `/help` - Show available commands
- `/status` - Bot and system status
- `/create` - Create various resources
- `/search` - Search integrations

#### Proactive Messaging

Send notifications to channels:

```typescript
await sendToTeamsChannel({
  channelId: 'channel-id',
  card: adaptiveCard,
  summary: 'AWS Alert Summary'
});
```

## Slack Integration

### Overview

Slack integration provides an alternative messaging platform with Block Kit support for interactive experiences.

### Prerequisites

- Slack workspace
- Slack app registration
- Bot token with appropriate permissions

### Setup

#### 1. Create Slack App

1. Go to [Slack API](https://api.slack.com/apps)
2. Click "Create New App"
3. Select "From scratch"
4. Configure OAuth & Permissions
5. Install app to workspace

#### 2. Configure Permissions

Required OAuth scopes:
- `chat:write` - Send messages
- `commands` - Slash commands
- `im:write` - Direct messages
- `channels:read` - Read channel list

#### 3. Environment Variables

```bash
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret
```

### Features

#### Block Kit UI

Slack uses Block Kit instead of Adaptive Cards:
- Section blocks
- Action blocks
- Input blocks
- Divider blocks

#### Slash Commands

- `/aws-bot help` - Show help
- `/aws-bot create` - Create resources
- `/aws-bot status` - Check status

#### Interactive Components

- Buttons
- Select menus
- Date pickers
- Multi-select

## Azure AD Integration

### Overview

Azure AD integration provides enterprise identity and access management through Cognito federation.

### Prerequisites

- Azure AD tenant
- Global administrator access
- App registration permissions

### Setup

#### 1. Register Enterprise Application

1. Go to Azure AD → Enterprise Applications
2. Click "New application"
3. Select "Create your own application"
4. Choose "Integrate any other application"

#### 2. Configure SAML

1. Set up Single Sign-On
2. Choose SAML
3. Configure Basic SAML Configuration:
   - **Identifier**: `urn:amazon:cognito:sp:${userPoolId}`
   - **Reply URL**: `https://${domain}.auth.${region}.amazoncognito.com/saml2/idpresponse`

#### 3. Configure Claims

Required claims:
- `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress`
- `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name`
- `http://schemas.microsoft.com/ws/2008/06/identity/claims/groups`

#### 4. Environment Variables

```bash
COGNITO_AZURE_TENANT_ID=your-tenant-id
COGNITO_AZURE_CLIENT_ID=your-client-id
COGNITO_AZURE_CLIENT_SECRET=your-client-secret
ENTRA_ID_LOGIN_URL=https://login.microsoftonline.com/tenant-id/saml2
```

### Features

#### Single Sign-On

Users can access the bot interface using their corporate credentials:
- Automatic user provisioning
- Group-based access control
- Seamless authentication flow

#### Group Mapping

Map Azure AD groups to bot permissions:

```typescript
const groupPermissions = {
  'AWS-Admins': ['create', 'delete', 'admin'],
  'AWS-Users': ['create', 'read'],
  'AWS-Viewers': ['read']
};
```

## Troubleshooting

### Common Issues

#### JIRA Connection Errors

- Verify API token is valid
- Check base URL format
- Ensure user has project permissions
- Test connectivity with curl

#### PagerDuty API Errors

- Verify API key permissions
- Check service ID exists
- Validate escalation policy
- Test with PagerDuty API directly

#### Teams/Slack Message Failures

- Check bot registration
- Verify webhook URLs
- Test permissions in platform
- Monitor CloudWatch logs

### Debugging Tips

1. **Enable Debug Logging**: Set appropriate log levels
2. **Test APIs Directly**: Use curl or Postman
3. **Check Permissions**: Verify service account permissions
4. **Monitor Metrics**: Watch CloudWatch metrics for errors

### Support Resources

- [JIRA REST API Documentation](https://developer.atlassian.com/cloud/jira/platform/rest/v3/)
- [Confluence REST API Documentation](https://developer.atlassian.com/cloud/confluence/rest/v1/)
- [PagerDuty API Documentation](https://developer.pagerduty.com/api-reference/)
- [Microsoft Bot Framework Documentation](https://docs.microsoft.com/en-us/azure/bot-service/)
- [Slack API Documentation](https://api.slack.com/)

For deployment and configuration details, see the [Configuration Guide](./configuration.md).
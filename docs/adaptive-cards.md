# 🃏 Adaptive Cards Guide

## Overview

Adaptive Cards provide a way to present rich, interactive content within messaging platforms. The AWS Bot Lambda uses Adaptive Cards to display AWS notifications, forms, and interactive content in a visually appealing format across Microsoft Teams, Slack, and other platforms.

## Available Card Templates

### Core Templates

#### 1. Notification Default (`notification-default`)
**Purpose:** General AWS notifications and alerts
**File:** `generic-card.json`

**Features:**
- Event type and source display
- Severity indicators with color coding
- Timestamp and region information
- Action buttons for quick responses

**Variables:**
- `${eventType}` - Type of AWS event
- `${source}` - AWS service source
- `${severity}` - Alert severity level
- `${description}` - Event description
- `${timestamp}` - Event timestamp
- `${region}` - AWS region
- `${account}` - AWS account ID

#### 2. Health Notification (`health-notification-card`)
**Purpose:** AWS Health Dashboard events
**File:** `health-notification-card.json`

**Features:**
- Service health status
- Affected resources list
- Impact assessment
- Remediation links

**Variables:**
- `${serviceName}` - Affected AWS service
- `${eventTypeCode}` - Health event type
- `${statusCode}` - Current status
- `${affectedEntities}` - List of affected resources
- `${description}` - Event description
- `${startTime}` - Event start time
- `${lastUpdateTime}` - Last update timestamp

#### 3. EC2 Events (`ec2-card`)
**Purpose:** EC2 instance state changes and events
**File:** `generic-card.json` (with EC2-specific styling)

**Features:**
- Instance ID and state display
- Instance type and availability zone
- Action buttons for instance management
- Cost information

**Variables:**
- `${instanceId}` - EC2 instance ID
- `${instanceType}` - Instance type (e.g., t3.micro)
- `${state}` - Current instance state
- `${availabilityZone}` - AZ location
- `${publicIp}` - Public IP address
- `${privateIp}` - Private IP address

#### 4. Systems Manager (`ssm-card`)
**Purpose:** SSM maintenance windows, patch compliance, and automation
**File:** `ssm-card.json`

**Features:**
- Maintenance window details
- Patch compliance status
- Automation execution results
- Resource targeting information

**Variables:**
- `${windowId}` - Maintenance window ID
- `${windowName}` - Window name
- `${executionStatus}` - Execution status
- `${targetCount}` - Number of targets
- `${successCount}` - Successful executions
- `${failureCount}` - Failed executions

### Interactive Forms

#### 5. JIRA Integration (`jira-form-card`)
**Purpose:** Create JIRA issues from Teams/Slack
**File:** `jira-form-card.json`

**Features:**
- Project selection dropdown
- Issue type selection
- Summary and description fields
- Priority and assignee selection
- Submit action

**Form Fields:**
- `project` - JIRA project key
- `issueType` - Issue type (Bug, Task, Story)
- `summary` - Issue summary
- `description` - Detailed description
- `priority` - Priority level
- `assignee` - Assigned user

#### 6. PagerDuty Integration (`pagerduty-form-card`)
**Purpose:** Create PagerDuty incidents
**File:** `pagerduty-form-card.json`

**Features:**
- Service selection
- Urgency level selection
- Incident title and description
- Auto-escalation options

**Form Fields:**
- `service` - PagerDuty service ID
- `title` - Incident title
- `urgency` - High or Low urgency
- `description` - Incident details

#### 7. Confluence Integration (`confluence-form-card`)
**Purpose:** Create Confluence pages for documentation
**File:** `confluence-form-card.json`

**Features:**
- Space selection
- Page title and content
- Parent page selection
- Template options

**Form Fields:**
- `space` - Confluence space key
- `title` - Page title
- `content` - Page content (markdown)
- `parentPageId` - Parent page ID

### Utility Cards

#### 8. Confirmation (`confirmation-card`)
**Purpose:** Confirmation dialogs and status updates
**File:** `confirmation-card.json`

**Features:**
- Success/error status indicators
- Action confirmation messages
- Next steps guidance

#### 9. Echo Card (`echo-card`)
**Purpose:** Testing and debugging
**File:** `echo-card.json`

**Features:**
- Simple message display
- Input echo functionality
- Debug information

#### 10. Hello Card (`hello-card`)
**Purpose:** Welcome messages and bot introduction
**File:** `hello-card.json`

**Features:**
- Bot greeting
- Feature overview
- Quick start actions

## Card Structure

### Basic Adaptive Card Schema

```json
{
  "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
  "type": "AdaptiveCard",
  "version": "1.3",
  "body": [
    {
      "type": "TextBlock",
      "text": "Card Title",
      "weight": "Bolder",
      "size": "Medium"
    }
  ],
  "actions": [
    {
      "type": "Action.Submit",
      "title": "Submit",
      "data": {
        "action": "submit_form"
      }
    }
  ]
}
```

### Common Elements

#### Text Blocks
```json
{
  "type": "TextBlock",
  "text": "${variableName}",
  "weight": "Bolder|Default",
  "size": "Small|Default|Medium|Large|ExtraLarge",
  "color": "Default|Dark|Light|Accent|Good|Warning|Attention",
  "wrap": true
}
```

#### Fact Sets (Key-Value Pairs)
```json
{
  "type": "FactSet",
  "facts": [
    {
      "title": "Account:",
      "value": "${account}"
    },
    {
      "title": "Region:",
      "value": "${region}"
    }
  ]
}
```

#### Input Fields
```json
{
  "type": "Input.Text",
  "id": "summary",
  "placeholder": "Enter summary",
  "label": "Summary",
  "isRequired": true
}
```

#### Action Buttons
```json
{
  "type": "Action.Submit",
  "title": "Create Issue",
  "data": {
    "action": "create_jira_issue",
    "project": "${project}"
  }
}
```

## Variable Substitution

### Dynamic Content

Cards support variable substitution using `${variableName}` syntax:

```json
{
  "type": "TextBlock",
  "text": "Instance ${instanceId} is now ${state} in ${region}"
}
```

### Data Sources

Variables can come from:
- EventBridge event data
- AWS API responses
- User input from forms
- External system data (JIRA, PagerDuty)

### Processing Pipeline

1. **Event Reception**: Raw event data received
2. **Data Extraction**: Relevant fields extracted
3. **Template Selection**: Appropriate card template chosen
4. **Variable Mapping**: Event data mapped to template variables
5. **Card Rendering**: Template rendered with actual values
6. **Delivery**: Rendered card sent to messaging platform

## Creating Custom Cards

### Step 1: Design the Card

Use the [Adaptive Cards Designer](https://adaptivecards.io/designer/) to create and test your card layout.

### Step 2: Add Template File

Create a new JSON file in `src/adaptiveBot/adaptiveCards/`:

```json
{
  "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
  "type": "AdaptiveCard",
  "version": "1.3",
  "body": [
    {
      "type": "TextBlock",
      "text": "Custom AWS Event: ${customEventType}",
      "weight": "Bolder",
      "size": "Medium",
      "color": "Accent"
    },
    {
      "type": "FactSet",
      "facts": [
        {
          "title": "Service:",
          "value": "${serviceName}"
        },
        {
          "title": "Status:",
          "value": "${status}"
        }
      ]
    }
  ],
  "actions": [
    {
      "type": "Action.OpenUrl",
      "title": "View in Console",
      "url": "${consoleUrl}"
    }
  ]
}
```

### Step 3: Register the Template

Add to the card registry in `src/adaptiveBot/internal/config.ts`:

```typescript
export const eventMappings = {
  "aws.custom-service": "custom-service-card",
  // ... other mappings
};
```

### Step 4: Update Card Loader

Ensure your card is loaded in the card rendering logic:

```typescript
const cardTemplates = {
  'notification-default': require('../adaptiveCards/generic-card.json'),
  'custom-service-card': require('../adaptiveCards/custom-service-card.json'),
  // ... other templates
};
```

## Styling and Theming

### Color Schemes

Adaptive Cards support several color themes:
- `Default` - Standard text color
- `Dark` - Dark text
- `Light` - Light text
- `Accent` - Platform accent color
- `Good` - Success/positive (green)
- `Warning` - Warning (yellow/orange)
- `Attention` - Error/critical (red)

### Container Styles

```json
{
  "type": "Container",
  "style": "Default|Emphasis|Good|Attention|Warning|Accent",
  "items": [...]
}
```

### Responsive Design

Cards automatically adapt to different screen sizes, but you can control layout:

```json
{
  "type": "ColumnSet",
  "columns": [
    {
      "type": "Column",
      "width": "auto",
      "items": [...]
    },
    {
      "type": "Column", 
      "width": "stretch",
      "items": [...]
    }
  ]
}
```

## Advanced Features

### Conditional Rendering

Show/hide elements based on data:

```json
{
  "type": "TextBlock",
  "text": "Critical Alert!",
  "$when": "${severity == 'high'}"
}
```

### Action Handling

Handle different action types:

```typescript
// In processBotAction.ts
switch (action.type) {
  case 'create_jira_issue':
    return await createJiraIssue(action.data);
  case 'create_pagerduty_incident':
    return await createPagerDutyIncident(action.data);
  case 'acknowledge_alert':
    return await acknowledgeAlert(action.data);
}
```

### Data Validation

Validate form inputs before processing:

```json
{
  "type": "Input.Text",
  "id": "email",
  "label": "Email Address",
  "regex": "^[\\w\\.-]+@[\\w\\.-]+\\.[a-zA-Z]{2,}$",
  "errorMessage": "Please enter a valid email address"
}
```

## Platform-Specific Considerations

### Microsoft Teams

- Supports full Adaptive Cards 1.3 specification
- Action.Submit sends data back to bot
- Rich formatting and styling options

### Slack

- Limited Adaptive Cards support
- Uses Block Kit as alternative
- Automatic conversion for basic elements

### Fallback Handling

For platforms with limited support:

```typescript
const generateFallbackMessage = (cardData: any): string => {
  return `AWS Alert: ${cardData.eventType} in ${cardData.region}
Account: ${cardData.account}
Details: ${cardData.description}`;
};
```

## Testing Cards

### Local Testing

Use the Adaptive Cards Designer to test card rendering:

1. Copy your card JSON
2. Paste into designer
3. Add sample data
4. Preview in different themes

### Bot Framework Emulator

Test cards in the Bot Framework Emulator:

1. Install Bot Framework Emulator
2. Connect to your local bot endpoint
3. Send test messages
4. Verify card rendering and actions

### Production Testing

Test in actual messaging platforms:

1. Deploy to staging environment
2. Send test events through EventBridge
3. Verify cards appear correctly
4. Test interactive elements

## Troubleshooting

### Common Issues

#### Card Not Displaying
- Check JSON syntax validity
- Verify template is registered in config
- Ensure all required variables are provided

#### Variables Not Substituted
- Check variable names match exactly
- Verify data is available in event payload
- Check for typos in template

#### Actions Not Working
- Verify action data format
- Check bot action handler implementation
- Ensure proper permissions for external services

### Debugging Tips

1. **Log Card Data**: Log the rendered card JSON
2. **Validate Schema**: Use online JSON validators
3. **Test Variables**: Send test events with known data
4. **Platform Limits**: Check platform-specific card size limits

For more details on specific integrations, see the [Integrations Guide](./integrations.md).
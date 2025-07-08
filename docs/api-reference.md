# 🔌 API Reference

## Overview

The AWS Bot Lambda provides a RESTful API through Amazon API Gateway for bot interactions and documentation access. All endpoints support HTTPS and can be secured with authentication.

## Base URL

```
https://{api-gateway-domain}/
```

## Authentication

### Optional Cognito Authentication

If Cognito authentication is enabled, include the JWT token in requests:

```http
Authorization: Bearer {jwt-token}
```

### Bot Framework Authentication

For bot interactions, Microsoft Bot Framework handles authentication automatically through the webhook mechanism.

## Endpoints

### Bot Webhook

#### POST /

Primary endpoint for receiving messages from messaging platforms.

**Headers:**
```http
Content-Type: application/json
Authorization: Bearer {token} (if auth enabled)
```

**Request Body (Teams):**
```json
{
  "type": "message",
  "id": "message-id",
  "timestamp": "2023-01-01T00:00:00.000Z",
  "localTimestamp": "2023-01-01T00:00:00.000Z",
  "serviceUrl": "https://smba.trafficmanager.net/teams/",
  "channelId": "msteams",
  "from": {
    "id": "user-id",
    "name": "User Name"
  },
  "conversation": {
    "id": "conversation-id",
    "conversationType": "personal"
  },
  "recipient": {
    "id": "bot-id",
    "name": "Bot Name"
  },
  "text": "hello",
  "locale": "en-US"
}
```

**Request Body (SNS Notification):**
```json
{
  "Type": "Notification",
  "MessageId": "message-id",
  "TopicArn": "arn:aws:sns:region:account:topic",
  "Subject": "AWS Notification",
  "Message": "{\"eventData\": {...}}",
  "Timestamp": "2023-01-01T00:00:00.000Z",
  "SubscribeURL": null,
  "UnsubscribeURL": "https://..."
}
```

**Response:**
```json
{
  "status": "ok",
  "messageId": "response-message-id"
}
```

**Status Codes:**
- `200 OK` - Message processed successfully
- `400 Bad Request` - Invalid request format
- `401 Unauthorized` - Authentication failed
- `500 Internal Server Error` - Processing error

---

### Documentation Access

#### GET /docs

Serves the main documentation page.

**Headers:**
```http
Accept: text/html
Authorization: Bearer {token} (if auth enabled)
```

**Response:**
```html
<!DOCTYPE html>
<html>
<head>
    <title>AWS Bot Documentation</title>
    ...
</head>
<body>
    ...
</body>
</html>
```

**Status Codes:**
- `200 OK` - Documentation retrieved successfully
- `401 Unauthorized` - Authentication required
- `404 Not Found` - Documentation not found

#### GET /docs/{proxy+}

Serves documentation resources (CSS, JS, images, additional pages).

**Parameters:**
- `proxy+` (path) - Resource path within documentation

**Examples:**
- `/docs/setup.html` - Setup guide
- `/docs/api.html` - API reference
- `/docs/assets/style.css` - Stylesheet
- `/docs/images/architecture.png` - Images

**Response:**
Appropriate content type based on file extension.

**Status Codes:**
- `200 OK` - Resource retrieved successfully
- `401 Unauthorized` - Authentication required
- `404 Not Found` - Resource not found

---

## Bot Commands

### Interactive Commands

Commands that can be sent to the bot through messaging platforms:

#### Help Command
```
@bot help
```
**Response:** List of available commands and features

#### Status Command
```
@bot status
```
**Response:** Bot health and system status

#### Create JIRA Issue
```
@bot create jira issue
```
**Response:** Interactive form for creating JIRA issues

#### Create PagerDuty Incident
```
@bot create pagerduty incident
```
**Response:** Interactive form for creating PagerDuty incidents

#### Search Confluence
```
@bot search confluence {query}
```
**Response:** Search results from Confluence

### Adaptive Card Actions

Actions triggered by user interactions with adaptive cards:

#### Action Types
- `submit` - Form submission
- `openUrl` - Open external URL
- `showCard` - Display nested card
- `toggleVisibility` - Show/hide elements

#### Action Data Format
```json
{
  "type": "Action.Submit",
  "data": {
    "action": "create_jira_issue",
    "project": "PROJ",
    "issueType": "Bug",
    "summary": "Issue summary",
    "description": "Issue description"
  }
}
```

---

## Webhook Signatures

### Microsoft Teams Verification

Teams webhooks include verification headers:

```http
X-MS-Signature-256: sha256={signature}
```

### Slack Verification

Slack webhooks include timestamp and signature:

```http
X-Slack-Signature: v0={signature}
X-Slack-Request-Timestamp: {timestamp}
```

---

## Event Processing API

### Internal SNS Processing

The message reducer processes EventBridge events through SNS:

#### Event Structure
```json
{
  "version": "0",
  "id": "event-id",
  "detail-type": "EC2 Instance State-change Notification",
  "source": "aws.ec2",
  "account": "123456789012",
  "time": "2023-01-01T00:00:00Z",
  "region": "us-east-1",
  "detail": {
    "instance-id": "i-1234567890abcdef0",
    "state": "running"
  }
}
```

#### Processing Flow
1. Event received from EventBridge
2. Field removal rules applied
3. Message hash calculated
4. Deduplication check performed
5. If unique, published to SNS
6. Bot receives SNS notification
7. Adaptive card generated and sent

---

## Integration APIs

### JIRA Integration

#### Create Issue

**Internal Function:** `createJiraIssue(issueData)`

**Parameters:**
```typescript
interface JiraIssueData {
  project: string;
  issueType: string;
  summary: string;
  description?: string;
  priority?: string;
  assignee?: string;
  labels?: string[];
}
```

**Response:**
```typescript
interface JiraIssueResponse {
  id: string;
  key: string;
  self: string;
  url: string;
}
```

#### Search Issues

**Internal Function:** `searchJiraIssues(jql, maxResults?)`

**Parameters:**
- `jql` (string) - JQL query string
- `maxResults` (number, optional) - Maximum results to return

### PagerDuty Integration

#### Create Incident

**Internal Function:** `createPagerDutyIncident(incidentData)`

**Parameters:**
```typescript
interface PagerDutyIncidentData {
  title: string;
  service: string;
  urgency: 'high' | 'low';
  body?: {
    type: 'incident_body';
    details: string;
  };
}
```

#### Get Service Status

**Internal Function:** `getPagerDutyServiceStatus(serviceId)`

### Confluence Integration

#### Create Page

**Internal Function:** `createConfluencePage(pageData)`

**Parameters:**
```typescript
interface ConfluencePageData {
  space: string;
  title: string;
  body: string;
  parentId?: string;
}
```

#### Search Content

**Internal Function:** `searchConfluence(query, spaceKey?)`

---

## Error Responses

### Standard Error Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {
      "field": "Additional error details"
    }
  },
  "requestId": "request-correlation-id"
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `INVALID_REQUEST` | 400 | Request format is invalid |
| `UNAUTHORIZED` | 401 | Authentication required or failed |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Internal server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

---

## Rate Limiting

### Default Limits

- **Bot Webhook**: 100 requests per minute per source
- **Documentation**: 1000 requests per minute per IP
- **Burst Limit**: 200 requests per 10 seconds

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## SDK Examples

### TypeScript/JavaScript

```typescript
import axios from 'axios';

const botApi = axios.create({
  baseURL: 'https://your-api-gateway-url',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-jwt-token'
  }
});

// Send message to bot
const response = await botApi.post('/', {
  type: 'message',
  text: 'hello bot'
});

// Get documentation
const docs = await botApi.get('/docs');
```

### Python

```python
import requests

# Configuration
base_url = "https://your-api-gateway-url"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer your-jwt-token"
}

# Send message to bot
response = requests.post(
    f"{base_url}/",
    json={"type": "message", "text": "hello bot"},
    headers=headers
)

# Get documentation
docs = requests.get(f"{base_url}/docs", headers=headers)
```

### cURL

```bash
# Send message to bot
curl -X POST https://your-api-gateway-url/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{"type": "message", "text": "hello bot"}'

# Get documentation
curl -H "Authorization: Bearer your-jwt-token" \
  https://your-api-gateway-url/docs
```

---

## Monitoring and Observability

### CloudWatch Metrics

The API automatically publishes metrics to CloudWatch:

- `RequestCount` - Total number of requests
- `ErrorRate` - Percentage of failed requests
- `Latency` - Request processing time
- `ThrottleCount` - Number of throttled requests

### X-Ray Tracing

All API requests are traced with AWS X-Ray when enabled:

```http
X-Amzn-Trace-Id: Root=1-5e1b4151-5ac6c58d3a0a8b9c7f2e3d4c
```

### Request Correlation

Each request receives a unique correlation ID:

```http
X-Request-ID: req_1234567890abcdef
```

Use this ID for support and debugging purposes.
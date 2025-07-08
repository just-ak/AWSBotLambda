# 🛠️ Troubleshooting Guide

## Overview

This guide helps diagnose and resolve common issues with AWS Bot Lambda deployment, configuration, and operation.

## Quick Diagnostics

### Health Check Commands

```bash
# Check CDK stack status
aws cloudformation describe-stacks --stack-name YourStackName

# Test API Gateway endpoint
curl -X POST https://your-api-gateway-url/ \
  -H "Content-Type: application/json" \
  -d '{"test": "message"}'

# Check Lambda function logs
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/

# Verify S3 documentation bucket
aws s3 ls s3://your-documentation-bucket/

# Test SNS topic
aws sns list-topics | grep awsNotificationsTopic
```

### Environment Verification

```bash
# Verify required environment variables
echo "BOT_ID: $BOT_ID"
echo "AWS_REGION: $AWS_REGION"
echo "JIRA_BASE_URL: $JIRA_BASE_URL"

# Check AWS credentials
aws sts get-caller-identity

# Verify CDK version
cdk --version

# Check Node.js version
node --version
```

## Common Issues

### 1. Deployment Issues

#### CDK Bootstrap Failures

**Symptoms:**
- CDK deploy fails with "Bootstrap" errors
- Missing S3 bucket for CDK assets
- IAM permission errors during bootstrap

**Solutions:**

```bash
# Bootstrap with specific account/region
cdk bootstrap aws://123456789012/us-east-1

# Bootstrap with custom S3 bucket
cdk bootstrap --bootstrap-bucket-name my-cdk-bootstrap-bucket

# Bootstrap with CloudFormation stack name
cdk bootstrap --bootstrap-stack-name CDKToolkit-Custom
```

**Common Errors:**

```
Error: Need to perform AWS CDK bootstrap
```
**Solution:** Run `cdk bootstrap` in your target account/region

```
Error: Access Denied when calling AssumeRole
```
**Solution:** Verify AWS credentials and permissions

#### Stack Deployment Failures

**Symptoms:**
- CloudFormation stack creation fails
- Resource creation timeouts
- Dependency resolution errors

**Diagnostic Commands:**

```bash
# Check stack events
aws cloudformation describe-stack-events --stack-name YourStackName

# View stack resources
aws cloudformation describe-stack-resources --stack-name YourStackName

# Check failed resources
aws cloudformation describe-stack-events --stack-name YourStackName \
  --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`]'
```

**Common Solutions:**

```bash
# Retry deployment with verbose output
cdk deploy --verbose

# Deploy with rollback disabled for debugging
cdk deploy --no-rollback

# Check resource limits
aws service-quotas list-service-quotas --service-code lambda
```

### 2. Authentication Issues

#### Cognito Configuration Problems

**Symptoms:**
- Users unable to authenticate
- SAML assertion errors
- JWT token validation failures

**Debugging Steps:**

1. **Verify SAML Configuration:**
```bash
# Test SAML metadata endpoint
curl -s "https://login.microsoftonline.com/YOUR-TENANT-ID/federationmetadata/2007-06/federationmetadata.xml"

# Check Cognito SAML provider
aws cognito-idp list-identity-providers --user-pool-id YOUR-USER-POOL-ID
```

2. **Validate JWT Tokens:**
```javascript
// Use jwt.io or custom validation
const jwt = require('jsonwebtoken');
const token = 'your-jwt-token';

try {
  const decoded = jwt.decode(token, { complete: true });
  console.log('Token header:', decoded.header);
  console.log('Token payload:', decoded.payload);
} catch (error) {
  console.error('Invalid token:', error.message);
}
```

3. **Check Group Claims:**
```bash
# View user attributes in Cognito
aws cognito-idp admin-get-user \
  --user-pool-id YOUR-USER-POOL-ID \
  --username username@example.com
```

#### Azure AD Integration Issues

**Symptoms:**
- SAML SSO not working
- Group claims missing
- User attribute mapping failures

**Solutions:**

1. **Verify Entity ID:**
```xml
<!-- Should match exactly in Azure AD and Cognito -->
urn:amazon:cognito:sp:YOUR-USER-POOL-ID
```

2. **Check Reply URLs:**
```
https://YOUR-DOMAIN.auth.YOUR-REGION.amazoncognito.com/saml2/idpresponse
```

3. **Validate Claims Configuration:**
```xml
<!-- Required claims in Azure AD -->
http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress
http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname
http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname
```

### 3. Bot Integration Issues

#### Microsoft Teams Connection Problems

**Symptoms:**
- Bot not responding to messages
- Webhook validation failures
- Adaptive cards not displaying

**Debugging Steps:**

1. **Verify Bot Registration:**
```bash
# Check bot configuration in Azure
curl -X GET "https://api.botframework.com/v3/bots/YOUR-BOT-ID" \
  -H "Authorization: Bearer YOUR-BOT-TOKEN"
```

2. **Test Webhook Endpoint:**
```bash
# Test bot endpoint directly
curl -X POST https://your-api-gateway-url/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR-BOT-TOKEN" \
  -d '{
    "type": "message",
    "text": "test",
    "from": {"id": "test-user"},
    "conversation": {"id": "test-conversation"}
  }'
```

3. **Check Bot Framework Logs:**
```bash
# View Lambda logs for bot function
aws logs filter-log-events \
  --log-group-name /aws/lambda/your-bot-function \
  --start-time $(date -d '1 hour ago' +%s)000
```

#### Adaptive Cards Not Rendering

**Symptoms:**
- Cards appear as plain text
- Interactive elements not working
- Formatting issues

**Solutions:**

1. **Validate Card JSON:**
```bash
# Use online validator at adaptivecards.io
# Or validate programmatically
node -e "
const card = require('./path/to/card.json');
console.log('Valid JSON:', !!card.type && card.type === 'AdaptiveCard');
"
```

2. **Check Template Variables:**
```javascript
// Verify all variables are substituted
const cardTemplate = require('./card-template.json');
const cardString = JSON.stringify(cardTemplate);
const unresolvedVars = cardString.match(/\$\{[^}]+\}/g);
if (unresolvedVars) {
  console.log('Unresolved variables:', unresolvedVars);
}
```

### 4. External Integration Issues

#### JIRA API Errors

**Symptoms:**
- 401 Unauthorized errors
- 403 Forbidden errors  
- Connection timeouts

**Debugging Steps:**

1. **Test API Credentials:**
```bash
# Test basic authentication
curl -u "email@example.com:API_TOKEN" \
  "https://your-domain.atlassian.net/rest/api/2/myself"

# Test project access
curl -u "email@example.com:API_TOKEN" \
  "https://your-domain.atlassian.net/rest/api/2/project/YOUR-PROJECT-KEY"
```

2. **Verify SSL/TLS:**
```bash
# Check certificate validity
openssl s_client -connect your-domain.atlassian.net:443 -servername your-domain.atlassian.net
```

3. **Check Rate Limits:**
```javascript
// Monitor response headers
const response = await fetch(jiraUrl, options);
console.log('Rate limit remaining:', response.headers.get('X-RateLimit-Remaining'));
console.log('Rate limit reset:', response.headers.get('X-RateLimit-Reset'));
```

#### PagerDuty Integration Problems

**Symptoms:**
- Incident creation failures
- Invalid service errors
- Authentication issues

**Solutions:**

1. **Validate API Key:**
```bash
# Test API key
curl -X GET "https://api.pagerduty.com/users/me" \
  -H "Accept: application/vnd.pagerduty+json;version=2" \
  -H "Authorization: Token token=YOUR-API-TOKEN"
```

2. **Check Service Configuration:**
```bash
# List available services
curl -X GET "https://api.pagerduty.com/services" \
  -H "Accept: application/vnd.pagerduty+json;version=2" \
  -H "Authorization: Token token=YOUR-API-TOKEN"
```

### 5. Message Processing Issues

#### SNS/EventBridge Problems

**Symptoms:**
- Events not triggering Lambda
- Message deduplication not working
- Processing delays

**Debugging Steps:**

1. **Check EventBridge Rules:**
```bash
# List EventBridge rules
aws events list-rules --name-prefix your-rule-prefix

# Check rule targets
aws events list-targets-by-rule --rule YOUR-RULE-NAME
```

2. **Verify SNS Subscriptions:**
```bash
# List SNS topics
aws sns list-topics

# Check topic subscriptions
aws sns list-subscriptions-by-topic --topic-arn YOUR-TOPIC-ARN
```

3. **Monitor DynamoDB Deduplication:**
```bash
# Check deduplication table
aws dynamodb scan --table-name MessageDeduplicationTable --limit 10

# Monitor table metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedReadCapacityUnits \
  --dimensions Name=TableName,Value=MessageDeduplicationTable \
  --start-time $(date -d '1 hour ago' -u +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

#### Lambda Function Errors

**Symptoms:**
- Function timeouts
- Memory limit exceeded
- Cold start issues

**Solutions:**

1. **Increase Memory/Timeout:**
```typescript
// In CDK configuration
new lambda.Function(this, 'BotFunction', {
  memorySize: 1024, // Increase from default 512MB
  timeout: cdk.Duration.seconds(60), // Increase from default 30s
  reservedConcurrency: 10 // Prevent throttling
});
```

2. **Optimize Code:**
```javascript
// Move initialization outside handler
const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  // Handler code here
};
```

3. **Monitor Performance:**
```bash
# Check function metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=your-function-name \
  --start-time $(date -d '1 hour ago' -u +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average,Maximum
```

## Log Analysis

### CloudWatch Logs

#### Useful Log Queries

```bash
# Find errors in Lambda logs
aws logs filter-log-events \
  --log-group-name /aws/lambda/your-function \
  --filter-pattern "ERROR"

# Search for specific patterns
aws logs filter-log-events \
  --log-group-name /aws/lambda/your-function \
  --filter-pattern "[timestamp, requestId, level=ERROR, message]"

# Get recent function invocations
aws logs filter-log-events \
  --log-group-name /aws/lambda/your-function \
  --start-time $(date -d '30 minutes ago' +%s)000
```

#### Log Insights Queries

```sql
-- Find most common errors
fields @timestamp, @message
| filter @message like /ERROR/
| stats count() by @message
| sort count desc
| limit 10

-- Analyze function performance
fields @timestamp, @duration, @billedDuration, @memorySize, @maxMemoryUsed
| filter @type = "REPORT"
| stats avg(@duration), max(@duration), avg(@maxMemoryUsed) by bin(5m)

-- Track message processing
fields @timestamp, messageId, status
| filter @message like /Processing message/
| stats count() by status
```

### X-Ray Tracing

#### Enable X-Ray Tracing

```typescript
// In CDK Lambda configuration
new lambda.Function(this, 'TracedFunction', {
  tracing: lambda.Tracing.ACTIVE,
  // other configuration
});
```

#### Analyze Traces

```bash
# Get trace summaries
aws xray get-trace-summaries \
  --time-range-type TimeRangeByStartTime \
  --start-time $(date -d '1 hour ago' +%s) \
  --end-time $(date +%s)

# Get specific trace
aws xray batch-get-traces --trace-ids YOUR-TRACE-ID
```

## Performance Optimization

### Lambda Performance

#### Memory Optimization

```javascript
// Monitor memory usage
console.log('Memory used:', process.memoryUsage());

// Optimize object creation
const reusableConfig = {
  timeout: 30000,
  retries: 3
};

// Use connection pooling
const https = require('https');
const agent = new https.Agent({
  keepAlive: true,
  maxSockets: 5
});
```

#### Cold Start Reduction

```typescript
// Provisioned concurrency in CDK
new lambda.Function(this, 'OptimizedFunction', {
  provisionedConcurrencyConfig: {
    provisionedConcurrentExecutions: 5
  }
});

// Initialize outside handler
const AWS = require('aws-sdk');
const clients = {
  dynamodb: new AWS.DynamoDB.DocumentClient(),
  sns: new AWS.SNS()
};

exports.handler = async (event) => {
  // Use pre-initialized clients
};
```

### DynamoDB Performance

#### Optimization Strategies

```typescript
// Batch operations
const batchWrite = {
  RequestItems: {
    'YourTable': [
      { PutRequest: { Item: item1 } },
      { PutRequest: { Item: item2 } }
    ]
  }
};

// Parallel queries
const promises = partitionKeys.map(key => 
  dynamodb.query({
    TableName: 'YourTable',
    KeyConditionExpression: 'partitionKey = :pk',
    ExpressionAttributeValues: { ':pk': key }
  }).promise()
);

const results = await Promise.all(promises);
```

## Monitoring and Alerting

### CloudWatch Alarms

#### Essential Alarms

```typescript
// Error rate alarm
new cloudwatch.Alarm(this, 'ErrorRateAlarm', {
  metric: lambda.Metric.metricAllErrors(),
  threshold: 5,
  evaluationPeriods: 2,
  treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
});

// Duration alarm
new cloudwatch.Alarm(this, 'DurationAlarm', {
  metric: lambdaFunction.metricDuration(),
  threshold: 5000, // 5 seconds
  evaluationPeriods: 3
});

// Throttling alarm
new cloudwatch.Alarm(this, 'ThrottleAlarm', {
  metric: lambdaFunction.metricThrottles(),
  threshold: 1,
  evaluationPeriods: 1
});
```

### Custom Metrics

```javascript
// Publish custom metrics
const cloudwatch = new AWS.CloudWatch();

const publishMetric = async (metricName, value, unit = 'Count') => {
  await cloudwatch.putMetricData({
    Namespace: 'AWSBot',
    MetricData: [{
      MetricName: metricName,
      Value: value,
      Unit: unit,
      Timestamp: new Date()
    }]
  }).promise();
};

// Usage
await publishMetric('MessagesProcessed', 1);
await publishMetric('ProcessingLatency', duration, 'Milliseconds');
```

## Emergency Procedures

### Incident Response

#### 1. Service Outage

```bash
# Quick health check
curl -f https://your-api-gateway-url/health || echo "Service down"

# Check Lambda function status
aws lambda get-function --function-name your-function-name

# Review recent deployments
aws cloudformation describe-stack-events --stack-name YourStackName \
  --query 'StackEvents[?Timestamp>=`2023-01-01T00:00:00`]'
```

#### 2. High Error Rate

```bash
# Check error patterns
aws logs filter-log-events \
  --log-group-name /aws/lambda/your-function \
  --filter-pattern "ERROR" \
  --start-time $(date -d '15 minutes ago' +%s)000

# Scale up if needed
aws lambda put-provisioned-concurrency-config \
  --function-name your-function-name \
  --provisioned-concurrency-config ProvisionedConcurrencyExecutions=20
```

#### 3. Rollback Procedures

```bash
# Rollback CDK stack
cdk deploy --previous-parameters

# Revert to previous Lambda version
aws lambda update-function-configuration \
  --function-name your-function-name \
  --revision-id previous-revision-id

# Emergency disable
aws lambda put-function-configuration \
  --function-name your-function-name \
  --reserved-concurrency 0
```

## Support Resources

### Documentation Links

- [AWS Lambda Troubleshooting](https://docs.aws.amazon.com/lambda/latest/dg/troubleshooting.html)
- [API Gateway Troubleshooting](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-troubleshooting.html)
- [Cognito Troubleshooting](https://docs.aws.amazon.com/cognito/latest/developerguide/troubleshooting.html)
- [CDK Troubleshooting](https://docs.aws.amazon.com/cdk/latest/guide/troubleshooting.html)

### Community Support

- [AWS Developer Forums](https://forums.aws.amazon.com/)
- [Stack Overflow - AWS](https://stackoverflow.com/questions/tagged/amazon-web-services)
- [GitHub Issues](https://github.com/just-ak/AWSBotLambda/issues)

### Professional Support

- AWS Support Cases (if subscribed)
- AWS Professional Services
- AWS Partner Network consultants

For deployment best practices, see the [Deployment Guide](./deployment.md).
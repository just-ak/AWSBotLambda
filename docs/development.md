# 👩‍💻 Development Guide

## Getting Started

This guide covers local development setup, coding standards, testing procedures, and contribution guidelines for the AWS Bot Lambda project.

## Development Environment Setup

### Prerequisites

- **Node.js**: v18.x or later (LTS recommended)
- **Yarn**: v1.22.x or later
- **AWS CLI**: v2.x
- **AWS CDK**: v2.x
- **Docker**: For local testing (optional)
- **Git**: Latest version

### Local Setup

#### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/just-ak/AWSBotLambda.git
cd AWSBotLambda

# Install dependencies
yarn install

# Install workspace dependencies
yarn workspaces run install
```

#### 2. Configure Development Environment

Create a `.env.local` file in the AWS directory:

```bash
# Development-specific overrides
AWS_REGION=us-east-1
NODE_ENV=development
LOG_LEVEL=debug

# Local testing endpoints
LOCAL_ENDPOINT=http://localhost:3000
MOCK_EXTERNAL_APIS=true

# Development credentials (use test accounts)
BOT_ID=test-bot-id
BOT_PASSWORD=test-bot-password
JIRA_BASE_URL=https://test.atlassian.net
```

#### 3. Build Project

```bash
# Build all workspaces
yarn build

# Build specific workspace
cd AWS
yarn build

# Watch mode for development
yarn watch
```

## Project Structure

### Workspace Organization

```
AWSBotLambda/
├── AWS/                          # Main CDK infrastructure
│   ├── lib/                      # CDK constructs
│   │   ├── apiGateway/          # API Gateway configurations
│   │   ├── lambda/              # Lambda function constructs
│   │   ├── s3/                  # S3 bucket configurations
│   │   ├── cognito/             # Authentication setup
│   │   └── ...
│   ├── src/                     # Lambda function source code
│   │   ├── adaptiveBot/         # Main bot logic
│   │   │   ├── lib/             # Core bot functionality
│   │   │   ├── adaptiveCards/   # Card templates
│   │   │   └── adaptiveHTMLPages/
│   │   ├── notifications/       # Message processing
│   │   ├── authorizer/          # API authorization
│   │   └── ...
│   ├── documentation/           # Documentation source
│   │   └── src/                 # HTML documentation
│   ├── documentationAssets/     # Documentation assets
│   └── bin/                     # CDK app entry point
├── docs/                        # Main documentation
└── package.json                 # Root workspace config
```

### Key Directories

#### `/AWS/lib/`
CDK infrastructure constructs that define AWS resources:
- **apiGateway/**: REST API and endpoint configurations
- **lambda/**: Lambda function definitions and configurations
- **s3/**: S3 buckets for documentation and assets
- **cognito/**: Authentication and user management
- **eventBridge/**: Event processing rules

#### `/AWS/src/`
Lambda function source code:
- **adaptiveBot/**: Main bot functionality
- **notifications/**: Event processing and deduplication
- **authorizer/**: Custom API Gateway authorizers

#### `/AWS/src/adaptiveBot/lib/`
Core bot library functions:
- **renderAdaptiveCard.ts**: Card template processing
- **processSNSMessage.ts**: SNS message handling
- **jiraIntegration.ts**: JIRA API integration
- **confluenceIntegration.ts**: Confluence API integration
- **pageDutyIntegration.ts**: PagerDuty API integration

## Coding Standards

### TypeScript Configuration

#### 1. tsconfig.json Settings

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020"],
    "module": "commonjs",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "outDir": "./lib"
  },
  "include": ["src/**/*", "lib/**/*"],
  "exclude": ["node_modules", "lib", "*.js"]
}
```

#### 2. Linting Configuration

ESLint configuration in `eslint.config.mjs`:

```javascript
export default [
  {
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module"
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/explicit-function-return-type": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "prefer-const": "error",
      "no-var": "error"
    }
  }
];
```

### Code Style Guidelines

#### 1. Naming Conventions

```typescript
// Classes: PascalCase
class MessageReducer {
  // Methods: camelCase
  public processMessage(): void {}
  
  // Private methods: camelCase with underscore prefix
  private _validateInput(): boolean {}
}

// Interfaces: PascalCase with 'I' prefix (optional)
interface IBotConfig {
  botId: string;
  endpoint: string;
}

// Constants: SCREAMING_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_TIMEOUT = 30000;

// Environment variables: SCREAMING_SNAKE_CASE
const BOT_ID = process.env.BOT_ID!;
```

#### 2. Function Structure

```typescript
/**
 * Processes an SNS message and sends adaptive card
 * @param message - SNS message containing event data
 * @param context - Lambda context
 * @returns Promise resolving to processing result
 */
export async function processSNSMessage(
  message: SNSEvent,
  context: Context
): Promise<ProcessingResult> {
  // Input validation
  if (!message?.Records?.length) {
    throw new Error('Invalid SNS message format');
  }
  
  // Main processing logic
  const results: ProcessingResult[] = [];
  
  for (const record of message.Records) {
    try {
      const eventData = JSON.parse(record.Sns.Message);
      const card = await renderAdaptiveCard(eventData);
      const result = await sendAdaptiveCard(card);
      
      results.push({
        messageId: record.Sns.MessageId,
        status: 'success',
        result
      });
    } catch (error) {
      console.error(`Failed to process message ${record.Sns.MessageId}:`, error);
      results.push({
        messageId: record.Sns.MessageId,
        status: 'error',
        error: error.message
      });
    }
  }
  
  return {
    processed: results.length,
    successful: results.filter(r => r.status === 'success').length,
    failed: results.filter(r => r.status === 'error').length,
    results
  };
}
```

#### 3. Error Handling

```typescript
// Custom error classes
export class BotConfigurationError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'BotConfigurationError';
  }
}

// Error handling with context
const handleError = (error: Error, context: string): void => {
  console.error(`Error in ${context}:`, {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
  
  // Report to monitoring service
  reportError(error, context);
};

// Async error handling
const safeExecute = async <T>(
  operation: () => Promise<T>,
  fallback: T,
  context: string
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    handleError(error, context);
    return fallback;
  }
};
```

## Testing

### Test Structure

#### 1. Unit Tests

```typescript
// tests/unit/renderAdaptiveCard.test.ts
import { renderAdaptiveCard } from '../../src/adaptiveBot/lib/renderAdaptiveCard';

describe('renderAdaptiveCard', () => {
  it('should render notification card with event data', async () => {
    // Arrange
    const eventData = {
      eventType: 'EC2 Instance State Change',
      source: 'aws.ec2',
      detail: {
        'instance-id': 'i-1234567890abcdef0',
        state: 'running'
      }
    };
    
    // Act
    const result = await renderAdaptiveCard(eventData);
    
    // Assert
    expect(result).toBeDefined();
    expect(result.type).toBe('AdaptiveCard');
    expect(result.body).toContainEqual(
      expect.objectContaining({
        type: 'TextBlock',
        text: expect.stringContaining('EC2 Instance State Change')
      })
    );
  });
  
  it('should handle missing event data gracefully', async () => {
    // Arrange
    const eventData = {};
    
    // Act & Assert
    await expect(renderAdaptiveCard(eventData)).rejects.toThrow('Invalid event data');
  });
});
```

#### 2. Integration Tests

```typescript
// tests/integration/jiraIntegration.test.ts
import { createJiraIssue } from '../../src/adaptiveBot/lib/jiraIntegration';

describe('JIRA Integration', () => {
  beforeAll(() => {
    // Setup test environment
    process.env.JIRA_BASE_URL = 'https://test.atlassian.net';
    process.env.JIRA_API_TOKEN = 'test-token';
  });
  
  it('should create JIRA issue successfully', async () => {
    // Mock HTTP calls
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        id: '12345',
        key: 'TEST-123',
        self: 'https://test.atlassian.net/rest/api/2/issue/12345'
      })
    });
    
    global.fetch = mockFetch;
    
    // Test
    const issueData = {
      project: 'TEST',
      issueType: 'Bug',
      summary: 'Test issue'
    };
    
    const result = await createJiraIssue(issueData);
    
    expect(result.key).toBe('TEST-123');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/rest/api/2/issue'),
      expect.objectContaining({
        method: 'POST'
      })
    );
  });
});
```

#### 3. End-to-End Tests

```typescript
// tests/e2e/botWorkflow.test.ts
import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from '../../src/adaptiveBot/adaptiveBot';

describe('Bot E2E Workflow', () => {
  it('should process Teams message and respond with card', async () => {
    // Arrange
    const teamsMessage: APIGatewayProxyEvent = {
      httpMethod: 'POST',
      body: JSON.stringify({
        type: 'message',
        text: 'hello',
        from: { id: 'user-123', name: 'Test User' },
        conversation: { id: 'conv-123' }
      }),
      headers: { 'Content-Type': 'application/json' },
      // ... other required fields
    };
    
    // Act
    const response = await handler(teamsMessage, {} as any);
    
    // Assert
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.type).toBe('message');
    expect(body.attachments).toBeDefined();
  });
});
```

### Running Tests

```bash
# Run all tests
yarn test

# Run with coverage
yarn test --coverage

# Run specific test file
yarn test src/adaptiveBot/lib/renderAdaptiveCard.test.ts

# Run tests in watch mode
yarn test --watch

# Run only unit tests
yarn test:unit

# Run only integration tests
yarn test:integration
```

### Test Configuration

#### jest.config.js

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
};
```

## Local Development

### Mock Services

#### 1. Mock External APIs

```typescript
// tests/mocks/jiraMock.ts
export const mockJiraAPI = {
  createIssue: jest.fn().mockResolvedValue({
    id: 'mock-123',
    key: 'MOCK-123',
    self: 'https://mock.atlassian.net/rest/api/2/issue/mock-123'
  }),
  
  searchIssues: jest.fn().mockResolvedValue({
    issues: [],
    total: 0
  })
};

// Use in tests
jest.mock('../../src/adaptiveBot/lib/jiraIntegration', () => mockJiraAPI);
```

#### 2. Local Event Simulation

```typescript
// scripts/simulateEvent.ts
import { EventBridgeEvent } from 'aws-lambda';

const simulateEC2Event = (): EventBridgeEvent<string, any> => ({
  version: '0',
  id: 'test-event-id',
  'detail-type': 'EC2 Instance State-change Notification',
  source: 'aws.ec2',
  account: '123456789012',
  time: new Date().toISOString(),
  region: 'us-east-1',
  detail: {
    'instance-id': 'i-1234567890abcdef0',
    state: 'running',
    'previous-state': 'stopped'
  },
  resources: []
});

// Simulate local processing
const testEvent = simulateEC2Event();
console.log('Simulating event:', JSON.stringify(testEvent, null, 2));
```

### Local Testing Tools

#### 1. SAM Local (Optional)

```yaml
# template.yaml for SAM local testing
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Resources:
  AdaptiveBotFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: src/adaptiveBot/
      Handler: adaptiveBot.handler
      Runtime: nodejs18.x
      Environment:
        Variables:
          BOT_ID: test-bot-id
          NODE_ENV: development
```

```bash
# Start local API
sam local start-api

# Invoke function locally
sam local invoke AdaptiveBotFunction -e tests/events/teams-message.json
```

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'yarn'
      
      - name: Install dependencies
        run: yarn install --frozen-lockfile
      
      - name: Lint code
        run: yarn lint
      
      - name: Run tests
        run: yarn test --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
  
  build:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'yarn'
      
      - name: Install dependencies
        run: yarn install --frozen-lockfile
      
      - name: Build project
        run: yarn build
      
      - name: CDK Synth
        run: |
          cd AWS
          yarn cdk synth
```

### Pre-commit Hooks

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "jira-prepare-commit-msg"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "git add"
    ],
    "*.{json,md}": [
      "prettier --write",
      "git add"
    ]
  }
}
```

## Debugging

### Local Debugging

#### 1. VS Code Configuration

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Lambda Function",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/AWS/src/adaptiveBot/adaptiveBot.ts",
      "outFiles": ["${workspaceFolder}/AWS/lib/**/*.js"],
      "env": {
        "NODE_ENV": "development",
        "BOT_ID": "test-bot-id"
      },
      "runtimeArgs": ["-r", "ts-node/register"],
      "args": ["--inspect"]
    }
  ]
}
```

#### 2. Debug Environment Variables

```bash
# .env.debug
NODE_ENV=development
LOG_LEVEL=debug
AWS_SAM_LOCAL=true
MOCK_EXTERNAL_APIS=true
```

### Production Debugging

#### 1. CloudWatch Logs

```typescript
// Enhanced logging for production
const logger = {
  debug: (message: string, context?: any) => {
    if (process.env.LOG_LEVEL === 'debug') {
      console.log(JSON.stringify({
        level: 'DEBUG',
        message,
        context,
        timestamp: new Date().toISOString()
      }));
    }
  },
  
  error: (message: string, error?: Error, context?: any) => {
    console.error(JSON.stringify({
      level: 'ERROR',
      message,
      error: error?.message,
      stack: error?.stack,
      context,
      timestamp: new Date().toISOString()
    }));
  }
};
```

#### 2. X-Ray Tracing

```typescript
import AWSXRay from 'aws-xray-sdk-core';

// Instrument AWS SDK
const AWS = AWSXRay.captureAWS(require('aws-sdk'));

// Create subsegments for external calls
const segment = AWSXRay.getSegment();
const subsegment = segment?.addNewSubsegment('jira-api-call');

try {
  const result = await fetch(jiraUrl);
  subsegment?.close();
  return result;
} catch (error) {
  subsegment?.addError(error);
  subsegment?.close();
  throw error;
}
```

## Contributing

### Contribution Guidelines

1. **Fork the Repository**: Create your own fork
2. **Create Feature Branch**: `git checkout -b feature/amazing-feature`
3. **Write Tests**: Ensure new code has appropriate test coverage
4. **Follow Code Style**: Use ESLint and Prettier
5. **Update Documentation**: Update relevant documentation
6. **Create Pull Request**: Submit PR with clear description

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings
```

### Code Review Process

1. **Automated Checks**: CI pipeline must pass
2. **Peer Review**: At least one approval required
3. **Security Review**: For authentication/security changes
4. **Documentation Review**: For public API changes

For deployment procedures, see the [Deployment Guide](./deployment.md).
# AWS Bot Lambda Infrastructure Diagram

The diagram below represents the infrastructure components and their relationships deployed by the CDK stack.

```mermaid
graph TD
    %% Define components
    EventBridge[EventBridge Rules]
    SNS[SNS Topic\nawsNotificationsTopic]
    MsgReducerLambda[Message Reducer Lambda]
    MsgTable[DynamoDB\nMessageDeduplicationTable]
    ConversationsTable[DynamoDB\nHealthEventConversations]
    BotLambda[Adaptive Bot Lambda]
    ApiGw[API Gateway]
    Route53[Route53 Endpoint]
    DocBucket[S3\nDocumentation Bucket]
    User((User))

    %% Define relationships
    EventBridge -->|triggers| MsgReducerLambda
    MsgReducerLambda -->|writes to| MsgTable
    MsgReducerLambda -->|publishes to| SNS
    
    SNS -->|triggers| BotLambda
    BotLambda -->|reads/writes| ConversationsTable
    
    ApiGw -->|routes POST requests to| BotLambda
    Route53 -->|routes to| ApiGw
    
    DocBucket -->|hosted through| ApiGw
    User -->|accesses| ApiGw
    User -->|views docs at /docs| DocBucket
    
    %% Add styling
    classDef aws fill:#FF9900,stroke:#232F3E,color:white,stroke-width:2px;
    classDef user fill:#4CAF50,stroke:#2E7D32,color:white,stroke-width:2px;
    class EventBridge,SNS,MsgReducerLambda,MsgTable,ConversationsTable,BotLambda,ApiGw,Route53,DocBucket aws;
    class User user;
```

## Component Details

- **EventBridge Rules**: Trigger the MessageReducer lambda based on configured AWS service events
- **SNS Topic**: Central messaging service for health notifications with the name "awsNotificationsTopic"
- **DynamoDB Tables**:
  - **MessageDeduplicationTable**: Stores message IDs and timestamps to prevent duplicate processing
  - **HealthEventConversations**: Maintains conversation state for health events
- **Lambda Functions**:
  - **MessageReducer**: Processes incoming events, applies field removal rules, and deduplicates before publishing to SNS
  - **AdaptiveBot**: Processes notifications and manages conversations with the messaging platform
- **API Gateway**: Provides HTTP endpoints for both the bot and documentation access
- **Route53**: DNS configuration for the API Gateway
- **S3 Bucket**: Stores documentation assets accessible via the API Gateway's "/docs" endpoint

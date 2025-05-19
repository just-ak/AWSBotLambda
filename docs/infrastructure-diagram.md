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

    %% Define relationships
    EventBridge -->|triggers| MsgReducerLambda
    MsgReducerLambda -->|writes to| MsgTable
    MsgReducerLambda -->|publishes to| SNS
    
    SNS -->|triggers| BotLambda
    BotLambda -->|reads/writes| ConversationsTable
    
    ApiGw -->|routes POST requests to| BotLambda
    Route53 -->|routes to| ApiGw
    
    DocBucket -.->|accessed through| ApiGw
    
    %% Add styling
    classDef aws fill:#FF9900,stroke:#232F3E,color:white,stroke-width:2px;
    class EventBridge,SNS,MsgReducerLambda,MsgTable,ConversationsTable,BotLambda,ApiGw,Route53,DocBucket aws;
```

## Component Details

- **SNS Topic**: Central messaging service for notifications
- **DynamoDB Tables**:
  - MessageDeduplicationTable: Stores message IDs to prevent duplicate processing
  - HealthEventConversations: Maintains conversation state for health events
- **Lambda Functions**:
  - MessageReducer: Processes incoming events and reduces duplicates before publishing
  - AdaptiveBot: Processes notifications and manages conversations
- **EventBridge Rules**: Trigger the MessageReducer lambda based on configured events
- **API Gateway**: Provides HTTP endpoints for the bot and documentation
- **Route53**: DNS configuration for the API Gateway
- **S3 Bucket**: Stores documentation assets with access controlled through API Gateway
```

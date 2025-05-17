import { Construct } from 'constructs';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { RemovalPolicy } from 'aws-cdk-lib';

export interface HealthEventConversationsProps {
}

export class HealthEventConversations extends Construct {
  readonly table: Table;

  constructor(scope: Construct, id: string, props: HealthEventConversationsProps) {
    super(scope, id);

    this.table = new Table(this, 'HealthEventConversationsTable', {
          partitionKey: {
            name: 'conversationId',
            type: AttributeType.STRING,
          },
          sortKey: {
            name: 'userId',
            type: AttributeType.STRING,
          },
          tableName: 'HealthEventConversations',  // Optional, name the table if required
          billingMode: BillingMode.PAY_PER_REQUEST,  // On-demand billing, suitable for unknown traffic patterns
          removalPolicy: RemovalPolicy.DESTROY, // Automatically delete the table if stack is deleted (use carefully in production)
        });
    
  }
}
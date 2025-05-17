import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Duration } from 'aws-cdk-lib';
import { Runtime, Tracing } from 'aws-cdk-lib/aws-lambda';
import * as dotenv from 'dotenv';
dotenv.config();

export interface AuthorizerProps {
}

const BOT_ID = process.env.BOT_ID || 'default_bot_id';
const BOT_TENANT_ID = process.env.BOT_TENANT_ID || 'default_bot_tenant_id';

export class Authorizer extends Construct {
    readonly lambda: NodejsFunction;

    constructor(scope: Construct, id: string, props: AuthorizerProps) {
        super(scope, id);

        this.lambda = new NodejsFunction(this, 'authorizerFunction', {
            functionName: 'api-bearer-token-authorizer',
            entry: './src/authorizer/authorizer.ts',
            memorySize: 128,
            timeout: Duration.seconds(10),
            runtime: Runtime.NODEJS_20_X,
            handler: 'handler',
            environment: {
                // Store token in secure parameter (consider using AWS Secrets Manager in production)
                BOT_APP_ID: BOT_ID, // You should use a different dedicated token for the API
                BOT_TENANT_ID: BOT_TENANT_ID,
            },
            tracing: Tracing.ACTIVE,
        });
    }
}
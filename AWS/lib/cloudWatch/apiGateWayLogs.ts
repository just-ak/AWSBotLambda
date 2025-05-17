import { Construct } from 'constructs';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';

export interface ApiGateWayLogsProps {
}

export class ApiGateWayLogs extends Construct {
    readonly logGroup: LogGroup;

    constructor(scope: Construct, id: string, props: ApiGateWayLogsProps) {
        super(scope, id);

        this.logGroup = new LogGroup(this, 'ApiGatewayAccessLogs', {
            retention: RetentionDays.ONE_DAY,
        });
    }
}
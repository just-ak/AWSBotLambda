
import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';

export interface CrssRefionSsmParamterProps {
    parameterName: string;
    parameterValue: string;
    region: string;
    type?: string;
}

export class CrossRegionSsmParameter extends Construct {
    public readonly customResource: AwsCustomResource;

    constructor(scope: Construct, id: string, props: CrssRefionSsmParamterProps) {
        super(scope, id);

        const parameterType = props.type || 'String';

        this.customResource = new AwsCustomResource(this, `CossRegionParameter`, {
            onCreate: {
                service: 'SSM',
                action: 'putParameter',
                parameters: {
                    Name: props.parameterName,
                    Value: props.parameterValue,
                    Type: parameterType,
                    Overwrite: true,
                },
                region: props.region,
                physicalResourceId: PhysicalResourceId.of(props.parameterName),
            },
            onUpdate: {
                service: 'SSM',
                action: 'putParameter',
                parameters: {
                    Name: props.parameterName,
                    Value: props.parameterValue,
                    Type: parameterType,
                    Overwrite: true,
                },
                region: props.region,
                physicalResourceId: PhysicalResourceId.of(props.parameterName),
            },
            onDelete: {
                service: 'SSM',
                action: 'deleteParameter',
                parameters: {
                    Name: props.parameterName,
                },
                region: props.region,
            },
            policy: AwsCustomResourcePolicy.fromSdkCalls({
                resources: AwsCustomResourcePolicy.ANY_RESOURCE,
            }),
        });
    }
}
import { EndpointType, RestApi, SecurityPolicy } from 'aws-cdk-lib/aws-apigateway';
import { Certificate, CertificateValidation } from 'aws-cdk-lib/aws-certificatemanager';
import { HostedZone, ARecord, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { ApiGatewayDomain } from 'aws-cdk-lib/aws-route53-targets';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';
import { Distribution } from 'aws-cdk-lib/aws-cloudfront';
import { Construct } from 'constructs';
import * as dotenv from 'dotenv';
dotenv.config();
const AWS_HOSTED_ZONE_ID = process.env.AWS_HOSTED_ZONE_ID || 'default_hosted_zone_id';
const AWS_HOSTED_ZONE_NAME = process.env.AWS_HOSTED_ZONE_NAME || 'default_hosted_zone_name';
const AWS_API_ENDPOINT_NAME = process.env.AWS_API_ENDPOINT_NAME || 'default_cert_domain';
const AWS_CLOUDFRONT_SUBDOMAIN = process.env.AWS_CLOUDFRONT_SUBDOMAIN || 'www';

export interface Route53EndPointProps {
    cloudFrontDistribution: Distribution;
}

export class Route53EndPoint extends Construct {
    public readonly certificate: Certificate;
    constructor(scope: Construct, id: string, props: Route53EndPointProps) {
        super(scope, id);

        const hostedZoneId = AWS_HOSTED_ZONE_ID;

        new ARecord(this, 'CloudFrontAliasRecord', {
            zone: HostedZone.fromHostedZoneAttributes(this, 'HostedZoneCf', {
                hostedZoneId: hostedZoneId,
                zoneName: AWS_HOSTED_ZONE_NAME,
            }),
            recordName: 'api2', //AWS_API_ENDPOINT_NAME, // Use 'www' or custom subdomain for CloudFront
            target: RecordTarget.fromAlias(new CloudFrontTarget(props.cloudFrontDistribution)),
        });


    }
}

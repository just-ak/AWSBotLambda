import { EndpointType, RestApi, SecurityPolicy } from 'aws-cdk-lib/aws-apigateway';
import { Certificate, CertificateValidation } from 'aws-cdk-lib/aws-certificatemanager';
import { HostedZone, ARecord, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { ApiGatewayDomain } from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';
import * as dotenv from 'dotenv';
dotenv.config();
const AWS_HOSTED_ZONE_ID = process.env.AWS_HOSTED_ZONE_ID || 'default_hosted_zone_id';
const AWS_HOSTED_ZONE_NAME = process.env.AWS_HOSTED_ZONE_NAME || 'default_hosted_zone_name';
const AWS_API_ENDPOINT_NAME = process.env.AWS_API_ENDPOINT_NAME || 'default_cert_domain';

export interface Route53EndPointProps {
    api: RestApi;
}

export class Route53EndPoint extends Construct {

    constructor(scope: Construct, id: string, props: Route53EndPointProps) {
        super(scope, id);



        const hostedZoneId = AWS_HOSTED_ZONE_ID; // Replace with your hosted zone ID
        const hostedZone = HostedZone.fromHostedZoneId(this, 'HostedZone', hostedZoneId);
        const newCert = new Certificate(this, 'Certificate', {
            domainName: `${AWS_API_ENDPOINT_NAME}.${AWS_HOSTED_ZONE_NAME}`,
            validation: CertificateValidation.fromDns(hostedZone),

        });
        const domainName = props.api.addDomainName('CustomDomainA', {
            domainName: `${AWS_API_ENDPOINT_NAME}.${AWS_HOSTED_ZONE_NAME}`,
            certificate: newCert,
            endpointType: EndpointType.REGIONAL,
            securityPolicy: SecurityPolicy.TLS_1_2,
        });


        // // Map the custom domain to the API stage
        // domainName.addBasePathMapping(api, {
        //   basePath: '', // Root path
        //   stage: api.deploymentStage,
        // });

        // // Add Route 53 alias record for the custom domain
        new ARecord(this, 'CustomDomainAliasRecord', {
            zone: HostedZone.fromHostedZoneAttributes(this, 'HostedZoneAtr', {
                hostedZoneId: hostedZoneId,
                zoneName: AWS_HOSTED_ZONE_NAME,
            }),
            recordName: AWS_API_ENDPOINT_NAME, // Subdomain
            target: RecordTarget.fromAlias(new ApiGatewayDomain(domainName)),
        });
    }
}

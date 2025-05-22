import { EndpointType, RestApi, SecurityPolicy } from 'aws-cdk-lib/aws-apigateway';
import { Certificate, CertificateValidation } from 'aws-cdk-lib/aws-certificatemanager';
import { HostedZone, ARecord, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { ApiGatewayDomain } from 'aws-cdk-lib/aws-route53-targets';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';
import { Distribution } from 'aws-cdk-lib/aws-cloudfront';
import { Construct } from 'constructs';
import * as dotenv from 'dotenv';
import { CrossRegionSsmParameter } from '../ssm/crossRegion';
dotenv.config();
const AWS_HOSTED_ZONE_ID = process.env.AWS_HOSTED_ZONE_ID || 'default_hosted_zone_id';
const AWS_HOSTED_ZONE_NAME = process.env.AWS_HOSTED_ZONE_NAME || 'default_hosted_zone_name';
const AWS_API_ENDPOINT_NAME = process.env.AWS_API_ENDPOINT_NAME || 'default_cert_domain';
const AWS_CLOUDFRONT_SUBDOMAIN = process.env.AWS_CLOUDFRONT_SUBDOMAIN || 'www';

export interface SslCertificatesProps {

}

export class SslCertificates extends Construct {
    public readonly certificate: Certificate;
    public readonly crossRegionSsmParameter: CrossRegionSsmParameter;
    constructor(scope: Construct, id: string, props: SslCertificatesProps) {
        super(scope, id);

        const hostedZoneId = AWS_HOSTED_ZONE_ID;
        const hostedZone = HostedZone.fromHostedZoneId(this, 'HostedZone', hostedZoneId);
        this.certificate = new Certificate(this, 'Certificate', {
            domainName: AWS_HOSTED_ZONE_NAME, //`${AWS_API_ENDPOINT_NAME}.${AWS_HOSTED_ZONE_NAME}`,
            validation: CertificateValidation.fromDns(hostedZone),
             subjectAlternativeNames: [
            // Add a wildcard domain as a SAN
            `*.${AWS_HOSTED_ZONE_NAME}`,
            // You can also add other SANs as needed:
            // `api2.${AWS_API_ENDPOINT_NAME}.${AWS_HOSTED_ZONE_NAME}`,
            // `www.${AWS_API_ENDPOINT_NAME}.${AWS_HOSTED_ZONE_NAME}`,
        ],
        });

       this.crossRegionSsmParameter =  new CrossRegionSsmParameter(this, 'CrossRegionSsmParameter', {
            parameterName: '/certificates/cloudfront/sslCertificateArn',
            parameterValue: this.certificate.certificateArn,
            region: 'eu-west-2'});
       
    
    
    // // Create the certificate
    // this.certificate = new acm.Certificate(this, 'Certificate', {
    //     domainName: AWS_HOSTED_ZONE_NAME,
       
    //     validation: acm.CertificateValidation.fromDns(), // Using DNS validation
    // });

    // // Store the certificate ARN in SSM Parameter Store for cross-region access
    // this.certificateArnParameterName = `/certificates/${AWS_HOSTED_ZONE_NAME}/arn`;
    // new ssm.StringParameter(this, 'CertificateArnParam', {
    //   parameterName: this.certificateArnParameterName,
    //   stringValue: this.certificate.certificateArn,
    //   description: 'ARN of the ACM certificate for CloudFront',
    //   tier: ssm.ParameterTier.STANDARD,
    // });
    
        }


}

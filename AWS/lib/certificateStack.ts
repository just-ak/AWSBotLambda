import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as ssm from 'aws-cdk-lib/aws-ssm';

import * as dotenv from 'dotenv';
import { SslCertificates } from './certificates/sslCertificates';
dotenv.config();
const AWS_HOSTED_ZONE_NAME = process.env.AWS_HOSTED_ZONE_NAME || 'default_hosted_zone_name';
const AWS_API_ENDPOINT_NAME = process.env.AWS_API_ENDPOINT_NAME || 'default_cert_domain';


export interface CertificateStackProps extends cdk.StackProps {

}

export class CertificateStack extends cdk.Stack {
  public readonly certificate: acm.Certificate;
  public readonly certificateArnParameterName: string;

  constructor(scope: Construct, id: string, props: CertificateStackProps) {
    // Ensure the certificate is created in us-east-1
    super(scope, id, {
      ...props,
      env: { region: 'us-east-1' }, // Force us-east-1 region for CloudFront certificates
    });

    new SslCertificates(this, 'SslCertificates', {
    });
  }
}

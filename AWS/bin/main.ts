import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { Notifications } from '../lib/Notifications';
import { CertificateStack } from '../lib/certificate-stack';

export const app = new App();

 const mainStack = new Notifications(app, `ops-Notifications`,{
    env: { region: 'eu-west-2' },
 });

const certStack = new CertificateStack(app, 'ops-certificates', {
   env: { region: 'us-east-1' }, // Must be us-east-1 for CloudFront
 });
 
 // Add dependencies if necessary
// mainStack.addDependency(certStack);

app.synth();

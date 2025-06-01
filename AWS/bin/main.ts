import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { Notifications } from '../lib/Notifications';
import { CertificateStack } from '../lib/certificateStack';
import { EdgeLambdaStack } from '../lib/edgeLambdaStack';
import { TempSSMParameterStack } from '../lib/tempSSMParameter';

export const app = new App();

// Create certificate stack in us-east-1 (required for CloudFront)
const certStack = new CertificateStack(app, 'ops-certificates', {
   env: { region: 'us-east-1' }
});

// Create the edge lambda stack in us-east-1 (required for Lambda@Edge)
const edgeLambda = new EdgeLambdaStack(app, 'ops-edge-lambdas', {
   env: { region: 'us-east-1' }
});

// Create SSM parameter stack for cross-region parameter access
const tempSSMParameterStack = new TempSSMParameterStack(app, 'ops-temp-ssm', {
   env: { region: 'us-east-1' }
});

// Create the main application stack last, after dependencies are created
const mainStack = new Notifications(app, `ops-Notifications`,{
    env: { region: 'eu-west-2' },
});

// Add explicit dependencies to ensure proper deployment order
// mainStack.addDependency(certStack);
// mainStack.addDependency(edgeLambda);


app.synth();

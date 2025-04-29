import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { Notifications } from '../lib/Notifications';

export const app = new App();

 new Notifications(app, `ops-Notifications`,{
    env: { region: 'eu-west-2' },
 }),

app.synth();

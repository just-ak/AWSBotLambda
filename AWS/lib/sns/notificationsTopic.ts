import { Construct } from 'constructs';
import { Topic } from 'aws-cdk-lib/aws-sns';

export interface NotificationsTopicProps {
  displayName: string;
}

export class NotificationsTopic extends Construct {
  readonly topic: Topic;

  constructor(scope: Construct, id: string, props: NotificationsTopicProps) {
    super(scope, id);

    this.topic = new Topic(this, `SNSTopic${props.displayName.toLocaleLowerCase()}`, {
      displayName: props.displayName || 'awsNotificationsTopic',
    });
  }
}
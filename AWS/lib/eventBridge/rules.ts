import { Construct } from 'constructs';
import { IFunction } from 'aws-cdk-lib/aws-lambda';
import { Rule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';

export interface EventBridgeRulesProps {
    targetLambda: IFunction;
}

   interface RuleConfig {
      source: string[];
      detailType?: string[];
      detail?: {
        'status-details': {
          status: string[];
        };
      };
    }


export class EventBridgeRules extends Construct {
//   readonly rules: Topic;

  constructor(scope: Construct, id: string, props: EventBridgeRulesProps) {
    super(scope, id);

    
        const rules: RuleConfig[] = [
          // {
          //   source: ['aws.chatbot'],
          // },
          {
            source: ['aws.trustedadvisor'],
            detailType: ['Trusted Advisor Pursuit Daily Digest'],
          },
          {
            source: ['aws.ssm'],
            detailType: ['Parameter Store Change', 'Parameter Store Policy Action'],
          },
          // {
          //   source: ['aws.iam'],
          // },
          // {
          //   source: ['aws.health'],
          // },
          // {
          //   source: ['aws.support'],
          // },
          // {
          //   source: ['aws.budgets'],
          // },
          // {
          //   source: ['aws.cloudformation'],
          //   detailType: ['CloudFormation Stack Status Change'],
          //   detail: {
          //     'status-details': {
          //       status: [
          //         'FAILED',
          //         'ROLLBACK_FAILED',
          //         'ROLLBACK_COMPLETE',
          //         'DELETE_FAILED',
          //         'UPDATE_ROLLBACK_FAILED',
          //         'UPDATE_ROLLBACK_COMPLETE',
          //         'CREATE_FAILED',
          //         'UPDATE_FAILED',
          //       ],
          //     },
          //   },
          // },
          // {
          //   source: ['aws.quotas'], // TestMe
          // },
          // {
          //   source: ['aws.codepipeline'], // TestMe
          // },
        ];
        rules.map((rule) => {
          new Rule(this, `${rule.source.join().replace('.', '_').replace(',', '_')}`, {
            eventPattern: rule,
            targets: [new LambdaFunction(props.targetLambda)],
          });
        });
  }
}
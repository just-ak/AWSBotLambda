import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';

export interface DocsEndpointProps {
  /**
   * The RestApi to add the docs endpoint to
   */
  api: apigateway.RestApi;
  
  /**
   * The S3 bucket containing the documentation
   */
  bucket: s3.IBucket;
  
  /**
   * Optional IAM role that API Gateway can use to access S3
   * If not provided, a new role will be created
   */
  accessRole?: iam.IRole;
}

export class DocsEndpoint extends Construct {
  constructor(scope: Construct, id: string, props: DocsEndpointProps) {
    super(scope, id);
    
    // Create or use the provided role for S3 access
    const role = props.accessRole || new iam.Role(this, 'ApiGatewayS3Role', {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
    });
    
    // If we created a new role, grant read access to the bucket
    if (!props.accessRole) {
      props.bucket.grantRead(role);
    }
    
    // Create the /docs resource
    const docsResource = props.api.root.addResource('docs');
    
    // Add the index.html handler for the /docs endpoint
    this.addS3Integration(
      docsResource, 
      'GET', 
      props.bucket, 
      'index.html', 
      role
    );
    
    // Add a proxy resource to handle all files under /docs/*
    const proxyResource = docsResource.addResource('{proxy+}');
    
    // Add the proxy handler for all other document files
    this.addS3ProxyIntegration(
      proxyResource, 
      'GET', 
      props.bucket, 
      role
    );
  }
  
  /**
   * Adds an S3 integration for a specific file
   */
  private addS3Integration(
    resource: apigateway.IResource, 
    method: string, 
    bucket: s3.IBucket, 
    key: string, 
    role: iam.IRole
  ): apigateway.Method {
    const s3Integration = new apigateway.AwsIntegration({
      service: 's3',
      integrationHttpMethod: 'GET',
      path: `${bucket.bucketName}/${key}`,
      options: {
        credentialsRole: role,
        integrationResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Content-Type': 'integration.response.header.Content-Type',
            },
          },
          {
            statusCode: '404',
            selectionPattern: '404',
            responseTemplates: {
              'application/json': JSON.stringify({ message: 'Document not found' }),
            },
          },
        ],
      },
    });
    
    return resource.addMethod(method, s3Integration, {
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Content-Type': true,
          },
        },
        { statusCode: '404' },
      ],
      apiKeyRequired: false,
    });
  }
  
  /**
   * Adds an S3 proxy integration for dynamic file paths
   */
  private addS3ProxyIntegration(
    resource: apigateway.IResource, 
    method: string, 
    bucket: s3.IBucket, 
    role: iam.IRole
  ): apigateway.Method {
    const s3ProxyIntegration = new apigateway.AwsIntegration({
      service: 's3',
      integrationHttpMethod: 'GET',
      path: `${bucket.bucketName}/{key}`,
      options: {
        credentialsRole: role,
        requestParameters: {
          'integration.request.path.key': 'method.request.path.proxy',
        },
        integrationResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Content-Type': 'integration.response.header.Content-Type',
            },
          },
          {
            statusCode: '404',
            selectionPattern: '404',
            responseTemplates: {
              'application/json': JSON.stringify({ message: 'Document not found' }),
            },
          },
        ],
      },
    });
    
    return resource.addMethod(method, s3ProxyIntegration, {
      requestParameters: {
        'method.request.path.proxy': true,
      },
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Content-Type': true,
          },
        },
        { statusCode: '404' },
      ],
      apiKeyRequired: false,
    });
  }
}

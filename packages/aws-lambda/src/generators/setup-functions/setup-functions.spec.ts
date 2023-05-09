import { readProjectConfiguration, Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { applicationGenerator } from '@nx/node';
import { setupFunctionsGenerator } from './setup-functions';

describe('AWS Lambda Setup Functions Generator', () => {
  let tree: Tree;

  beforeEach(() => (tree = createTreeWithEmptyWorkspace()));

  it('should create add aws lambda configurations', async () => {
    const projectName = 'awslambda';
    await applicationGenerator(tree, {
      name: projectName,
      framework: 'none',
      e2eTestRunner: 'none',
      rootProject: true,
      docker: false,
    });

    await setupFunctionsGenerator(tree, {
      name: projectName,
    });

    const projectConfig = readProjectConfiguration(tree, projectName);
    expect(tree.exists('samconfig.toml'));
    expect(tree.exists('template.yaml'));
    expect(projectConfig.targets).toEqual(
      expect.objectContaining({
        'serve-functions': {
          command: 'sam build && sam local start-api',
        },
        'deploy-functions': {
          command: 'sam build && sam deploy --guided',
        },
      })
    );
  });

  it('should append to existing template.yaml file and respect existing samconfig.toml file', async () => {
    const projectName = 'awslambda';
    await applicationGenerator(tree, {
      name: projectName,
      framework: 'none',
      e2eTestRunner: 'none',
      rootProject: true,
      docker: false,
    });
    tree.write('template.yaml', '# existing template\n');
    tree.write('samconfig.toml', '# existing samconfig\n');

    await setupFunctionsGenerator(tree, {
      name: projectName,
    });

    const templateYaml = tree.read('template.yaml', 'utf-8');
    const samConfigToml = tree.read('samconfig.toml', 'utf-8');

    expect(templateYaml).toEqual(`# existing template\n

# More info about Globals: https://github.com/awslabs/serverless-application-model/blob/master/docs/globals.rst
Globals:
  Function:
    Timeout: 3

Resources:
  HelloWorldFunction:
    Type: AWS::Serverless::Function # More info about Function Resource: https://github.com/awslabs/serverless-application-model/blob/master/versions/2016-10-31.md#awsserverlessfunction
    Properties:
      CodeUri: functions/hello-world
      Handler: app.lambdaHandler
      Runtime: nodejs18.x
      Architectures:
        - x86_64
      Events:
        HelloWorld:
          Type: Api # More info about API Event Source: https://github.com/awslabs/serverless-application-model/blob/master/versions/2016-10-31.md#api
          Properties:
            Path: /hello
            Method: get
    Metadata: # Manage esbuild properties
      BuildMethod: esbuild
      BuildProperties:
        Minify: true
        Target: "es2020"
        Sourcemap: false
        EntryPoints:
        - app.ts

Outputs:
  # ServerlessRestApi is an implicit API created out of Events key under Serverless::Function
  # Find out more about other implicit resources you can reference within SAM
  # https://github.com/awslabs/serverless-application-model/blob/master/docs/internals/generated_resources.rst#api
  HelloWorldApi:
    Description: "API Gateway endpoint URL for Prod stage for Hello World function"
    Value: !Sub "https://\${ServerlessRestApi}.execute-api.\${AWS::Region}.amazonaws.com/Prod/hello/"
  HelloWorldFunction:
    Description: "Hello World Lambda Function ARN"
    Value: !GetAtt HelloWorldFunction.Arn
  HelloWorldFunctionIamRole:
    Description: "Implicit IAM Role created for Hello World function"
    Value: !GetAtt HelloWorldFunctionRole.Arn
`);
    expect(samConfigToml).toEqual('# existing samconfig\n');
  });
});

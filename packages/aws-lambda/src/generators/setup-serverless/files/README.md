<p style="text-align: center;"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx.png" width="600" alt="Nx - Smart, Fast and Extensible Build System"></p>

## Note
Before trying to run `nx run dev` or `nx run deploy` you must have: 
- [SAM](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html#install-sam-cli-instructions) installed which is different as per your OS
- esbuild available in your PATH
    ```shell
    npm install -g esbuild
    ``` 

## Development
Now after both are installed you can go ahead and run `nx run dev` which should:
- Invoke `sam build` which builds your artifacts and copies them to `.aws-sam`
- Invoke `sam local invoke` which invokes the function defined inside of your `template.yaml` file

## Deployment
**Note**: Before attempting to deploy you must have completed the prequistes for using AWS services such as:
- Creating an AWS Account
- Provisioning an admin user
- Creating Access keys

To deploy you run 
```shell
nx run deploy
```

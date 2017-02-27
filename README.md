## Introduction
Having some experience in using `jest` to test react components, I've decided to use it in this project. I am also linting the code with `eslint` and making my deployed functions smaller by using `serverless-plugin-include-dependencies`. I am using `SNS` to trigger a separate lambda function that saves the JSON file to the S3 bucket to speed up the response time from the `getComment` function.

## About this project

1. Lambda function **getComment** is triggered by an API Gateway endpoint with the path `comments/:id`. It then does a REST call to [JSON Placeholder](https://jsonplaceholder.typicode.com/), returns the JSON to the client and publishes it to an SNS topic which triggers the **commentSaver** function.

2. The **commentSaver** function uploads the JSON to an S3 bucket. This triggers the **commentParser** function.

3. The **commentParser** function downloads the file that was just saved and parses the content to be shown in the Cloudwatch Logs.

## Getting started

1. **Install dependencies**

    To set up the `node_modules`, first run:

    ```bash
    npm install
    ```

2. **Deploy**

    To deploy the service run:

    ```bash
    npm run deploy
    ```


4. **Visit the service endpoint**

    Go to the API endpoint with the path `/comments/1`

3. **Tests**

    Additionally you can run the tests by typing:

    ```bash
    npm test
    ```

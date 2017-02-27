const AWS = require('aws-sdk');
const fetch = require('node-fetch');
const uuidV4 = require('uuid/v4');

const apiURL = 'https://jsonplaceholder.typicode.com';

module.exports.getComment = (event, context, callback) => {
  const sns = new AWS.SNS();

  fetch(`${apiURL}/comments/${event.pathParameters.commentId}`)
    .then(res => res.json())
    .then(json =>
      sns.publish({
        Message: JSON.stringify(json),
        Subject: 'whatever',
        TopicArn: process.env.SNS_ARN,
      }).promise().then(() => json),
    )
    .then(json => callback(null, {
      statusCode: 200,
      body: JSON.stringify(json),
    }))
    .catch((err) => {
      console.error(err);
      return callback({
        statusCode: 500,
        body: {
          message: 'Something went wrong',
        },
      }, null);
    });
};

module.exports.commentParser = (event, context, callback) => {
  const s3 = new AWS.S3();

  s3.getObject({
    Bucket: event.Records[0].s3.bucket.name,
    Key: event.Records[0].s3.object.key,
  }).promise()
  .then((data) => {
    console.log(JSON.stringify(JSON.parse(data.Body)));
    return callback(null, data.Body);
  })
  .catch((err) => {
    console.error(err);
    return callback({
      statusCode: 500,
      body: {
        message: 'Something went wrong',
      },
    }, null);
  });
};

module.exports.commentSaver = (event, context, callback) => {
  const s3 = new AWS.S3();
  const message = event.Records[0].Sns.Message;
  const uuid = uuidV4();

  return s3.putObject({
    Bucket: process.env.BUCKET,
    Key: `comments/${uuid}`,
    Body: message,
  }).promise()
  .then(() => callback(null, {
    statusCode: 200,
    body: JSON.stringify(message),
  }))
  .catch((err) => {
    console.error(err);
    return callback({
      statusCode: 500,
      body: {
        message: 'Something went wrong',
      },
    }, null);
  });
};

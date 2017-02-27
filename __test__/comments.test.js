const AWS = require('aws-sdk-mock');
const LambdaTester = require('lambda-tester');
const nock = require('nock');

process.env.BUCKET = 'jest';
process.env.SNS_ARN = 'arn:aws:sns:us-east-1:123456789012:mystack-mytopic-NZJ5JSMVGFIE';

const handler = require('../build/functions/comments');

const apiURL = 'https://jsonplaceholder.typicode.com';

const event = {
  pathParameters: {
    commentId: '1',
  },
  Records: [
    {
      s3: {
        bucket: {
          name: 'foo',
        },
        object: {
          key: 'foo',
        },
      },
      Sns: {
        Message: 'foo',
      },
    },
  ],
};

const comment = {
  postId: 1,
  id: 1,
  name: 'id labore ex et quam laborum',
  email: 'Eliseo@gardner.biz',
  body: 'laudantium enim quasi est quidem magnam voluptate ipsam eos',
};

const commentString = JSON.stringify(comment);

describe('Comments', () => {
  describe('getComment()', () => {
    describe('Succes', () => {
      beforeEach(() => {
        AWS.mock('SNS', 'publish', {});
        nock(apiURL)
          .get('/comments/1')
          .reply(200, comment);
      });

      afterEach(() => {
        AWS.restore('SNS');
        nock.cleanAll();
      });

      test('Fetches JSON from API and publishes to SNS', () =>
        LambdaTester(handler.getComment)
          .event(event)
          .expectResult(data => expect(data.body).toMatchSnapshot()),
      );
    });

    describe('Failure', () => {
      beforeEach(() => {
        AWS.mock('SNS', 'publish', {});
        nock(apiURL)
          .get('/comments/1')
          .replyWithError('Error');
      });

      afterEach(() => {
        AWS.restore('SNS');
        nock.cleanAll();
      });

      test('API fetch should fail', () =>
        LambdaTester(handler.getComment)
          .event(event)
          .expectError(err => expect(err).toMatchSnapshot()),
      );
    });
  });

  describe('commentParser()', () => {
    describe('success', () => {
      beforeEach(() => {
        AWS.mock('S3', 'getObject', { Body: commentString });
      });

      afterEach(() => {
        AWS.restore('S3');
      });

      test('Gets JSON comment file from S3 bucket', () =>
        LambdaTester(handler.commentParser)
          .event(event)
          .expectResult(data => expect(data).toMatchSnapshot()),
      );
    });

    describe('failure', () => {
      beforeEach(() => {
        AWS.mock('S3', 'getObject', (foo, callback) => {
          callback({
            message: 'Something went wrong',
            code: 'NoSuchKey',
          }, null);
        });
      });

      afterEach(() => {
        AWS.restore('S3');
      });

      test('Getting object from S3 bucket should return error', () =>
        LambdaTester(handler.commentParser)
          .event(event)
          .expectError(err => expect(err).toMatchSnapshot()),
      );
    });
  });

  describe('commentSaver()', () => {
    describe('success', () => {
      beforeEach(() => {
        AWS.mock('S3', 'putObject', {});
      });

      afterEach(() => {
        AWS.restore('S3');
      });

      test('message received from SNS should be saved in S3 bucket', () =>
        LambdaTester(handler.commentSaver)
          .event(event)
          .expectResult(data => expect(data).toMatchSnapshot()),
      );
    });

    describe('failure', () => {
      beforeEach(() => {
        AWS.mock('S3', 'putObject', (foo, callback) => {
          callback({
            message: 'Something went wrong',
            code: 'NoSuchBucket',
          }, null);
        });
      });

      afterEach(() => {
        AWS.restore('S3');
      });

      test('saving message to S3 bucket should fail because bucket does not exist', () =>
        LambdaTester(handler.commentSaver)
          .event(event)
          .expectError(err => expect(err).toMatchSnapshot()),
      );
    });
  });
});

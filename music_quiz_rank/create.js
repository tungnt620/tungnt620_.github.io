'use strict';

const AWS = require('aws-sdk');
var redis = require('redis');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.create = (event, context, callback) => {
  const id = Number(event.pathParameters.id);
  const numbercorrect = Number(event.pathParameters.numbercorrect);
  const numbertotal = Number(event.pathParameters.numbertotal);
  const email = event.pathParameters.email;
  const name = event.pathParameters.name;
  const score_ratio = numbercorrect / numbertotal;

  const params = {
    TableName: 'music-quiz',
    Item: {
      id: id,
      numbercorrect: numbercorrect,
      numbertotal: numbertotal,
      score_ratio: score_ratio,
      email: email,
      name: name,
    },
  };

  // write the todo to the database
  dynamoDb.put(params, (error, result) => {
    // handle potential errors
    if (error) {
      console.error(error); // eslint-disable-line no-console
      callback(new Error('Couldn\'t create item.'));
      return;
    }

    // create a resonse
    const response = {
      statusCode: 200,
      // HERE'S THE CRITICAL PART
      headers: {
        "Access-Control-Allow-Origin" : "*" // Required for CORS support to work
      },
      body: JSON.stringify(result.Item),
    };

    const client = redis.createClient(14837, 'pub-redis-14837.us-east-1-2.5.ec2.garantiadata.com', {no_ready_check: true});
    client.auth('zennisproduct', function (err) {
        if (err) {throw err;}
    });

    var args = ['music-quiz', score_ratio, id];
    client.zadd(args, function (err, response) {
      if (err) { throw err; }
      client.quit();
      callback(null, response);
    });

  });
};

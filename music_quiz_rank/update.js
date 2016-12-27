'use strict';

const AWS = require('aws-sdk');
var redis = require('redis');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.update = (event, context, callback) => {
  const id = Number(event.pathParameters.id);
  const numbercorrect = Number(event.pathParameters.numbercorrect);
  const numbertotal = Number(event.pathParameters.numbertotal);
  const score_ratio = numbercorrect / numbertotal;
  const params = {
    TableName: 'music-quiz',
    Key: {
      id: id
    },
    UpdateExpression: "set numbercorrect = :numbercorrect, numbertotal = :numbertotal, score_ratio = :score_ratio",
    ExpressionAttributeValues:{
        ":numbercorrect": numbercorrect,
        ":numbertotal": numbertotal,
        ":score_ratio": score_ratio
    },
    ReturnValues:"UPDATED_NEW"
  };

  // write the todo to the database
  dynamoDb.update(params, (error, result) => {
    // handle potential errors
    if (error) {
      console.error(error); // eslint-disable-line no-console
      callback(new Error('Couldn\'t update the music_quiz_rank item.'));
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
        if (err) { 
          console.error(error);
          throw err; 
        }
    });

    var args = [ 'music-quiz', score_ratio, id];
    client.zadd(args, function (err, res) {
      if (err) {
          console.error(error);
          throw err;
      }
      client.quit();
      console.log(response);
      callback(null, response);
    });
  });
};

'use strict';

const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.get = (event, context, callback) => {

  const id = Number(event.pathParameters.id);
  const params = {
    TableName: 'music-quiz',
    Key: {
      id: id,
    },
  };

  // fetch all todos from the database
  dynamoDb.get(params, (error, result) => {
    // handle potential errors
    if (error) {
      console.error(error); // eslint-disable-line no-console
      callback(new Error('Couldn\'t fetch the user item.'));
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
    callback(null, response);
  });
};

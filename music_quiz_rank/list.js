'use strict';

const AWS = require('aws-sdk');
var redis = require('redis');

const dynamodb_ = new AWS.DynamoDB();
const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.list = (event, context, callback) => {
  const current_userid = event.pathParameters.current_userid;
  const from = 0, to = 9;
  const args = [ 'music-quiz', from, to];
  var list_top_user = [];
  var current_rank_user = 999;

  const client = redis.createClient(14837, 'pub-redis-14837.us-east-1-2.5.ec2.garantiadata.com', {no_ready_check: true});
  client.auth('zennisproduct', function (err) {
      if (err) {console.log(err); throw err;}
  });
  client.zrevrange(args, function (err, response) {
    if (err) {console.log(err); throw err;}
    list_top_user = response;
    console.log('zrevrange: ', response);

    client.zrevrank(['music-quiz', Number(current_userid)], function (err, response2) {
      if (err) {console.log(err); throw err;}
      client.quit();
      current_rank_user = response2;
      console.log('zrevrank: ', response2);

      if (current_rank_user >= list_top_user.length) {
        list_top_user[list_top_user.length - 1] = current_userid;
      }

      var list_keys = [];
      for (var i = 0; i < list_top_user.length; ++i) {
        var temp = list_top_user[i];
        list_keys.push({
                    id : {'N': temp}
                });
      }

      var params = {
        RequestItems: {
          'music-quiz': {
            Keys: list_keys
          }
        }
      };

      dynamodb_.batchGetItem(params, function(err, data_) {
        if (err) {
          console.log(err); // an error occurred
          callback(new Error('Couldn\'t fetch the usrs.'));
        } else {
          console.log(data_.Responses); // successful response
          var data = data_.Responses['music-quiz'];
          var list_result = [];
          for (var i = 0; i < data.length; ++i) {
            var temp = {};
            temp.id = data[i].id.N;
            temp.numbertotal = data[i].numbertotal.N;
            temp.numbercorrect = data[i].numbercorrect.N;
            temp.score_ratio = data[i].score_ratio.N;
            temp.email = data[i].email.S;
            temp.name = data[i].name.S;


            for (var j = 0; j < list_top_user.length; ++j) {
              console.log('Temp: ', temp);
              if (temp.id == list_top_user[j]) {
                list_result.push(temp);

                if (temp.id != current_userid) {
                  list_result[list_result.length - 1].rank = j + 1;
                } else {
                  console.log('current_rank_user: ', current_rank_user);
                  list_result[list_result.length - 1].rank = current_rank_user;
                }
              }
            }
            
          }
          console.log('list_result', list_result);
          // create a resonse
          const response3 = {
            statusCode: 200,
            // HERE'S THE CRITICAL PART
            headers: {
              "Access-Control-Allow-Origin" : "*" // Required for CORS support to work
            },
            body: JSON.stringify(list_result),
          };

          console.log(response3);
          callback(null, response3);
        }
        
      });
    });
  });
  
};

const aws = require("aws-sdk");

const createDynamoDb = () => {
  const dynamoDb = new aws.DynamoDB.DocumentClient({
    service: new aws.DynamoDB({
      apiVersion: "2012-08-10",
      region: "eu-west-1",
    }),
  });

  // DynamoDB query methods force pagination with a max 1MB page. withAllPages wraps a DynamoDB method to retrieve all pages when called.
  const withAllPages = (query) => async (params) => {
    const _withAllPages = async (lastKey) => {
      const paramsWithKey = { ...params, ExclusiveStartKey: lastKey };

      const { Items, LastEvaluatedKey } = await query(paramsWithKey).promise();

      return LastEvaluatedKey
        ? [...Items, ...(await _withAllPages(LastEvaluatedKey))]
        : Items;
    };

    return _withAllPages();
  };

  return {
    scan: withAllPages(dynamoDb.scan.bind(dynamoDb)),
    put: (...args) => dynamoDb.put(...args).promise(),
    get: (...args) => dynamoDb.get(...args).promise(),
    query: (...args) => dynamoDb.query(...args).promise(),
  };
};

module.exports.createDynamoDb = createDynamoDb;

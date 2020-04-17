const { compose, fromPairs, toPairs, map } = require("ramda");
const { createDynamoDb: _createDynamoDb } = require("./lib/dynamodb.js");

const createHandler = (
  createDynamoDb = _createDynamoDb,
  pairsTableName = process.env.PAIRS_TABLE_NAME
) => {
  const mapPairs = (f) => compose(fromPairs, map(f), toPairs);
  const normaliseHeaders = mapPairs(([key, value]) => [
    key.toLowerCase(),
    value,
  ]);

  const parseEvent = ({ pathParameters, headers, body, requestContext }) => {
    const normalisedHeaders = normaliseHeaders(headers);

    // TODO validation
    return {
      applicationId: normalisedHeaders["x-application-id"],
      key: pathParameters.key,
      value: body,
      requestTime: new Date(requestContext.requestTimeEpoch),
    };
  };

  const writeItem = async ({ applicationId, key, value, requestTime }) => {
    const db = createDynamoDb();

    const item = {
      applicationId,
      key,
      value,
      createdAt: requestTime.toISOString(),
    };

    await db.put({
      TableName: pairsTableName,
      Item: item,
    });
  };

  const handleEvent = async (event) => {
    try {
      const { applicationId, key, value, requestTime } = parseEvent(event);
      await writeItem({ applicationId, key, value, requestTime });

      return {
        statusCode: 200,
        body: JSON.stringify({
          applicationId,
          key,
          value,
        }),
      };
    } catch (error) {
      console.error(error);
      return {
        statusCode: error.code || 500,
        body: JSON.stringify({
          details: error.publicDetails || "Unkown error",
        }),
      };
    }
  };

  return handleEvent;
};

module.exports.handler = createHandler();
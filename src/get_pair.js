const { inspect } = require("util");
const { compose, fromPairs, toPairs, map } = require("ramda");
const { createDynamoDb: _createDynamoDb } = require("./lib/dynamodb.js");
const { chaos } = require("./lib/chaos.js");

const createHandler = (
  createDynamoDb = _createDynamoDb,
  pairsTableName = process.env.PAIRS_TABLE_NAME
) => {
  const mapPairs = (f) => compose(fromPairs, map(f), toPairs);
  const normaliseHeaders = mapPairs(([key, value]) => [
    key.toLowerCase(),
    value,
  ]);

  const parseEvent = ({ pathParameters, headers }) => {
    const normalisedHeaders = normaliseHeaders(headers);

    // TODO validation
    return {
      applicationId: normalisedHeaders["x-application-id"],
      key: pathParameters.key,
    };
  };

  const readPair = async ({ applicationId, key }) => {
    const db = createDynamoDb();

    console.log("get", applicationId, key);

    const { Item } = await db.get({
      TableName: pairsTableName,
      Key: {
        applicationId,
        key,
      },
    });

    // TODO: parse pair from database to decouple representation from storage.
    return Item;
  };

  const handleEvent = async (event) => {
    try {
      chaos();

      const { applicationId, key } = parseEvent(event);
      const pair = await readPair({ applicationId, key });

      // TODO implement 404

      return {
        statusCode: 200,
        body: JSON.stringify(pair),
      };
    } catch (error) {
      console.error(inspect(event, { depth: 3 }));
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

const { inspect } = require("util");
const Ajv = require("ajv");
const { compose, fromPairs, toPairs, map } = require("ramda");
const { createDynamoDb: _createDynamoDb } = require("./lib/dynamodb.js");
const { chaos } = require("./lib/chaos.js");
const { BadRequest } = require("./lib/errors.js");

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

    const input = {
      applicationId: normalisedHeaders["x-application-id"],
      prefix: pathParameters.prefix,
    };

    const ajv = new Ajv();
    const schema = {
      type: "object",
      properties: {
        applicationId: { type: "string" },
        prefix: { type: "string" },
      },
      required: ["applicationId", "prefix"],
    };
    const valid = ajv.validate(schema, input);
    if (!valid) throw new BadRequest(ajv.errorsText());

    return input;
  };

  const queryPairs = ({ applicationId, prefix }) => {
    const db = createDynamoDb();

    console.log("get", applicationId, prefix);

    return db.query({
      TableName: pairsTableName,
      KeyConditionExpression:
        "applicationId = :applicationId and begins_with(#key, :prefix)",
      ExpressionAttributeNames: {
        "#key": "key",
      },
      ExpressionAttributeValues: {
        ":applicationId": applicationId,
        ":prefix": prefix,
      },
    });
  };

  const handleEvent = async (event) => {
    try {
      chaos();

      const { applicationId, prefix } = parseEvent(event);
      const pairs = await queryPairs({ applicationId, prefix });

      return {
        statusCode: 200,
        body: JSON.stringify(pairs),
        headers: {
          "content-type": "application/json",
        },
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

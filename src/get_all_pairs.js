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

  const parseEvent = ({ headers }) => {
    const normalisedHeaders = normaliseHeaders(headers);

    const input = {
      applicationId: normalisedHeaders["x-application-id"],
    };

    const ajv = new Ajv();
    const schema = {
      type: "object",
      properties: {
        applicationId: { type: "string" },
      },
      required: ["applicationId"],
    };
    const valid = ajv.validate(schema, input);
    if (!valid) throw new BadRequest(ajv.errorsText());

    return input;
  };

  const readPairs = async ({ applicationId }) => {
    const db = createDynamoDb();

    const items = await db.query({
      TableName: pairsTableName,
      KeyConditionExpression: "applicationId = :applicationId",
      ExpressionAttributeValues: {
        ":applicationId": applicationId,
      },
    });

    // TODO: parse pair from database to decouple representation from storage.
    return items;
  };

  const handleEvent = async (event) => {
    try {
      chaos();

      const { applicationId } = parseEvent(event);
      const pair = await readPairs({ applicationId });

      return {
        statusCode: 200,
        body: JSON.stringify(pair),
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

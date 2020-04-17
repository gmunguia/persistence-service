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

  const parseEvent = ({ pathParameters, headers, body, requestContext }) => {
    const normalisedHeaders = normaliseHeaders(headers);

    const input = {
      applicationId: normalisedHeaders["x-application-id"],
      key: pathParameters.key,
      value: body,
      requestTime: new Date(requestContext.requestTimeEpoch),
    };

    const ajv = new Ajv();
    const schema = {
      type: "object",
      properties: {
        applicationId: { type: "string" },
        key: { type: "string" },
        value: { type: "string" },
      },
      required: ["applicationId", "key", "value"],
    };
    const valid = ajv.validate(schema, input);
    if (!valid) throw new BadRequest(ajv.errorsText());

    return input;
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
      chaos();

      const { applicationId, key, value, requestTime } = parseEvent(event);
      await writeItem({ applicationId, key, value, requestTime });

      return {
        statusCode: 200,
        body: JSON.stringify({
          applicationId,
          key,
          value,
        }),
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

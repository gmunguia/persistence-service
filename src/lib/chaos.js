const { Chaos } = require("./errors");

module.exports.chaos = () => {
  const ERROR_RATE = 1;
  if (Math.random() < 1 / ERROR_RATE) throw new Chaos();
};

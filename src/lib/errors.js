class Chaos extends Error {
  constructor() {
    super("Artificial error");
    this.publicDetails = "👹👹👹";
  }
}

class HttpError extends Error {}

class BadRequest extends HttpError {
  constructor(publicDetails) {
    super("Bad request");
    this.code = 400;
    this.publicDetails = publicDetails;
  }
}

module.exports.HttpError = HttpError;
module.exports.BadRequest = BadRequest;
module.exports.Chaos = Chaos;

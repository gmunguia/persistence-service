class Chaos extends Error {
  constructor() {
    super("Artificial error");
    this.publicDetails = "👹👹👹";
  }
}

module.exports.Chaos = Chaos;

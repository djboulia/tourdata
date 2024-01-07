const PgaTourMain = require("../../common/lib/pgascores/pgatour/pgatourmain");

const run = async () => {
  const eventid = "R2023014";
  // const eventid = "R2023018";   // this is an invalid eventid
  const main = new PgaTourMain("pga", 2023);
  const results = await main.getEventLive(eventid);
  console.log(JSON.stringify(results, null, 2));
};

run();

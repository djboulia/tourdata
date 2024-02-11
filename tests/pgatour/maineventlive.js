const PgaTourSchedule = require("../../common/lib/pgascores/pgatour/pgatourschedule");
const PgaTourEvent = require("../../common/lib/pgascores/pgatour/pgatourevent");

const run = async () => {
  const eventid = "R2023014";
  // const eventid = "R2023018";   // this is an invalid eventid
  const schedule = new PgaTourSchedule("pga", 2023);
  const main = new PgaTourEvent("pga", 2023, schedule);
  const results = await main.getLive(eventid);
  console.log(JSON.stringify(results, null, 2));
};

run();

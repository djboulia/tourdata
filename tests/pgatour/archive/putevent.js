const PgaTourSchedule = require("../../common/lib/pgascores/pgatour/pgatourschedule");
const PgaTourEvent = require("../../../common/lib/pgascores/pgatour/pgatourevent");

const run = async () => {
  const schedule = new PgaTourSchedule("pga", 2023);
  const main = new PgaTourEvent("pga", 2023, schedule);
  const results = await main.archive("R2023546");
  console.log(JSON.stringify(results, null, 2));
};

run();

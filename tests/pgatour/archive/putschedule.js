const PgaTourSchedule = require("../../../common/lib/pgascores/pgatour/pgatourschedule");

const run = async () => {
  const main = new PgaTourSchedule("pga", 2023);
  const results = await main.archive();
  console.log(JSON.stringify(results, null, 2));
};

run();

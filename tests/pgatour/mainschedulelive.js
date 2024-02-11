const PgaTourSchedule = require("../../common/lib/pgascores/pgatour/pgatourschedule");

const run = async () => {
  const main = new PgaTourSchedule("pga", 2024);
  const results = await main.getLive();
  console.log(JSON.stringify(results, null, 2));
};

run();

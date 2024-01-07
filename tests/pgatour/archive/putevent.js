const PgaTourMain = require("../../../common/lib/pgascores/pgatour/pgatourmain");

const run = async () => {
  const main = new PgaTourMain("pga", 2023);
  const results = await main.archiveEvent("R2023546");
  console.log(JSON.stringify(results, null, 2));
};

run();

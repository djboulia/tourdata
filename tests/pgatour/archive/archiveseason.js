const SeasonArchiver = require("../../../common/lib/pgascores/archiver/seasonarchiver");

const run = async () => {
  const tour = "pga";
  const year = 2024;
  const archiver = new SeasonArchiver(tour);
  await archiver.archive(year, true /* force update */);
  console.log(`Season archive for ${year} complete`);
};

run();

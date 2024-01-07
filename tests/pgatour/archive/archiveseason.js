const SeasonArchiver = require("../../../common/lib/pgascores/archiver/seasonarchiver");

const run = async () => {
  const tour = "pga";
  const year = 2023;
  const archiver = new SeasonArchiver(tour);
  await archiver.archive(year);
  console.log(`Season archive for ${year} complete`);
};

run();

const qlRankings = require("../../common/lib/pgascores/pgatour/graphql/rankingdetails");
const RankingDetails = require("../../common/lib/pgascores/pgatour/rankingdetails");

const run = async () => {
  const results = await qlRankings("pga", 2024);
  console.log(results);

  console.log("rows", results?.statDetails?.rows);
  const rankingDetails = new RankingDetails();
  const records = rankingDetails.normalize(results);
  console.log("records:", records);
};

run();

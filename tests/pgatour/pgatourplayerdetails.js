const PlayerDetails = require("../../common/lib/pgascores/pgatour/playerdetails");

const qlGetPlayerDetails = require("../../common/lib/pgascores/pgatour/graphql/playerdetails");

const run = async () => {
  // const results = await qlGetPlayerDetails("R2023546", "48119");
  const results = await qlGetPlayerDetails("R2023005", "50493");
  console.log(results);

  const playerDetails = new PlayerDetails();
  const round_details = playerDetails.normalize(results);

  console.log("round_details:", round_details);
};

run();

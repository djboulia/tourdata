const qlGetTournaent = require("../../common/lib/pgascores/pgatour/graphql/tournament");

const run = async () => {
  const results = await qlGetTournaent("R2023546");
  console.log(results);

  if (results?.leaderboardStrokes?.strokes) {
    console.log("results.strokes:", results?.leaderboardStrokes?.strokes);
  }
};

run();

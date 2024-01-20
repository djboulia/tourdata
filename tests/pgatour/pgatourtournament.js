const qlGetTournaent = require("../../common/lib/pgascores/pgatour/graphql/tournament");

const run = async () => {
  const results = await qlGetTournaent("R2023005");
  console.log(results);

  const strokes = results?.leaderboardStrokes?.strokes;
  if (strokes) {
    for (const stroke of strokes) {
      console.log("stroke:", stroke);
    }
  }
};

run();

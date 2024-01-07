const { formatNetScore } = require("../../common/lib/utils/scorecard");
const qlGetPlayerDetails = require("../../common/lib/pgascores/pgatour/graphql/playerdetails");

const run = async () => {
  const results = await qlGetPlayerDetails("R2023546", "48119");
  console.log(results);

  if (results?.scorecardV2?.player) {
    console.log("results.player:", results?.scorecardV2?.player);
  }

  const round_details = {};

  if (results?.scorecardV2?.roundScores) {
    for (const round of results?.scorecardV2?.roundScores) {
      console.log("round:", round);

      // console.log("round.firstNine.holes:", round?.firstNine?.holes);
      // console.log("round.secondNine.holes:", round?.secondNine?.holes);

      // round_details: {
      //   "1": {
      //         "round_values": [...],  // array of string scores for each hole, e.g. { "3", "4", "2", "5"}
      //         "par_values": [...],    // array of numbers representing par for each hole, e.g. { 3, 4, 2, 5 }
      //         "net_values": [...]     // array of string net par values for each hole , e.g ("E", "-1", "+1", etc.)
      //   }
      //   "2" {...}
      //   "3" {...}
      //   "4" {...}

      const details = {
        round_values: [],
        par_values: [],
        net_values: [],
      };

      for (const hole of round?.firstNine?.holes) {
        console.log("hole:", hole);

        details.round_values.push(`${hole?.score}`);
        details.par_values.push(hole?.par);
        details.net_values.push(formatNetScore(hole?.score - hole?.par));
      }

      for (const hole of round?.secondNine?.holes) {
        console.log("hole:", hole);

        details.round_values.push(`${hole?.score}`);
        details.par_values.push(hole?.par);
        details.net_values.push(formatNetScore(hole?.score - hole?.par));
      }

      round_details[`${round.roundNumber}`] = details;
    }
  }

  console.log("round_details:", round_details);
};

run();

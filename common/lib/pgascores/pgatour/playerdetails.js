const { formatNetScore } = require("../../utils/scorecard");

/**
 * Format hole by hole details for a given player
 *
 */
const PlayerDetails = function () {
  const isValidHoleScore = function (hole) {
    const valid = Number.parseInt(hole?.score) > 0;
    return valid;
  };

  const addHoleScore = function (details, hole) {
    details.round_values.push(`${hole?.score}`);
    details.par_values.push(hole?.par);
    const netScore = isValidHoleScore(hole)
      ? formatNetScore(hole?.score - hole?.par)
      : "-";
    details.net_values.push(netScore);
  };

  this.normalize = function (details) {
    const round_details = {};

    if (!details?.scorecardV2?.roundScores) {
      console.log("no round scores found");
      return undefined;
    }

    if (details?.scorecardV2?.roundScores) {
      for (const round of details?.scorecardV2?.roundScores) {
        // console.log("round:", round);

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

        let hasOneValidScore = false;

        for (const hole of round?.firstNine?.holes) {
          // console.log("hole:", hole);

          addHoleScore(details, hole);

          if (isValidHoleScore(hole)) {
            hasOneValidScore = true;
          }
        }

        for (const hole of round?.secondNine?.holes) {
          // console.log("hole:", hole);

          addHoleScore(details, hole);

          if (isValidHoleScore(hole)) {
            hasOneValidScore = true;
          }
        }

        if (!hasOneValidScore) {
          console.log(
            `no valid scores found for round ${round.roundNumber}, skipping`
          );
        } else {
          round_details[`${round.roundNumber}`] = details;
        }
      }
    }

    return round_details;
  };
};

module.exports = PlayerDetails;

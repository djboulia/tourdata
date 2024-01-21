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

  this.normalize = function (playerId, rounds) {
    const round_details = {};

    let roundNumber = 0;

    for (const round of rounds) {
      roundNumber++;

      if (!round?.leaderboardHoleByHole?.playerData) {
        console.log("no player data for player:", playerId);
        continue;
      }

      const playerData = round.leaderboardHoleByHole.playerData;
      const player = playerData.find((p) => p.playerId === playerId);

      if (!player) {
        console.log("no scoring data found for player:", playerId);
        continue;
      }

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

      player.scores.sort((a, b) => a.holeNumber - b.holeNumber);

      for (const hole of player.scores) {
        // console.log("hole:", hole);

        addHoleScore(details, hole);

        if (isValidHoleScore(hole)) {
          hasOneValidScore = true;
        }
      }

      if (!hasOneValidScore) {
        console.log(`no valid scores found for round ${roundNumber}, skipping`);
      } else {
        round_details[`${roundNumber}`] = details;
      }
    }

    return round_details;
  };
};

module.exports = PlayerDetails;

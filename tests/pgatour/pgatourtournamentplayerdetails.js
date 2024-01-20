/**
 * the pga tour site has no graph query that returns the tournament details
 * with hole by hole information.  To get the data, we loop through the
 * tournament players and get their hole by hole data.
 */
const glLeaderboard = require("../../common/lib/pgascores/pgatour/graphql/leaderboard");
const qlGetPlayerDetails = require("../../common/lib/pgascores/pgatour/graphql/playerdetails");

const tournamentId = "R2023014";

const run = async () => {
  const results = await glLeaderboard(tournamentId);
  // console.log(JSON.stringify(results, null, 2));

  const leaderboard = results.leaderboardV2;
  for (const player of leaderboard.players) {
    console.log("player:", player);
    if (player["__typename"] === "PlayerRowV2") {
      const playerId = player.id;
      const details = await qlGetPlayerDetails(tournamentId, playerId);
      console.log("player details: ", details);
    }
  }
};

run();

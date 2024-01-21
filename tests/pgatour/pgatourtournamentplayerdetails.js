/**
 * the pga tour site has no graph query that returns the tournament details
 * with hole by hole information.  To get the data, we loop through the
 * tournament players and get their hole by hole data.
 */
const Player = require("../../common/lib/pgascores/pgatour/player");
const glLeaderboard = require("../../common/lib/pgascores/pgatour/graphql/leaderboard");
const qlLeaderboardHoleByHole = require("../../common/lib/pgascores/pgatour/graphql/leaderboardholebyhole");

const tournamentId = "R2024002"; // 2024 American Express
// const tournamentId = "R2023014";

const run = async () => {
  const results = await glLeaderboard(tournamentId);
  const rounds = [];

  rounds.push(await qlLeaderboardHoleByHole(tournamentId, 1));
  rounds.push(await qlLeaderboardHoleByHole(tournamentId, 2));
  rounds.push(await qlLeaderboardHoleByHole(tournamentId, 3));
  rounds.push(await qlLeaderboardHoleByHole(tournamentId, 4));

  // console.log(JSON.stringify(results, null, 2));

  const playerParser = new Player(true);

  const leaderboard = results.leaderboardV2;
  leaderboard.rounds = rounds;

  for (const player of leaderboard.players) {
    console.log("player:", player);

    if (player["__typename"] === "PlayerRowV2") {
      const record = playerParser.normalize(player, leaderboard.rounds);
      console.log("player record: ", JSON.stringify(record, null, 2));
    }
  }
};

run();

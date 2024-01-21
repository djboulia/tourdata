const qlLeaderboardHoleByHole = require("../../common/lib/pgascores/pgatour/graphql/leaderboardholebyhole");

const tournamentId = "R2024002"; // 2024 American Express

const run = async () => {
  const results = [];
  results.push(await qlLeaderboardHoleByHole(tournamentId, 1));
  results.push(await qlLeaderboardHoleByHole(tournamentId, 2));
  results.push(await qlLeaderboardHoleByHole(tournamentId, 3));
  results.push(await qlLeaderboardHoleByHole(tournamentId, 4));
  console.log(JSON.stringify(results, null, 2));
};

run();

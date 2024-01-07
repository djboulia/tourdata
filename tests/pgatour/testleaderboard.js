const qlLeaderboard = require("../../common/lib/pgascores/pgatour/graphql/leaderboard");

const run = async () => {
  const results = await qlLeaderboard("R2023546");
  // console.log(JSON.stringify(results, null, 2));

  const leaderboard = results.leaderboardV2;
  for (const player of leaderboard.players) {
    const record = {
      1: player.rounds[0],
      2: player.rounds[1],
      3: player.rounds[2],
      4: player.rounds[3],
      name: player.player?.displayName,
      strokes: player.totalStrokes,
      pos: player.position,
      thru: player.thru === "F*" ? 18 : player.thru,
      today: player.score,
      total: player.total,
    };

    console.log("player:", record);
  }
};

run();

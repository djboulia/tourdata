const qlGetSchedule = require("../../common/lib/pgascores/pgatour/graphql/schedule");

const run = async () => {
  const results = await qlGetSchedule("pga", 2023);
  console.log(results);

  if (results?.schedule?.completed) {
    const completed = results?.schedule?.completed;
    console.log("results.completed:", completed);

    completed.map((complete) => {
      console.log("tournament:", complete?.tournaments);
    });
  }
  if (results?.schedule?.upcoming) {
    console.log("results.upcoming:", results?.schedule?.upcoming);

    if (results?.schedule?.upcoming?.tournaments) {
      console.log(
        "results.upcoming.tournaments:",
        results?.schedule?.upcoming?.tournaments
      );
    }
  }
};

run();

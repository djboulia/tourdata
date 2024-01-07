const qlGetSchedule = require("../../common/lib/pgascores/pgatour/graphql/schedule");
const qlGetCourseDetails = require("../../common/lib/pgascores/pgatour/graphql/coursedetails");

const addCourseDetails = async (tournaments) => {
  for (const month of tournaments) {
    for (const tournament of month?.tournaments) {
      // console.log("tournament:", tournament);

      const id = tournament?.id;
      const courseDetails = await qlGetCourseDetails(id);
      console.log("courseDetails:", courseDetails);
      tournament.tournamentRecap = courseDetails?.tournamentRecap;

      console.log(tournament);
    }
  }
};

const run = async () => {
  const results = await qlGetSchedule("pga", 2023);
  console.log(results);

  if (results?.schedule?.completed) {
    const completed = results?.schedule?.completed;

    await addCourseDetails(completed);
    console.log("results.completed:", completed);
  }
  if (results?.schedule?.upcoming) {
    const upcoming = results?.schedule?.upcoming;

    await addCourseDetails(upcoming);
    console.log("results.upcoming:", results?.schedule?.upcoming);
  }
};

run();

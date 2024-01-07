const qlGetCourseDetails = require("../../common/lib/pgascores/pgatour/graphql/coursedetails");

const run = async () => {
  const results = await qlGetCourseDetails("R2023546");
  console.log(results);
  console.log("courses: ", results?.tournamentRecap?.courses);
};

run();

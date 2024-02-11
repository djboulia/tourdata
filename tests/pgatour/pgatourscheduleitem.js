// this get the schedule details for a specific event
// we need to get the season schedule first, then we can get the item details
const qlGetCourseDetails = require("../../common/lib/pgascores/pgatour/graphql/coursedetails");
const qlGetSchedule = require("../../common/lib/pgascores/pgatour/graphql/schedule");

const ScheduleItemData = require("../../common/lib/pgascores/pgatour/scheduleitemdata");

const tour = "pga";
const year = 2023;
const tournamentId = "R2023005";

const findTournamentId = function (id, tournaments) {
  if (!tournaments) return undefined;

  for (let i = 0; i < tournaments.length; i++) {
    const tournament = tournaments[i];
    if (tournament.id === id) {
      return tournament;
    }
  }
  return undefined;
};

const findScheduleTournamentId = function (id, schedule) {
  if (schedule?.completed) {
    const completed = schedule?.completed;
    // console.log("results.completed:", completed);

    for (let i = 0; i < completed.length; i++) {
      const month = completed[i];
      // console.log("month:", month);
      const tournament = findTournamentId(id, month?.tournaments);
      if (tournament) {
        return tournament;
      }
    }
  }

  // if we fall through to here, we didn't find the tournament in the completed list
  // check the upcoming schedule for the given year
  if (schedule?.upcoming) {
    const upcoming = schedule?.upcoming;
    // console.log("schedule.upcoming:", upcoming);

    for (let i = 0; i < upcoming.length; i++) {
      const month = upcoming[i];
      // console.log("month:", month);

      const tournament = findTournamentId(id, month?.tournaments);
      if (tournament) {
        return tournament;
      }
    }
  }
};

const run = async () => {
  const results = await qlGetSchedule("pga", 2023);
  // console.log(results);

  const tournament = findScheduleTournamentId(tournamentId, results?.schedule);
  console.log("tournament:", tournament);

  if (tournament) {
    const details = await qlGetCourseDetails(tournamentId);
    console.log(details);
    console.log("courses: ", details?.tournamentRecap?.courses);

    tournament.tournamentRecap = details?.tournamentRecap;

    const scheduleItemData = new ScheduleItemData(tour, year);
    const result = scheduleItemData.normalize(tournament);

    console.log("result: ", result);
  }

  // now we can get the course details for this specific tournament
};

run();

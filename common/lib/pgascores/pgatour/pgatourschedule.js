const ScheduleData = require("./scheduledata.js");
const Cache = require("../utils/cache.js");
const ArchiveSchedule = require("./archive/archiveschedule.js");
const qlGetSchedule = require("./graphql/schedule.js");
const qlGetCourseDetails = require("./graphql/coursedetails.js");

/**
 * handle current year pga tour schedule requests.  Will check the archive first
 * and then go to the grqph if necessary to retrieve the schedule
 *
 * @param {String} tour pro tour, PGA is only valid one at this point
 * @param {Number} year year to get schedule and event info
 * @param {Object} pageCache (optional) cache object for pages
 */
const PgaTourSchedule = function (tour, year, pageCache) {
  if (!pageCache) {
    const defaultCacheMs = 1000 * 60 * 60 * 24; // 1 day cache for schedule
    console.log(
      "No schedule cache provided, defaulting to " +
        defaultCacheMs / (1000 * 60 * 60) +
        " hours."
    );

    pageCache = new Cache(defaultCacheMs);
  }

  const archive = new ArchiveSchedule(tour, year, pageCache);

  /**
   * check cache, archive, and finally the graph for the schedule
   */
  this.get = async function () {
    const scheduleData = new ScheduleData(tour, year);

    // look in the archive first, then go to web if necessary
    const tournament_data = await archive.get().catch(() => {
      console.log("no schedule archive item found for year " + year);
      return undefined;
    });

    if (tournament_data) {
      // need to post process golf channel data before
      // returning it
      const records = scheduleData.normalize(tournament_data);

      return records;
    } else {
      console.log("no archive/cache item found, going to graph for schedule");

      const tournament_data = await this.getLive().catch((e) => {
        throw e;
      });

      const records = scheduleData.normalize(tournament_data);

      if (records) {
        // if we parsed the data correctly,
        // save it in the cache for next time
        const id = archive.getId();
        pageCache.put(id, tournament_data);
      }

      return records;
    }
  };

  // internal helper.  the schedule from the graph doesn't include course details
  // that requires another call for each tour stop in the schedule.  handle that
  const addCourseDetails = async function (tournaments) {
    const results = [];

    for (let i = 0; i < tournaments.length; i++) {
      const month = { ...tournaments[i] };
      const resultTournaments = [];

      for (let j = 0; j < month?.tournaments.length; j++) {
        const tournament = { ...month?.tournaments[j] };
        // console.log("tournament:", tournament);

        const id = tournament?.id;
        const courseDetails = await qlGetCourseDetails(id);
        // console.log("courseDetails:", courseDetails.tournamentRecap);

        tournament.tournamentRecap = courseDetails?.tournamentRecap;

        console.log("tournament: ", tournament);
        resultTournaments.push(tournament);
      }

      month.tournaments = resultTournaments;
      results.push(month);
    }

    return results;
  };

  /**
   * go directly to the graph to get the schedule for the given year
   */
  this.getLive = async function () {
    console.log("going to graph for schedule");

    const tournament_data = await qlGetSchedule(tour, year);
    // console.log(tournament_data);

    // returned schedule is broken up into completed vs. upcoming lists
    // grab the course details for each tournament

    if (tournament_data?.schedule?.completed) {
      const completed = tournament_data.schedule.completed;

      tournament_data.schedule.completed = await addCourseDetails(completed);
      // console.log("results.completed:", completed);
    }
    if (tournament_data?.schedule?.upcoming) {
      const upcoming = tournament_data.schedule.upcoming;

      tournament_data.schedule.upcoming = await addCourseDetails(upcoming);
      // console.log("results.upcoming:", upcoming);
    }

    return tournament_data;
  };

  /**
   * check if we've archived this season already
   * Promise resolves if true, rejects otherwise
   */
  this.isArchived = async function () {
    return await archive.exists();
  };

  /**
   * go get schedule from the web and put it in the archive
   */
  this.archive = async function () {
    const scheduleData = new ScheduleData(tour, year);

    // go get it from the web and store result
    const tournament_data = await this.getLive().catch(() => {
      return undefined;
    });

    if (tournament_data) {
      // make sure the schedule is valid by parsing it first
      const records = scheduleData.normalize(tournament_data);

      if (records) {
        const result = await archive.put(tournament_data).catch((e) => {
          throw e;
        });

        return result;
      } else {
        throw new Error("archiveSchedule failed! Invalid schedule data!");
      }
    }
  };
};

module.exports = PgaTourSchedule;

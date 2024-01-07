const ScheduleData = require("./scheduledata.js");
const Cache = require("../utils/cache.js");
const PgaTourArchive = require("./pgatourarchive.js");
const EventData = require("./eventdata.js");
const qlGetSchedule = require("./graphql/schedule.js");
const qlGetCourseDetails = require("./graphql/coursedetails.js");
const glLeaderboard = require("./graphql/leaderboard.js");
const qlGetPlayerDetails = require("./graphql/playerdetails.js");

/**
 * handle current year pga tour requests.  Will check the archive first
 * and then go to the grqph if necessary to retrieve the event or schedule
 *
 * @param {String} tour pro tour, PGA is only valid one at this point
 * @param {Number} year year to get schedule and event info
 * @param {Object} pageCache (optional) cache object for pages
 */
const PgaTourMain = function (tour, year, pageCache) {
  if (!pageCache) {
    const defaultCacheMs = 10000;
    console.log(
      "No cache provided, defaulting to " + defaultCacheMs / 1000 + "s."
    );

    pageCache = new Cache(defaultCacheMs);
  }

  const archive = new PgaTourArchive(tour, year, pageCache);

  /**
   * check cache, archive, and finally the graph for the schedule
   */
  this.getSchedule = async function () {
    const scheduleData = new ScheduleData(tour, year);

    // look in the archive first, then go to web if necessary
    const tournament_data = await archive.getSchedule().catch(() => {
      console.log("no archive item found");
      return undefined;
    });

    if (tournament_data) {
      // need to post process golf channel data before
      // returning it
      const records = scheduleData.normalize(tournament_data);

      return records;
    } else {
      console.log("no archive/cache item found, going to web");

      const tournament_data = await this.getScheduleLive().catch((e) => {
        throw e;
      });

      const records = scheduleData.normalize(tournament_data);

      if (records) {
        // if we parsed the data correctly,
        // save it in the cache for next time
        const id = archive.getScheduleId();
        pageCache.put(id, tournament_data);
      }

      return records;
    }
  };

  const getTournamentOverview = function (results, eventid) {
    if (!results) {
      const str = "getSchedule() failed!";
      console.log(str);
      return undefined;
    }

    const scheduleData = new ScheduleData(tour, year);
    const record = scheduleData.findEvent(results, eventid);

    return record;
  };

  /**
   * check cache, archive, and finally the graph for this event
   */
  this.getEvent = async function (eventid, includeDetails) {
    const results = await this.getSchedule().catch((e) => {
      return undefined;
    });

    const eventDetails = getTournamentOverview(results, eventid);
    if (eventDetails == undefined) {
      throw new Error("Error retrieving schedule details for event " + eventid);
    }

    console.log(
      "found id " + eventDetails.tournament.id + " for event " + eventid
    );

    const eventData = new EventData(includeDetails);

    // look in the archive first, then go to web if necessary
    const tournament_data = await archive
      .getEvent(eventid, includeDetails)
      .catch(() => {
        return undefined;
      });

    if (tournament_data) {
      // need to post process data before returning it
      const records = eventData.normalize(tournament_data, eventDetails);

      return records;
    } else {
      const id = archive.getEventId(eventid);

      console.log("no archive item found, going to web");
      const tournament_data = await this.getEventLive(eventid).catch((e) => {
        throw e;
      });

      // need to post process data before returning it
      const records = eventData.normalize(tournament_data, eventDetails);

      if (records) {
        // if we parsed the data correctly,
        // save it in the cache for next time
        pageCache.put(id, tournament_data);
      }
      return records;
    }
  };

  /**
   * go directly to the graph to get the given event
   */
  this.getEventLive = async function (eventid) {
    // call the graph to get the leaderboard data
    const results = await glLeaderboard(eventid);
    // console.log(JSON.stringify(results, null, 2));

    const leaderboard = results.leaderboardV2;
    for (const player of leaderboard.players) {
      const playerId = player.id;
      const details = await qlGetPlayerDetails(eventid, playerId);
      player.details = details;
    }

    return results;
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
  this.getScheduleLive = async function () {
    console.log("going to graph for schedule");
    const scheduleData = new ScheduleData(tour, year);

    const tournament_data = await qlGetSchedule(tour, year);
    console.log(tournament_data);

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
   * check if we've archived the event previously
   * Promise resolves if true, rejects otherwise
   */
  this.isEventArchived = function (eventid) {
    return archive.isEventArchived(eventid);
  };

  /**
   * check if we've archived this season already
   * Promise resolves if true, rejects otherwise
   */
  this.isScheduleArchived = function () {
    return archive.isScheduleArchived();
  };

  /**
   * go get event from the web and put it in the archive
   */
  this.archiveEvent = async function (eventid) {
    const eventData = new EventData(false);

    // go get content from the web and store result
    const tournament_data = await this.getEventLive(eventid).catch((e) => {
      throw e;
    });

    if (eventData.isValid(tournament_data)) {
      const result = await archive
        .putEvent(eventid, tournament_data)
        .catch((e) => {
          throw e;
        });

      return result;
    } else {
      throw new Error("archiveEvent failed: invalid tournament_data found");
    }
  };

  /**
   * go get schedule from the web and put it in the archive
   */
  this.archiveSchedule = async function () {
    const scheduleData = new ScheduleData(tour, year);

    // go get it from the web and store result
    const tournament_data = await this.getScheduleLive().catch(() => {
      return undefined;
    });

    if (tournament_data) {
      // make sure the schedule is valid by parsing it first
      const records = scheduleData.normalize(tournament_data);

      if (records) {
        const result = await archive.putSchedule(tournament_data).catch((e) => {
          throw e;
        });

        return result;
      } else {
        throw new Error("archiveSchedule failed! Invalid schedule data!");
      }
    }
  };
};

module.exports = PgaTourMain;

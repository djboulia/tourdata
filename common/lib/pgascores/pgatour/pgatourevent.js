const ScheduleData = require("./scheduledata.js");
const Cache = require("../utils/cache.js");
const ArchiveEvent = require("./archive/archiveevent.js");
const EventData = require("./eventdata.js");
const glLeaderboard = require("./graphql/leaderboard.js");
const qlLeaderboardHoleByHole = require("./graphql/leaderboardholebyhole.js");

/**
 * handle current year pga tour event requests.  Will check the archive first
 * and then go to the grqph if necessary to retrieve the event
 *
 * @param {String} tour pro tour, PGA is only valid one at this point
 * @param {Number} year year to get schedule and event info
 * @param {Object} pageCache (optional) cache object for pages
 */
const PgaTourEvent = function (tour, year, schedule, pageCache) {
  if (!pageCache) {
    const defaultCacheMs = 10000;
    console.log(
      "No event cache provided, defaulting to " + defaultCacheMs / 1000 + "s."
    );

    pageCache = new Cache(defaultCacheMs);
  }

  const archive = new ArchiveEvent(tour, year, pageCache);

  const getTournamentOverview = function (tourSchedule, eventid) {
    if (!tourSchedule) {
      const str = "getSchedule() failed!";
      console.log(str);
      return undefined;
    }

    const scheduleData = new ScheduleData(tour, year);
    const tourStop = scheduleData.findEvent(tourSchedule, eventid);

    return tourStop;
  };

  /**
   * check cache, archive, and finally the graph for this event
   */
  this.get = async function (eventid, includeDetails) {
    const tourSchedule = await schedule.get().catch(() => {
      return undefined;
    });

    const eventDetails = getTournamentOverview(tourSchedule, eventid);
    if (eventDetails == undefined) {
      throw new Error("Error retrieving schedule details for event " + eventid);
    }

    console.log(
      "found id " + eventDetails.tournament.id + " for event " + eventid
    );

    const eventData = new EventData(includeDetails);

    // look in the archive first, then go to web if necessary
    const tournament_data = await archive
      .get(eventid, includeDetails)
      .catch(() => {
        return undefined;
      });

    if (tournament_data) {
      // need to post process data before returning it
      const records = eventData.normalize(tournament_data, eventDetails);

      return records;
    } else {
      const id = archive.getId(eventid);

      console.log("no archive item found, going to graph for event " + eventid);
      const tournament_data = await this.getLive(eventid).catch((e) => {
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
  this.getLive = async function (tournamentId) {
    // call the graph to get the leaderboard data
    const results = await glLeaderboard(tournamentId);
    // console.log(JSON.stringify(results, null, 2));

    const leaderboard = results.leaderboardV2;
    const rounds = [];

    rounds.push(await qlLeaderboardHoleByHole(tournamentId, 1));
    rounds.push(await qlLeaderboardHoleByHole(tournamentId, 2));
    rounds.push(await qlLeaderboardHoleByHole(tournamentId, 3));
    rounds.push(await qlLeaderboardHoleByHole(tournamentId, 4));
    leaderboard.rounds = rounds;

    return results;
  };

  /**
   * check if we've archived the event previously
   * Promise resolves if true, rejects otherwise
   */
  this.isArchived = async function (eventid) {
    return await archive.exists(eventid);
  };

  /**
   * go get event from the web and put it in the archive
   */
  this.archive = async function (eventid) {
    const eventData = new EventData(false);

    // go get content from the web and store result
    const tournament_data = await this.getLive(eventid).catch((e) => {
      throw e;
    });

    if (eventData.isValid(tournament_data)) {
      const result = await archive.put(eventid, tournament_data).catch((e) => {
        throw e;
      });

      return result;
    } else {
      throw new Error("archiveEvent failed: invalid tournament_data found");
    }
  };
};

module.exports = PgaTourEvent;

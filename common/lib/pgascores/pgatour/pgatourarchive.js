const ScheduleData = require("./scheduledata.js");
// const EventData = require("./eventdata.js");
const Cache = require("../utils/cache.js");
const Storage = require("../utils/jsonstorages3.js");
const Config = require("../utils/config.js");

const config = new Config();
const archive = new Storage(
  config.getStorageConfig(),
  config.archive.getPGATourBucket()
);

/**
 * get prior years Golf Channel data from the archive
 *
 * @param {String} tour pro tour, PGA is only valid one at this point
 * @param {Number} year year to get schedule and event info
 * @param {Object} pageCache (optional) cache object for pages
 */
const PgaTourArchive = function (tour, year, pageCache) {
  if (!pageCache) {
    const defaultCacheMs = 10000;
    console.log(
      "No cache provided, defaulting to " + defaultCacheMs / 1000 + "s."
    );

    pageCache = new Cache(defaultCacheMs);
  }

  this.getEventId = function (eventid) {
    // create a unique id we can use for caching and for
    // searching the archives
    const id = config.archive.getTourEventId(year, tour, eventid);
    return id;
  };

  this.getScheduleId = function () {
    // create a unique id we can use for caching and for
    // searching the archives
    const id = config.archive.getTourScheduleId(year, tour);
    return id;
  };

  /**
   * get the given key from the archive, checking cache and
   * adding to the cache as appropriate.
   *
   * @param {string} id key to look for
   * @returns {object} data from the archive or null if not found
   */
  const getArchiveItem = async function (id) {
    // check cache first, return that if we have it already
    const tournament_data = pageCache.get(id);
    if (tournament_data) {
      return tournament_data;
    }

    // not cached, go to the archives
    const result = await archive.exists(id).catch((e) => {
      throw e;
    });

    if (result) {
      console.log("found item in archive!");

      const tournament_data = await archive.get(id).catch((e) => {
        throw e;
      });

      if (tournament_data) {
        // save it in the cache for next time
        pageCache.put(id, tournament_data);
      }

      return tournament_data;
    } else {
      // no archive found, return null as the result
      const str = "no archive item found!";
      console.log(str);
      return null;
    }
  };

  /**
   * go get the tournament data
   * check cache, then archive
   *
   */
  this.getEvent = async function (eventid, details) {
    const id = this.getEventId(eventid);

    return await getArchiveItem(id);
  };

  /**
   * check cache, then archive
   */
  this.getSchedule = async function () {
    const id = this.getScheduleId();

    return await getArchiveItem(id);
  };

  /**
   * store the event info in the archive
   */
  this.putEvent = async function (eventid, tournament_data) {
    const id = this.getEventId(eventid);
    const eventData = new EventData(true);

    console.log("Archiving event " + id);

    // go get content from the web and store result
    await archive.put(id, tournament_data).catch((e) => {
      const str = "archiveEvent: Error! " + JSON.stringify(e);
      console.log(str);
      throw e;
    });

    console.log("archived event " + id);

    // need to post process golf channel data before
    // returning it
    return eventData.isValid(tournament_data);
  };

  /**
   * store the schedule info in the archive
   */
  this.putSchedule = async function (tournament_data) {
    const id = this.getScheduleId();
    const scheduleData = new ScheduleData(tour, year);

    // store result
    await archive.put(id, tournament_data).catch((e) => {
      const str = "archiveEvent: Error! " + JSON.stringify(e);
      console.error(str);
      throw e;
    });

    console.log("stored key " + id);

    // need to post process golf channel data before
    // returning it
    var records = scheduleData.normalize(tournament_data);
    return records;
  };

  const isArchived = async function (id) {
    // go to the archives next
    const result = await archive.exists(id).catch((e) => {
      throw e;
    });

    if (result) {
      return true;
    } else {
      return false;
    }
  };

  /**
   * check if we've archived the event previously
   * resolves to true if it exists, false otherwise
   */
  this.isEventArchived = async function (eventid) {
    const id = this.getEventId(eventid);

    return await isArchived(id);
  };

  /**
   * check if we've archived this season already
   * resolves to true if it exists, false otherwise
   */
  this.isScheduleArchived = async function () {
    const id = this.getScheduleId();

    return await isArchived(id);
  };
};

module.exports = PgaTourArchive;

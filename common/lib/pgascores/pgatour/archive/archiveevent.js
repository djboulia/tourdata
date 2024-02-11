const ArchiveCache = require("./archivecache.js");
const EventData = require("../eventdata.js");
const Cache = require("../../utils/cache.js");
const Storage = require("../../utils/jsonstorages3.js");
const Config = require("../../utils/config.js");

const config = new Config();
const archive = new Storage(
  config.getStorageConfig(),
  config.archive.getPGATourBucket()
);

/**
 * get prior years data from the archive
 *
 * @param {String} tour pro tour, PGA is only valid one at this point
 * @param {Number} year year to get schedule and event info
 * @param {Object} pageCache (optional) cache object for pages
 */
const ArchiveEvent = function (tour, year, pageCache) {
  if (!pageCache) {
    const defaultCacheMs = 10000;
    console.log(
      "No cache provided, defaulting to " + defaultCacheMs / 1000 + "s."
    );

    pageCache = new Cache(defaultCacheMs);
  }

  this.getId = function (eventid) {
    // create a unique id we can use for caching and for
    // searching the archives
    const id = config.archive.getTourEventId(year, tour, eventid);
    return id;
  };

  /**
   * go get the tournament data check cache, then archive
   */
  this.get = async function (eventid, details) {
    const id = this.getId(eventid);

    return await ArchiveCache.get(id, archive, pageCache);
  };

  /**
   * store the event info in the archive
   */
  this.put = async function (eventid, tournament_data) {
    const id = this.getId(eventid);
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
   * check if we've archived the event previously
   * resolves to true if it exists, false otherwise
   */
  this.exists = async function (eventid) {
    const id = this.getId(eventid);

    return await ArchiveCache.exists(id, archive);
  };
};

module.exports = ArchiveEvent;

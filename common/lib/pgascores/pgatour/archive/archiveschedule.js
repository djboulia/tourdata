const ArchiveCache = require("./archivecache.js");
const ScheduleData = require("../scheduledata.js");
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
const ArchiveSchedule = function (tour, year, pageCache) {
  if (!pageCache) {
    const defaultCacheMs = 10000;
    console.log(
      "No cache provided, defaulting to " + defaultCacheMs / 1000 + "s."
    );

    pageCache = new Cache(defaultCacheMs);
  }

  this.getId = function () {
    // create a unique id we can use for caching and for
    // searching the archives
    const id = config.archive.getTourScheduleId(year, tour);
    return id;
  };

  /**
   * check cache, then archive
   */
  this.get = async function () {
    const id = this.getId();

    console.log("looking in archive for " + id);
    console.log("about to call ", ArchiveCache.get);

    return await ArchiveCache.get(id, archive, pageCache);
  };

  /**
   * store the schedule info in the archive
   */
  this.put = async function (tournament_data) {
    const id = this.getId();
    const scheduleData = new ScheduleData(tour, year);

    // store result
    await archive.put(id, tournament_data).catch((e) => {
      const str = "archiveEvent: Error! " + JSON.stringify(e);
      console.error(str);
      throw e;
    });

    console.log("stored key " + id);

    // need to post process data before returning it
    var records = scheduleData.normalize(tournament_data);
    return records;
  };

  /**
   * check if we've archived this season already
   * resolves to true if it exists, false otherwise
   */
  this.exists = async function () {
    const id = this.getId();

    return await ArchiveCache.exists(id, archive);
  };
};

module.exports = ArchiveSchedule;

var ScheduleData = require('./scheduledata.js');
var EventData = require('./eventdata2019.js');
var Cache = require('../utils/cache.js');
var Storage = require('../utils/storage.js');
var Config = require('../utils/config.js');

var config = new Config();
var archive = new Storage(config.archive.getGolfChannelBucket());

/**
 * handle 2019 golf channel requests.  the format of the Golf Channel
 * site changed (yet again) in 2020, so this serves as the way to get
 * past results from the object storage archive.
 * 
 * encapsulate the basic golf channel tour data (schedule and events)
 * in an object. Implements an in-memory cache which will 
 * be checked first.  If no cache hit, then we will look
 * to see if we've archived it.
 * 
 * @param {String} tour pro tour, PGA is only valid one at this point
 * @param {Number} year year to get schedule and event info
 * @param {Object} pageCache (optional) cache object for pages
 */
var GolfChannel2019 = function (tour, year, pageCache) {

    if (!pageCache) {
        const defaultCacheMs = 10000;
        console.log("No cache provided, defaulting to " + defaultCacheMs / 1000 + "s.");

        pageCache = new Cache(defaultCacheMs);
    }

    this.getEventId = function (eventid) {
        // create a unique id we can use for caching and for 
        // searching the archives
        const id = config.archive.getTourEventId(year, tour, eventid);
        return id;
    }

    this.getScheduleId = function () {
        // create a unique id we can use for caching and for 
        // searching the archives
        const id = config.archive.getTourScheduleId(year, tour);
        return id;
    }

    /**
     * go get the tournament data
     * check cache, archive, and finally the URL
     */
    this.getEvent = function (eventid, details) {
        return new Promise((resolve, reject) => {
            const id = this.getEventId(eventid);
            const eventData = new EventData(details);

            // check cache first, return that if we have it already
            const tournament_data = pageCache.get(id);
            if (tournament_data) {
                // need to post process golf channel data before
                // returning it
                const records = eventData.normalize(tournament_data);
                resolve(records);
                return;
            }

            // not cached, go to the archives
            archive.exists(id)
                .then((result) => {
                    if (result) {
                        console.log("found item in archive!");

                        archive.get(id)
                            .then((tournament_data) => {
                                if (tournament_data) {
                                    // save it in the cache for next time
                                    pageCache.put(id, tournament_data);
                                }

                                // need to post process golf channel data before
                                // returning it
                                const records = eventData.normalize(tournament_data);
                                resolve(records);
                            })
                            .catch((e) => {
                                reject(e);
                            });
                    } else {
                        // no archive found, return null as the result
                        const str = "no archive item found!";
                        console.log(str);
                        resolve(null);
                    }
                })
                .catch((e) => {
                    reject(e);
                });
        });
    };

    /**
     * check cache, archive, and finally the URL
     */
    this.getSchedule = function () {
        return new Promise((resolve, reject) => {
            const scheduleData = new ScheduleData(tour, year);
            const id = this.getScheduleId();

            // check cache first, return that if we have it already
            const tournament_data = pageCache.get(id);
            if (tournament_data) {
                // need to post process golf channel data before
                // returning it
                const records = scheduleData.normalize(tournament_data);
                resolve(records);
                return;
            }

            // no cache, go to the archives
            archive.exists(id)
                .then((result) => {
                    if (result) {
                        console.log("found item in archive!");

                        archive.get(id)
                            .then((tournament_data) => {
                                if (tournament_data) {
                                    // save it in the cache for next time
                                    pageCache.put(id, tournament_data);
                                }

                                // need to post process golf channel data before
                                // returning it
                                const records = scheduleData.normalize(tournament_data);
                                resolve(records);
                            })
                            .catch((e) => {
                                reject(e);
                            });
                    } else {
                        // no archive found, return null as the result
                        const str = "no archive item found!";
                        console.log(str);
                        resolve(null);
                    }
                })
                .catch((e) => {
                    reject(e);
                });
        });
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

}

module.exports = GolfChannel2019;
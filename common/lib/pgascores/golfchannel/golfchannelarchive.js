var ScheduleData = require('./scheduledata.js');
var EventData = require('./eventdata.js');
var Cache = require('../utils/cache.js');
var Storage = require('../utils/jsonstorages3.js');
var Config = require('../utils/config.js');

var config = new Config();
var archive = new Storage(config.getStorageConfig(), config.archive.getGolfChannelBucket());

/**
 * get prior years Golf Channel data from the archive
 * 
 * @param {String} tour pro tour, PGA is only valid one at this point
 * @param {Number} year year to get schedule and event info
 * @param {Object} pageCache (optional) cache object for pages
 */
var GolfChannelArchive = function (tour, year, pageCache) {
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
     * check cache, then archive
     * 
     * [djb 06/08/2020] stop post processing the archive data
     *                  return the raw info
     */
    this.getEvent = function (eventid, details) {
        return new Promise((resolve, reject) => {
            const id = this.getEventId(eventid);
            const eventData = new EventData(details);

            // check cache first, return that if we have it already
            const tournament_data = pageCache.get(id);
            if (tournament_data) {
                resolve(tournament_data);
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

                                resolve(tournament_data);
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
     * check cache, then archive
     */
    this.getSchedule = function () {
        return new Promise((resolve, reject) => {
            const scheduleData = new ScheduleData(tour, year);
            const id = this.getScheduleId();

            // check cache first, return that if we have it already
            const tournament_data = pageCache.get(id);
            if (tournament_data) {
                resolve(tournament_data);
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

                                resolve(tournament_data);
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
     * store the event info in the archive
     */
    this.putEvent = function (eventid, tournament_data) {
        return new Promise((resolve, reject) => {
            const id = this.getEventId(eventid);
            const eventData = new EventData(true);

            console.log("Archiving event " + id);

            // go get content from the web and store result
            archive.put(id, tournament_data)
                .then((result) => {
                    console.log("archived event " + id);

                    // need to post process golf channel data before
                    // returning it
                    resolve(eventData.isValid(tournament_data));
                })
                .catch((e) => {
                    const str = "archiveEvent: Error! " + JSON.stringify(e);
                    console.log(str);
                    reject(str);
                });
        });
    };

    /**
     * store the schedule info in the archive
     */
    this.putSchedule = function (tournament_data) {
        return new Promise((resolve, reject) => {
            const id = this.getScheduleId();
            const scheduleData = new ScheduleData(tour, year);

            // store result
            archive.put(id, tournament_data)
                .then((result) => {
                    console.log("stored key " + id);

                    // need to post process golf channel data before
                    // returning it
                    var records = scheduleData.normalize(tournament_data);
                    resolve(records);
                })
                .catch((e) => {
                    const str = "archiveEvent: Error! " + JSON.stringify(e);
                    console.error(str);
                    reject(str);
                });
        });

    };

    /**
     * check if we've archived the event previously
     * resolves to true if it exists, false otherwise
     */
    this.isEventArchived = function (eventid) {
        return new Promise((resolve, reject) => {
            const id = this.getEventId(eventid);

            // go to the archives next
            archive.exists(id)
                .then((result) => {
                    if (result) {
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                }).catch((e) => {
                    reject(e);
                });
        });
    };

    /**
     * check if we've archived this season already
     * resolves to true if it exists, false otherwise
     */
    this.isScheduleArchived = function () {
        return new Promise((resolve, reject) => {
            const id = this.getScheduleId();

            // go to the archives next
            archive.exists(id)
                .then((result) => {
                    if (result) {
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                })
                .catch((e) => {
                    reject(e);
                });
        });

    };
}

module.exports = GolfChannelArchive;
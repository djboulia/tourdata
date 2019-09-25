var ScheduleData = require('./scheduledata.js');
var EventData = require('./eventdata.js');
var Cache = require('../utils/cache.js');
var Storage = require('../utils/storage.js');
var Config = require('../utils/config.js');

var config = new Config();
var golfChannelArchive = new Storage(config.archive.getGolfChannelBucket());

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
        var id = config.archive.getTourEventId(year, tour, eventid);
        return id;
    }

    this.getScheduleId = function () {
        // create a unique id we can use for caching and for 
        // searching the archives
        var id = config.archive.getTourScheduleId(year, tour);
        return id;
    }

    /**
     * go get the tournament data
     * check cache, then archive
     */
    this.getEvent = function (eventid, details, cb) {
        var id = this.getEventId(eventid);
        var eventData = new EventData(details);

        var tournament_data = pageCache.get(id);

        // check cache first, return that if we have it already
        if (tournament_data) {
            process.nextTick(function () {
                // need to post process golf channel data before
                // returning it
                var records = eventData.normalize(tournament_data);
                cb(records);
            });
        } else {
            // go to the archives next
            golfChannelArchive.exists(id)
                .then((result) => {
                    if (result) {
                        console.log("found item in archive!");

                        golfChannelArchive.get(id)
                            .then((tournament_data) => {
                                if (tournament_data) {
                                    // save it in the cache for next time
                                    pageCache.put(id, tournament_data);
                                }

                                // need to post process golf channel data before
                                // returning it
                                var records = eventData.normalize(tournament_data);
                                cb(records);
                            });
                    } else {
                        console.log("no archive item found!");
                        cb(null);
                    }
                });
        }
    };

    /**
     * check cache, then archive
     */
    this.getSchedule = function (cb) {
        const scheduleData = new ScheduleData(tour, year);
        const id = this.getScheduleId();

        var tournament_data = pageCache.get(id);

        // check cache first, return that if we have it already
        if (tournament_data) {
            process.nextTick(function () {
                // need to post process golf channel data before
                // returning it
                var records = scheduleData.normalize(tournament_data);
                cb(records);
            });
        } else {

            // go to the archives next
            golfChannelArchive.exists(id)
                .then((result) => {
                    if (result) {
                        console.log("found item in archive!");

                        golfChannelArchive.get(id)
                            .then((tournament_data) => {
                                if (tournament_data) {
                                    // save it in the cache for next time
                                    pageCache.put(id, tournament_data);
                                }

                                // need to post process golf channel data before
                                // returning it
                                var records = scheduleData.normalize(tournament_data);
                                cb(records);
                            });
                    } else {
                        console.log("no archive item found!");
                        cb(null);
                    }
                });
        }
    };

    /**
     * store the event info in the archive
     */
    this.putEvent = function (eventid, tournament_data, cb) {
        const id = this.getEventId(eventid);
        const eventData = new EventData(true);

        console.log("Archiving event " + id);

        // go get content from the web and store result
        golfChannelArchive.put(id, tournament_data)
            .then((result) => {
                console.log("archived event " + id);

                // need to post process golf channel data before
                // returning it
                var records = eventData.normalize(tournament_data);
                cb(records);
            })
            .catch((e) => {
                console.log("archiveEvent: Error! " + JSON.stringify(e));
                cb(null);
            });
    };

    /**
     * store the schedule info in the archive
     */
    this.putSchedule = function (tournament_data, cb) {
        const id = this.getScheduleId();
        const scheduleData = new ScheduleData(tour, year);

        // go get it from the web and store result
        golfChannelArchive.put(id, tournament_data)
            .then((result) => {
                console.log("stored key " + id);

                // need to post process golf channel data before
                // returning it
                var records = scheduleData.normalize(tournament_data);
                cb(records);
            })
            .catch((e) => {
                console.log("archiveEvent: Error! " + JSON.stringify(e));
                cb(null);
            });

    };

    /**
     * check if we've archived the event previously
     * 
     * @returns true if the schedule exists in the archive, false otherwise
     */
    this.isEventArchived = function (eventid, cb) {
        var id = this.getEventId(eventid);

        // go to the archives next
        golfChannelArchive.exists(id)
            .then((result) => {
                if (result) {
                    cb(true);
                } else {
                    cb(false);
                }
            });

    };

    /**
     * check if we've archived this season already
     * 
     * @returns true if the schedule exists in the archive, false otherwise
     */
    this.isScheduleArchived = function (cb) {
        var id = this.getScheduleId();

        // go to the archives next
        golfChannelArchive.exists(id)
            .then((result) => {
                if (result) {
                    cb(true);
                } else {
                    cb(false);
                }
            });

    };
}

module.exports = GolfChannelArchive;
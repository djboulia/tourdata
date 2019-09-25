var Storage = require('./utils/storage.js');
var Config = require('./utils/config.js');

var config = new Config();
var archive = new Storage(config.archive.getPGATourBucket());

/**
 * get archived pga tour data
 * implements a basic cache to avoid hitting back end storage with
 * repeated calls
 * 
 * @param {String} tour only PGA for now
 * @param {Number} year which year of the tour to retrieve
 * @param {Object} pageCache global cache to store retrieved information
 */
var PGATourArchive = function (tour, year, pageCache) {

    this.getEventId = function (eventid) {
        // create a unique id we can use for caching and for 
        // searching the archives

        var id = config.archive.getTourEventId(year, tour, eventid);
        return id;
    };

    this.getScheduleId = function () {
        // create a unique id we can use for caching and for 
        // searching the archives

        var id = config.archive.getTourScheduleId(year, tour);
        return id;
    };

    this.getEvent = function (eventid, cb) {
        var id = this.getEventId(eventid);

        var records = pageCache.get(id);

        // check cache first, return that if we have it already
        if (records) {
            process.nextTick(function () {
                cb(records);
            });
        } else {

            // go to the archives next
            archive.exists(id)
                .then((result) => {
                    if (result) {
                        console.log("found item in archive!");

                        archive.get(id)
                            .then((records) => {
                                if (records) {
                                    // save it in the cache for next time
                                    pageCache.put(id, records);
                                }

                                cb(records);
                            });
                    } else {
                        console.log("no archive item found!");
                        cb(null);
                    }
                });
        }
    };

    this.getSchedule = function (cb) {
        var id = this.getScheduleId();

        var records = pageCache.get(id);

        // check cache first, return that if we have it already
        if (records) {
            process.nextTick(function () {
                records = records.season;
                cb(records);
            });
        } else {

            // go to the archives next
            archive.exists(id)
                .then((result) => {
                    if (result) {
                        console.log("found item in archive!");

                        archive.get(id)
                            .then((records) => {
                                if (records) {
                                    // save it in the cache for next time
                                    pageCache.put(id, records);
                                }

                                records = records.season;
                                cb(records);
                            });
                    } else {
                        console.log("no archive item found!");
                        cb(null);
                    }
                });
        }
    };
};

module.exports = PGATourArchive;
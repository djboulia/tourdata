var Storage = require('./utils/jsonstorages3.js');
var Config = require('./utils/config.js');

var config = new Config();
var archive = new Storage(config.getStorageConfig(), config.archive.getPGATourBucket());

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

        const id = config.archive.getTourEventId(year, tour, eventid);
        return id;
    };

    this.getScheduleId = function () {
        // create a unique id we can use for caching and for 
        // searching the archives

        const id = config.archive.getTourScheduleId(year, tour);
        return id;
    };

    this.getEvent = function (eventid) {
        return new Promise((resolve, reject) => {
            const id = this.getEventId(eventid);

            // check cache first, return that if we have it already
            const records = pageCache.get(id);

            if (records) {
                resolve(records);
                return;
            }

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

                                resolve(records);
                            })
                            .catch((e) => {
                                reject(e);
                            });            
                    } else {
                        console.log("no archive item found!");
                        resolve(null);
                    }
                })
                .catch((e) => {
                    reject(e);
                });
        });
    };

    this.getSchedule = function () {
        return new Promise((resolve, reject) => {
            const id = this.getScheduleId();

            // check cache first, return that if we have it already
            const records = pageCache.get(id);

            if (records) {
                records = records.season;
                resolve(records);
                return;
            }

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
                                resolve(records);
                            })
                            .catch((e) => {
                                reject(e);
                            });
                    } else {
                        console.log("no archive item found!");
                        resolve(null);
                    }
                })
                .catch((e) => {
                    reject(e);
                });
        });
    };
};

module.exports = PGATourArchive;
var CacheModule = require('./utils/cache.js');
var Storage = require('./utils/storage.js');
var Config = require('./utils/config.js');

var config = new Config();
var archive = new Storage(config.archive.getWorldRankingsBucket());

// 
// get archived world rankings data
// implements a basic cache to avoid hitting back end storage with
// repeated calls
//
var PGAWorldRankingsArchive = function (timeMs) {
    var pageCache = new CacheModule.Cache(timeMs);

    this.get = function (year, cb) {
        var id = config.archive.getWorldRankingsId(year);

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

    }
}

module.exports = PGAWorldRankingsArchive;
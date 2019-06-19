var Cache = require('./utils/cache.js');
var Storage = require('./utils/storage.js');
var Config = require('./utils/config.js');

var config = new Config();
var archive = new Storage(config.archive.getPGATourBucket());

// 
// get archived pga tour data
// implements a basic cache to avoid hitting back end storage with
// repeated calls
//
var PGATourArchive = function (timeMs) {
    var pageCache = new Cache(timeMs);

    this.get = function (request, cb) {
        var id = request.getId();

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

module.exports = PGATourArchive;
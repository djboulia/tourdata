var Storage = require('./utils/jsonstorages3.js');
var Config = require('./utils/config.js');

var config = new Config();
var archive = new Storage(config.getStorageConfig(), config.archive.getWorldRankingsBucket());

// 
// get archived world rankings data
// implements a basic cache to avoid hitting back end storage with
// repeated calls
//
var PGAWorldRankingsArchive = function (year) {

    this.getId = function () {
        var id = config.archive.getWorldRankingsId(year);

        return id;
    };

    this.exists = function (cb) {
        var id = this.getId();

        // go to the archives next
        archive.exists(id)
            .then((result) => {
                cb(result);
            })
            .catch((e) => {
                console.log("error querying item " + id);
                cb(null);
            });
    };

    this.get = function (cb) {
        var id = this.getId();

        // go to the archives next
        archive.exists(id)
            .then((result) => {
                if (result) {
                    console.log("found item in archive!");

                    archive.get(id)
                        .then((records) => {
                            cb(records);
                        });
                } else {
                    console.log("no archive item found!");
                    cb(null);
                }
            });
    };

    this.put = function (records, cb) {
        var id = this.getId();

        // go to the archives next
        archive.put(id, records)
            .then((result) => {
                console.log("stored item with id " + id + " in archive!");
                cb(result);
            })
            .catch((e) => {
                console.log("error storing item!");
                cb(null);
            });

    }
}

module.exports = PGAWorldRankingsArchive;
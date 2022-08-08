//
// access config data in loop back server/config.local.json
//

var Config = function () {
    // get config info stored in loopback server/config.local.json
    var app = require('../../../../server/server');

    this.get = function (key) {

        var obj = app.get(key);
        return obj;
    };

    this.getStorageConfig = function () {
        var storageConfig = this.get('storageConfig');
    
        if (!storageConfig) {
            console.log("ERROR! no storage configuration found!");
        } else {
            console.log("Found storage config: ", storageConfig);
        }
    
        return storageConfig;
    };

    // archive config data here
    this.archive = {
        getWorldRankingsBucket: function () {
            return 'tourdata-rankings-pga';
        },
        getGolfChannelBucket: function() {
            return 'tourdata-gc-pga';
        },
        getPGATourBucket: function() {
            return 'tourdata-pgatour-pga';
        },
        getWorldRankingsId: function (year) {
            return year + "-pga-tour-rankings";
        },
        getTourScheduleId: function (year, tour) {
            return year + "-" + tour + "-schedule";
        },
        getTourEventId: function(year, tour, eventid) {
            return year + "-" + tour + "-schedule-event-" + eventid;
        }
    };
};

module.exports = Config;
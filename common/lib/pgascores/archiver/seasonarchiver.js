//
// attempt to archive the given season by going to the golf channel site
// for any prior tournaments in the year that have not yet been archived
//

var GolfChannel = require('../golfchannel/golfchannelcurrent.js');

//
// compare just the year/month/day and return true if the date
// is the current date or earlier
//
var inThePast = function (date) {
    var now = new Date();

    if (date.getFullYear() < now.getFullYear()) {
        return true;
    } else if (date.getFullYear() > now.getFullYear()) {
        return false;
    }

    if (date.getMonth() < now.getMonth()) {
        return true;
    } else if (date.getMonth() > now.getMonth()) {
        return false;
    }

    if (date.getDate() < now.getDate()) {
        return true;
    } else if (date.getDate() > now.getDate()) {
        return false;
    }

    // date is today if we get here... we do NOT consider that in the past
    return false;
};

var isTournamentComplete = function (tourStop) {
    var endDate = new Date(tourStop.endDate);

    var complete = inThePast(endDate);

    console.log("Tournament end date: " + tourStop.endDate + ", complete=" + complete);

    return complete;
};

var archiveEventIfNecessary = function (golfChannel, eventid) {
    return new Promise((resolve, reject) => {

        golfChannel.isEventArchived(eventid, function (result) {
            if (result) {
                // already in the cache, don't need to do anything
                // console.log("Found entry for event " + id + "!");

                resolve(false); // already in the cache, no archive necessary
            } else {
                golfChannel.archiveEvent(eventid, function (results) {
                    resolve(results != null);
                });
            }
        })
    });
};

var archiveSeason = function (golfChannel, results) {
    return new Promise((resolve, reject) => {
        var promises = [];

        // use schedule to start rolling through the season
        for (var eventid = 0; eventid < results.length; eventid++) {
            var result = results[eventid];

            // if the tournament is complete, see if we have it in archive
            if (isTournamentComplete(result)) {
                promises.push(archiveEventIfNecessary(golfChannel, eventid));
            } else {
                console.log("Tournament " + eventid + " has end date " + result.endDate + ". Skipping");
            }
        };

        // wait for all of the promises to complete
        Promise.all(promises)
            .then((values) => {
                resolve(values);
            })
            .catch((e) => {
                reject(e);
            });
    });
}

var SeasonArchiver = function (tour) {
    this.archive = function (year) {

        // attempt to get the schedule from the archive
        var golfChannel = new GolfChannel(tour, year);

        var now = new Date();
        console.log("Beginning season archive at " + now.toString());

        golfChannel.isScheduleArchived(function (result) {
            if (result) {
                console.log("Found entry for year " + year + "!");

                golfChannel.getSchedule(function (records) {
                    if (records) {

                        // now parse through the rest of the schedule
                        archiveSeason(golfChannel, records);
                    }
                });
            } else {
                console.log("No archive for year " + year);

                // didn't find it in the archive, archive it
                golfChannel.archiveSchedule(function (records) {

                    // now parse through the rest of the schedule
                    archiveSeason(golfChannel, records);

                });
            }
        });
    }
};

module.exports = SeasonArchiver;
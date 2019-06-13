//
// attempt to archive the given season by going to the golf channel site
// for any prior tournaments in the year that have not yet been archived
//

var Storage = require('../utils/storage.js');
var Config = require('../utils/config.js');
var GolfChannelPage = require('../golfchannelpage.js');
var TourSchedule = require('../tourschedule.js');
var TourEvent = require('../tourevent.js');

var config = new Config();
var cos = new Storage(config.archive.getGolfChannelBucket());
var page = new GolfChannelPage();

//
// compare just the year/month/day and return true if the date
// is the current date or earlier
//
var inThePast = function( date ) {
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

var archiveEventIfNecessary = function (tourEvent) {
    return new Promise((resolve, reject) => {
        var id = tourEvent.getId();

        cos.exists(id)
            .then((result) => {
                if (result) {
                    // already in the cache, don't need to do anything
                    // console.log("Found entry for event " + id + "!");

                    resolve(false); // already in the cache, no archive necessary
                } else {
                    console.log("Archiving event " + id);

                    // didn't find it, go get it from the web and store result
                    page.get(tourEvent.getUrl(), function (tournament_data) {
                        if (tournament_data) {
                            cos.put(tourEvent.getId(), tournament_data)
                                .then((result) => {
                                    console.log("stored key " + tourEvent.getId());
                                    resolve(true); // archived
                                })
                                .catch((e) => {
                                    console.log("Error!");
                                    reject(e);
                                });
                        }
                    });
                }
            })
            .catch((e) => {
                console.log("Error archiving event " + id + "!");
                reject(e);
            });
    });
};

var archiveSeason = function (tourSchedule, tournament_data) {
    return new Promise((resolve, reject) => {
        var results = tourSchedule.normalize(tournament_data);
        var promises = [];

        // use schedule to start rolling through the season
        for (var eventid = 0; eventid < results.length; eventid++) {
            var result = results[eventid];
            var tour = result.tournament.tour;
            var year = result.tournament.year
            var gcid = result.tournament.id;

            // if the tournament is complete, see if we have it in archive
            if (isTournamentComplete(result)) {

                var tourEvent = new TourEvent(tour, year, gcid, eventid);

                promises.push(archiveEventIfNecessary(tourEvent));
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
        var tourSchedule = new TourSchedule(tour, year);
        var id = tourSchedule.getId();

        var now = new Date();
        console.log("Beginning season archive at " + now.toString());

        cos.exists(id)
            .then((result) => {
                if (result) {
                    console.log("Found entry for year " + year + "!");

                    cos.get(id)
                        .then((tournament_data) => {
                            if (tournament_data) {

                                // now parse through the rest of the schedule
                                archiveSeason(tourSchedule, tournament_data);
                            }
                        })
                        .catch((e) => {
                            console.log("Error getting tour schedule!");
                        });
                } else {
                    console.log("No archive for year " + year);

                    // didn't find it, go get it from the web and store result
                    page.get(tourSchedule.getUrl(), function (tournament_data) {
                        if (tournament_data) {
                            cos.put(tourSchedule.getId(), tournament_data)
                                .then((result) => {
                                    console.log("stored key " + tourSchedule.getId());

                                    // now parse through the rest of the schedule
                                    archiveSeason(tourSchedule, tournament_data);

                                })
                                .catch((e) => {
                                    console.log("Error!");
                                });
                        }
                    });
                }
            })
            .catch((e) => {
                console.log("Error!");
            });

    };
};

module.exports = SeasonArchiver;
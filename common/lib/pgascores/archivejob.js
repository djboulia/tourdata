//
// we periodically save away the tour data for tournaments into
// cloud storage for prior tournaments that have
// completed.  this avoids hitting the back end Golf Channel site and
// guards against the data disappearing in the future (which happens
// from time to time)
//

var CronJob = require('cron').CronJob;

var Storage = require('./utils/storage.js');
var Config = require('./utils/config.js');
var GolfChannelPage = require('./golfchannelpage.js');
var TourSchedule = require('./tourschedule.js');
var TourEvent = require('./tourevent.js');

var config = new Config();
var cos = new Storage(config.archive.getGolfChannelBucket());
var page = new GolfChannelPage();

var isTournamentComplete = function (tourStop) {
    var now = new Date();
    var endDate = new Date(tourStop.endDate);

    return endDate.getTime() < now.getTime();
};

var archiveEventIfNecessary = function (tourEvent) {
    return new Promise((resolve, reject) => {
        var id = tourEvent.getId();

        cos.exists(id)
            .then((result) => {
                if (result) {
                    // already in the cache, don't need to do anything
                    console.log("Found entry for event " + id + "!");

                    resolve(false); // already in the cache, no archive necessary
                } else {
                    console.log("No archive for event id " + id);

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
                console.log("Attempting archive for eventid " + eventid);

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

var archive = function () {
    var tour = 'pga-tour';
    var year = 2019;

    // attempt to get the schedule from the archive
    var tourSchedule = new TourSchedule(tour, year);
    var id = tourSchedule.getId();

    var now = new Date();
    console.log("Beginning archive at " + now.toString());

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

exports.run = function () {
    // run once at the start
    archive();

    // create a cron job to run the archiver weekly
    // we pick every tuesday at 8am since that will
    // likely be between PGA tour events which typically
    // run from Thu-Sun
    //
    // cron fields are as follows:
    //      Seconds: 0-59
    //      Minutes: 0-59
    //      Hours: 0-23
    //      Day of Month: 1-31
    //      Months: 0-11 (Jan-Dec)
    //      Day of Week: 0-6 (Sun-Sat)

    var croninterval = '0 0 8 * * 2';

    var job = new CronJob(
        croninterval,
        archive, // run this job at the specified interval
        function () {
            /* This function is executed when the job stops */
        },
        true, /* Start the job right now */
        'America/New_York' /* Time zone of this job. */
    );

    job.start();

};
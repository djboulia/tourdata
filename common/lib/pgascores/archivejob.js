/**
 * we periodically save away the tour data for tournaments into
 * cloud storage for prior tournaments that have
 * completed.  this avoids hitting the back end Golf Channel site and
 * guards against the data disappearing in the future (which happens
 * from time to time)
 */

var CronJob = require('cron').CronJob;

var SeasonArchiver = require('./archiver/seasonarchiver.js')
var RankingsArchiver = require('./archiver/rankingsarchiver.js')

var archive = function () {
    const tour = 'pga-tour';
    let year = new Date().getFullYear();

    // try to archive the past events for the current season
    let seasonArchiver = new SeasonArchiver(tour);
    seasonArchiver.archive(year);

    // since the PGA tour actually starts the next year's season in September
    // of the current year, we look for that here
    const SEPTEMBER = 8; // zero based, so month 8 is September

    if (new Date().getMonth() >= SEPTEMBER) { 

        // try to archive the past events for the next season
        seasonArchiver.archive(year+1);
    }

    // try to archive last year's rankings data (if it's not already archived)
    let rankingsArchiver = new RankingsArchiver(tour);
    rankingsArchiver.archive(year - 1);
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
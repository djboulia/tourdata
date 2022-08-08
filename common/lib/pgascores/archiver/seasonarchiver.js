/**
 * attempt to archive the given season by going to the golf channel site
 * for any prior tournaments in the year that have not yet been archived
 */

var GolfChannel = require('../golfchannel/golfchannelcurrent.js');
var ScheduleData = require('../golfchannel/scheduledata.js');

/**
 * compare just the year/month/day and return true if the date
 * is the current date or earlier
 * 
 * @param {Date} date javascript date object
 */
var inThePast = function (date) {
    const now = new Date();

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
    const endDate = new Date(tourStop.endDate);

    const complete = inThePast(endDate);

    console.log("Tournament end date: " + tourStop.endDate + ", complete=" + complete);

    return complete;
};

var archiveEventIfNecessary = function (golfChannel, eventid) {
    return new Promise((resolve, reject) => {

        golfChannel.isEventArchived(eventid)
            .then((result) => {
                if (result) {
                    // already in the archive, don't need to do anything
                    // console.log("Found entry for event " + id + "!");

                    resolve(false);
                } else {
                    // not in the archive, go store it
                    golfChannel.archiveEvent(eventid)
                        .then((results) => {
                            resolve(results != null);
                        })
                        .catch((e) => {
                            reject(e);
                        })
                }
            })
            .catch((e) => {
                reject(e);
            })
    });
};

var archiveSeason = function (tour, year, golfChannel, results) {
    return new Promise((resolve, reject) => {
        const promises = [];

        const scheduleData = new ScheduleData(tour, year);

        // use schedule to start rolling through the season
        for (var i = 0; i < results.length; i++) {
            const result = results[i];
            const eventid = scheduleData.getEventId(results, i);

            // if the tournament is complete, see if we have it in the archive
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

/**
 * Public interface.
 * Archives a given tour season and its completed events 
 * 
 * @param {String} tour type of pro tour. PGA is the only tour currently supported
 */
var SeasonArchiver = function (tour) {

    /**
     * Will check to see if the season and events are currently archived.
     * If not, will then make sure the event has already completed and is 
     * therefore eligible for archiving.
     */
    this.archive = function (year) {

        // attempt to get the schedule from the archive
        const golfChannel = new GolfChannel(tour, year);

        const now = new Date();
        console.log("Beginning season archive at " + now.toString());

        // now attempt to archive any events that are in the past
        golfChannel.getSchedule()
            .then((records) => {
                // we update the schedule in the archive each time we
                // run the season archiver.
                // this will capture any unforeseen schedule changes
                // mid season. this was particularly 
                // relevant during the first COVID year where the season
                // changed due to cancellations and reschedules
                golfChannel.archiveSchedule()
                    .then((result) => {
                        console.log("updated schedule archive for " + year);
                    });

                if (records) {
                    // now parse through the rest of the schedule
                    archiveSeason(tour, year, golfChannel, records);
                }
            })
            .catch((e) => {
                console.error("Couldn't archive schedule for year " + year);
                console.error(e);
            })

    }
};

module.exports = SeasonArchiver;
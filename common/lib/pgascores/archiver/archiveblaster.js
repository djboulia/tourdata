/**
 * utility to load up the cloud object store with prior season data
 * this is used just one for prior years and will overwrite the current
 * contents of the object store.  this comes in handy when the golf
 * channel (inevitably) changes its format and we want to re-load
 * the object store with the new format.
 */

const GolfChannel = require("../golfchannel/golfchannelcurrent.js");
const TournamentDate = require("../utils/tournamentdate.js");

var archiveEvent = function (golfChannel, eventid) {
  return new Promise((resolve, reject) => {
    golfChannel
      .archiveEvent(eventid)
      .then((results) => {
        resolve(results != null);
      })
      .catch((e) => {
        reject(e);
      });
  });
};

var addToChain = function (chain, golfChannel, eventid) {
  chain = chain.then(function () {
    return archiveEvent(golfChannel, eventid);
  });
  return chain;
};

var archiveSeason = function (golfChannel, results) {
  return new Promise((resolve, reject) => {
    let chain = Promise.resolve();

    // use schedule to start rolling through the season
    for (var eventid = 0; eventid < results.length; eventid++) {
      const result = results[eventid];

      // if the tournament is complete, see if we have it in the archive
      if (TournamentDate.isTournamentComplete(result.endDate)) {
        chain = addToChain(chain, golfChannel, eventid);
      } else {
        console.log(
          "Tournament " +
            eventid +
            " has end date " +
            result.endDate +
            ". Skipping"
        );
      }
    }

    chain
      .then(() => {
        console.log("archived season!");
        resolve();
      })
      .catch((e) => {
        reject(e);
      });
  });
};

/**
 * Public interface.
 * Archives a given tour season and its completed events
 *
 * @param {String} tour type of pro tour. PGA is the only tour currently supported
 */
var ArchiveBlaster = function (tour) {
  /**
   * Will check to see if the season and events are currently archived.
   * If not, will then make sure the event has already completed and is
   * therefore eligible for archiving.
   */
  this.archive = function (year) {
    // attempt to get the schedule from the archive
    const golfChannel = new GolfChannel(tour, year);

    const now = new Date();
    console.log("ArchiveBlaster season archive for year " + year);

    // now attempt to archive any events that are in the past
    golfChannel
      .getScheduleFromWeb()
      .then((records) => {
        console.log(
          "ArchiveBlaster - found " + records.length + " records in schedule"
        );

        // we update the schedule in the archive each time we
        // run the season archiver.
        // this will capture any unforeseen schedule changes
        // mid season. this was particularly
        // relevant during the first COVID year where the season
        // changed due to cancellations and reschedules
        golfChannel.archiveSchedule().then((result) => {
          console.log("updated schedule archive for " + year);
        });

        if (records) {
          // now parse through the rest of the schedule
          archiveSeason(golfChannel, records);
        }
      })
      .catch((e) => {
        console.error("Couldn't archive schedule for year " + year);
        console.error(e);
      });
  };
};

module.exports = ArchiveBlaster;

/**
 * attempt to archive the given season by going to the golf channel site
 * for any prior tournaments in the year that have not yet been archived
 */

const PgaTourProvider = require("../pgatour/pgatourmain.js");
const ScheduleData = require("../pgatour/scheduledata.js");
const TournamentDate = require("../utils/tournamentdate.js");

const archiveEventIfNecessary = async function (dataProvider, eventid) {
  const result = await dataProvider.isEventArchived(eventid).catch((e) => {
    throw e;
  });

  if (result) {
    // already in the archive, don't need to do anything
    console.log(`Found entry for event ${eventid}, not archiving!`);
    return false;
  } else {
    return await archiveEvent(dataProvider, eventid);
  }
};

/**
 * update archive regardless of whether it exists
 *
 */
const archiveEvent = async function (dataProvider, eventid) {
  // not in the archive, go store it
  console.log(`archiving event ${eventid}`);
  const results = await dataProvider.archiveEvent(eventid).catch((e) => {
    console.error("Error:" + e);
    return undefined;
  });

  return !!results;
};

const archiveSeason = async function (
  tour,
  year,
  dataProvider,
  results,
  overwrite = false
) {
  const scheduleData = new ScheduleData(tour, year);

  // use schedule to start rolling through the season
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const eventid = scheduleData.getEventId(results, i);

    // if the tournament is complete, see if we have it in the archive
    if (TournamentDate.isTournamentComplete(result.endDate)) {
      // if we're overwriting, then we don't care if it's already in the archive
      if (overwrite) {
        await archiveEvent(dataProvider, eventid);
      } else {
        await archiveEventIfNecessary(dataProvider, eventid);
      }
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
};

/**
 * Public interface.
 * Archives a given tour season and its completed events
 *
 * @param {String} tour type of pro tour. PGA is the only tour currently supported
 */
const SeasonArchiver = function (tour) {
  /**
   * Will check to see if the season and events are currently archived.
   * If not, will then make sure the event has already completed and is
   * therefore eligible for archiving.
   *
   * @param {number} year year of the season to archive
   * @param {Boolean} overwrite if true, will overwrite existing events in the archive
   */
  this.archive = async function (year, overwrite = false) {
    // attempt to get the schedule from the archive
    const dataProvider = new PgaTourProvider(tour, year);

    const now = new Date();
    console.log("Beginning season archive at " + now.toString());

    // we update the schedule in the archive each time we
    // run the season archiver.
    // this will capture any unforeseen schedule changes
    // mid season. this was particularly
    // relevant during the first COVID year where the season
    // changed due to cancellations and reschedules
    const records = await dataProvider.archiveSchedule();
    console.log("updated schedule archive for " + year);

    // if the schedule succeeded, then we can archive the season
    if (records) {
      // now parse through the rest of the schedule
      await archiveSeason(tour, year, dataProvider, records, overwrite);
    }
  };
};

module.exports = SeasonArchiver;

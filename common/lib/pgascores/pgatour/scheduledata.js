/**
 * Methods to manipulate PGA tour schedule data
 *
 * Format details of the schedule coming from golf channel into
 * our standard representation
 */

const ScheduleItemData = require("./scheduleitemdata.js");

const ScheduleData = function (tour, year) {
  // parses an item in the tournament schedule
  const scheduleItemData = new ScheduleItemData(tour, year);

  /**
   * sort the schedule by date and tournament id
   * it's important the order stays the same since the order of
   * this list determines the id used to retrieve the
   * details of each individual tournament
   *
   * @param {Object} a First sort arg
   * @param {Object} b Second sort arg
   */
  const scheduleSort = function (a, b) {
    const aDate = new Date(a.startDate).getTime();
    const bDate = new Date(b.startDate).getTime();

    if (aDate < bDate) {
      return -1;
    } else if (aDate > bDate) {
      return 1;
    } else {
      var aId = a.tournament.id;
      var bId = b.tournament.id;

      if (aId < bId) {
        return -1;
      } else if (aId > bId) {
        return 1;
      } else {
        return 0;
      }
    }
  };

  const addTournamentRecords = function (records, tournaments) {
    for (let i = 0; i < tournaments.length; i++) {
      const month = tournaments[i];
      if (month) {
        for (let j = 0; j < month.tournaments.length; j++) {
          const tournament = month.tournaments[j];
          if (tournament) {
            const record = scheduleItemData.normalize(tournament);
            records.push(record);
          }
        }
      }
    }
  };

  this.normalize = function (rawData) {
    if (!rawData) {
      return null;
    }

    const records = [];

    // data comes in as completed and upcoming tournaments. add
    // those here and sort the result
    const completed = rawData.schedule?.completed;
    if (completed) {
      addTournamentRecords(records, completed);
    }

    const upcoming = rawData.schedule?.upcoming;
    if (upcoming) {
      addTournamentRecords(records, upcoming);
    }

    records.sort(scheduleSort);

    return records;
  };

  /**
   * return the event record corresponding to eventid in the schedule
   *
   * @param {Array} schedule an array of records representing the season schedule
   * @param {String} eventid the eventid for the event to find
   * @returns an event record, undefined if not found
   */
  this.findEvent = function (schedule, eventid) {
    // console.log("schedule: ", schedule);
    for (let i = 0; i < schedule.length; i++) {
      const record = schedule[i];

      if (!record.key) {
        console.log(`error - key parameter is invalid!`);
        return undefined;
      }

      if (eventid.toString() === record.key.toString()) {
        console.log(`found matching event ${eventid}`);
        return record;
      } else {
        console.log(`no match for key ${record.key}`);
      }
    }

    const str = `error!  invalid event id found! eventid: ${eventid} schedule.length: ${schedule.length}`;
    console.log(str);
    return undefined;
  };

  /**
   * return the eventid for this item in the schedule. see method above for why this is
   * more complex than it should be.
   *
   * @param {Array} schedule an array of records representing the season schedule
   * @param {*} index the index of the event in this schedule
   * @returns the eventid for this event in the schedule, undefined if not found
   */
  this.getEventId = function (schedule, index) {
    if (index >= schedule.length) {
      const str =
        "error!  invalid index: " +
        index +
        ", schedule.length: " +
        schedule.length;
      console.log(str);
      return undefined;
    }

    const event = schedule[index];

    // use the event key stored as part of each tournament to
    // uniquely identify the event

    // console.log('formatScheduleResults event: ' , event);
    const key = event.key;
    return key;
  };
};

module.exports = ScheduleData;

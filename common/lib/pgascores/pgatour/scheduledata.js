/**
 * Methods to manipulate PGA tour schedule data
 *
 * Format details of the schedule coming from golf channel into
 * our standard representation
 */

const THREE_DAYS = 1000 * 60 * 60 * 24 * 3;

const ScheduleData = function (tour, year) {
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

  /**
   * return true if course is contained in courses
   *
   * @param {Array} courses
   * @param {String} course
   */
  const isDuplicateCourse = function (courses, course) {
    for (var i = 0; i < courses.length; i++) {
      // console.log("courses[i]=" + courses[i] + ", course=" + course);

      if (courses[i] === course) {
        console.log("found duplicate course " + course);
        return true;
      }
    }

    return false;
  };

  /**
   * Find the names of the courses played for each round
   * Some golf clubs have multiple courses so check for that
   *
   * @param {Array} golfClubs array of country clubs
   */
  const getCourses = function (event) {
    console.log("getCourses event: ", event);
    const courses = event?.tournamentRecap?.courses;

    const result = [];
    for (let i = 0; i < courses.length; i++) {
      const course = courses[i];

      if (!isDuplicateCourse(result, course.name)) {
        result.push(course.name);
      }
    }
    return result;
  };

  const getCourseDetails = function (event) {
    const courses = event?.tournamentRecap?.courses;

    var result = [];

    if (courses) {
      for (let i = 0; i < courses.length; i++) {
        var course = courses[i];

        var record = {
          name: course.name,
          par: course.par,
          yardage: course.yardage,
        };

        result.push(record);
      }
    }

    return {
      name: event.tournamentName,
      start: new Date(event.startDate).toUTCString(),
      end: new Date(event.startDate + THREE_DAYS).toUTCString(),
      purse: event.purse,
      course: result[0],
    };
  };

  /**
   * chop up the web elements to gather details about the tournament
   *
   * @param {Object} event tournament details
   */
  const getTournamentDetails = function (event) {
    var details = {};

    details.name = event.tournamentName;

    details.url = "/tournament/" + event.id;

    details.courses = getCourses(event);
    details.courseDetails = getCourseDetails(event);

    details.tour = tour;
    details.year = year;
    details.id = event.id;

    console.log("found event " + details.name + " and id " + details.id);

    return details;
  };

  const addTournamentRecords = function (records, tournaments) {
    for (let i = 0; i < tournaments.length; i++) {
      const month = tournaments[i];
      if (month) {
        for (let j = 0; j < month.tournaments.length; j++) {
          const tournament = month.tournaments[j];
          if (tournament) {
            const record = {};

            // console.log(JSON.stringify(event));

            record.startDate = new Date(tournament.startDate).toUTCString();
            record.endDate = new Date(
              tournament.startDate + THREE_DAYS
            ).toUTCString();
            record.tournament = getTournamentDetails(tournament);
            record.purse = tournament.purse;
            record.winner = tournament.champion;
            record.key = tournament.id;

            records.push(record);
          }
        }
      }
    }
  };

  /**
   * takes the raw pga tour data and munges it into a common format
   * in the past there have been multiple sources of tour data that have
   * been used.  now we just use the pga tour data, but we still map
   * it to the common format established for the earlier data sources.
   * 
   * The returned data is an array of records, one for each tournament
   * with the following fields:
   *  
      {
        "startDate": "Thu Aug 22 2024 20:00:00 GMT-0400 (Eastern Daylight Time)",
        "endDate": "Sun Aug 25 2024 20:00:00 GMT-0400 (Eastern Daylight Time)",
        "tournament": {
          "name": "BMW Championship",
          "url": "/tournament/R2024028",
          "courses": [
            "Castle Pines Golf Club"
          ],
          "courseDetails": {
            "name": "BMW Championship",
            "start": "Thu Aug 22 2024 20:00:00 GMT-0400 (Eastern Daylight Time)",
            "end": "Sun Aug 25 2024 20:00:00 GMT-0400 (Eastern Daylight Time)",
            "purse": "$20,000,000",
            "course": {
              "name": "Castle Pines Golf Club",
              "par": "-",
              "yardage": "-"
            }
          },
          "tour": "pga",
          "year": 2024,
          "id": "R2024028"
        },
        "purse": "$20,000,000",
        "winner": "Viktor Hovland",
        "key": "R2024028"
      }
   *
   */
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
    console.log("schedule: ", schedule);
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

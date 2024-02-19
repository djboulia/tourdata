/**
 * Methods to manipulate PGA tour schedule data
 *
 * Format details of the schedule coming from golf channel into
 * our standard representation
 */

const THREE_DAYS = 1000 * 60 * 60 * 24 * 3;

const ScheduleItemData = function (tour, year) {
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
    // console.log("getCourses event: ", event);
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
  this.normalize = function (tournament) {
    if (!tournament) return undefined;

    const record = {};

    // console.log(JSON.stringify(event));

    record.startDate = new Date(tournament.startDate).toUTCString();
    record.endDate = new Date(tournament.startDate + THREE_DAYS).toUTCString();
    record.tournament = getTournamentDetails(tournament);
    record.purse = tournament.purse;
    record.winner = tournament.champion;
    record.key = tournament.id;

    return record;
  };
};

module.exports = ScheduleItemData;

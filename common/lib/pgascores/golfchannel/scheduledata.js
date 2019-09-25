/**
 * Format details of the schedule coming from golf channel into 
 * our standard representation
 */

var ScheduleData = function (tour, year) {

    /**
     * sort the schedule by date and tournament id
     * it's important the order stays the same since the order of
     * this list determines the id used to retrieve the
     * details of each individual tournament
     *
     * @param {Object} a First sort arg
     * @param {Object} b Second sort arg
     */
    var scheduleSort = function (a, b) {
        var aDate = new Date(a.startDate).getTime();
        var bDate = new Date(b.startDate).getTime();

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
    var isDuplicateCourse = function (courses, course) {
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
    var getCourses = function (golfClubs) {
        var courses = [];

        for (var i = 0; i < golfClubs.length; i++) {

            //        console.log("found text " + contents.eq(i).text() +
            //                    " with tagName " + contents.get(i).tagName);

            var golfCourses = golfClubs[i].courses;

            for (var j = 0; j < golfCourses.length; j++) {
                var course = golfCourses[j].name;

                // sometimes the golf channel site will list the same course name twice.
                // check for that and don't bother to add when that's the case
                if (course && !isDuplicateCourse(courses, course)) {
                    courses.push(course);
                }
            }

        }

        return courses;
    };

    /**
     * chop up the web elements to gather details about the tournament
     * 
     * @param {Object} event tournament details
     */
    var getTournamentDetails = function (event) {
        var details = {};

        details.name = event.name;

        var leaderboard = event.leaderboard;
        details.url = "/tournament/" + leaderboard.eventKey;

        details.courses = getCourses(event.golfClubs);

        // get tour and tournament name identifiers from the url
        var parts = details.url.split('/');

        details.tour = tour;
        details.year = year;
        details.id = leaderboard.eventKey;

        console.log("found event " + details.name + " and id " + details.id);

        return details;
    };

    /**
     * main entry point for this module.  takes the raw golf channel
     * data and munges it into a common format
     */
    this.normalize = function (tournament_data) {
        // the tournament_data object holds a bunch of information, but
        // for scheduling purposes, we care about this:
        //
        // tournament_data {
        //   tourEvents : [
        //     {
        //       startDate: "",
        //       endDate: "",
        //       purse: "",
        //       winner: "",
        //       name: "",
        //       leaderboard: {
        //         eventKey: "",
        //         golfClubs: [
        //           {
        //             name: "",
        //             courses: [
        //               { 
        //                 name: ""
        //             }
        //             ]
        //           }
        //
        //         ]
        //       }
        //     }
        //   ]
        // }

        if (!tournament_data) {
            return null;
        }

        // dumpData(tournament_data);

        var tourEvents = tournament_data.tourEvents;
        if (!tourEvents) {
            // console.log("No tourEvents data found... tournament_data: " + JSON.stringify(tournament_data));
            return null;
        }

        var records = [];

        for (var i = 0; i < tourEvents.length; i++) {
            var event = tourEvents[i];
            var record = {};

            // console.log(JSON.stringify(event));

            record.startDate = event.startDate;
            record.endDate = event.endDate;
            record.tournament = getTournamentDetails(event);
            record.purse = event.purse;
            record.winner = event.winnerName;

            // console.log(JSON.stringify(record));

            if (record.tournament.name.endsWith('- Amateurs')) {
                // for some reason, a separate entry for the Amateur results 
                // from the ATT Pebble Beach Pro-Am are included in the tournament 
                // season results. filter that out in the results sent back.

                console.log("Ignoring Amateur tournament result: " + JSON.stringify(record));
            } else {
                // return all non Amateur records

                records.push(record);
            }

        }

        records.sort(scheduleSort);

        return records;
    };

};

module.exports = ScheduleData;
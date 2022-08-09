/**
 * Methods to manipulate PGA tour schedule data
 * 
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

    var getCourseDetails = function (event) {

        var courses = [];

        if (event.golfClubs) {
            for (var i = 0; i < event.golfClubs.length; i++) {
                var club = event.golfClubs[i];

                for (var j = 0; j < club.courses.length; j++) {
                    var course = club.courses[j];
                    var record = {
                        name: course.name,
                        par: course.totalPar,
                        yardage: course.totalYardage
                    }

                    courses.push(record);
                }
            }
        }

        return {
            name: event.name,
            start: event.startDate,
            end: event.endDate,
            purse: event.purse,
            course: courses[0]
        };
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
        details.courseDetails = getCourseDetails(event);

        details.tour = tour;
        details.year = year;
        details.id = leaderboard.eventKey;

        console.log("found event " + details.name + " and id " + details.id);

        return details;
    };

    /**
     * takes the raw golf channel data and munges it into a common format
     * in the past there have been multiple sources of tour data that have
     * been used.  now we just use the golf channel data, but we still map
     * it to the common format established for the earlier data sources.
     * 
     * [djb 06/05/2020]
     * the format changed slightly in mid 2020.  we check for that 
     * and react accordingly.
     */
    this.normalize = function (tournament_data) {
        // the tournament_data object holds a bunch of information, but
        // for scheduling purposes, we care about this:
        //
        // tournament_data {
        //   tourEvents : [{
        //       startDate: "",
        //       endDate: "",
        //       purse: "",
        //       winner: "",
        //       name: "",
        //       key: "",
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
        //         ]}
        //     }]
        // }

        if (!tournament_data) {
            return null;
        }

        // dumpData(tournament_data);

        // [djb 06/05/2020] newer format is just an array, old format was an
        // object called tourEvents
        let tourEvents = tournament_data;

        if (!Array.isArray(tourEvents)) {
            // look for old format
            tourEvents = tournament_data.tourEvents;

            if (!tourEvents) {
                return null;
            }
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
            record.key = event.key;

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

    /**
     * return the event record corresponding to eventid in the schedule
     * 
     * [djb 08/08/2022] 
     * changed the way we construct the eventid.  it used to be
     * just the index of the tournament in the schedule (e.g.
     * first tournament of the season = 0, second =1, etc.), but 
     * this caused problems when the schedule changed in mid season.  
     * Why would the schedule change? COVID was one example, but other 
     * scenarios made an index based id scheme problematic.  
     *   
     * starting in 2022, we use "key" parameter from the GChannel results as 
     * the eventid.  These two functions encapsulate looking for an event and
     * an eventid in the schedule pre or post 2022.
     * 
     * @param {Array} schedule an array of records representing the season schedule
     * @param {String} eventid the eventid for the event to find
     * @returns an event record, undefined if not found
     */
    this.findEvent = function (schedule, eventid) {


        if (year < 2022) {
            if (eventid >= schedule.length) {
                const str = "error!  invalid event id found! eventid: " + eventid + ", schedule.length: " + schedule.length;
                console.log(str);
                return undefined;
            }

            // eventid is just the index into the array - return the record at this index
            return schedule[eventid];
        } else {

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
        }

        const str = `error!  invalid event id found! eventid: ${eventid} schedule.length: ${schedule.length}`;
        console.log(str);
        return undefined;
    }

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
            const str = "error!  invalid index: " + index + ", schedule.length: " + schedule.length;
            console.log(str);
            return undefined;
        }

        if (year < 2022) {
            // pre 2022, the event id was just the index of this event in the schedule
            return index;
        } else {
            const event = schedule[index];

            // use the event key stored as part of each tournament to
            // uniquely identify the event

            // console.log('formatScheduleResults event: ' , event);
            const key = event.key;
            return key;
        }
    }

};

module.exports = ScheduleData;
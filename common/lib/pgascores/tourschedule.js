/**
 *
 *	return the tour schedule for the year. currently the only supported tours are:
 *      PGA and European tours
 *  This will return the schedule information for each stop on the chosen tour, including:
 *      - name of tournament
 *      - names of course(s) played
 *      - dates of tournament
 *      - url for specific tournament data
 *
 **/

var TourDataProvider = require('./tourdataprovider.js');
var Config = require('./utils/config.js');

var config = new Config();

//
// return true if course is contained in courses
//
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


//
// debug function to dump the top level parts of the JSON structure
//
var dumpData = function (obj) {
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      console.log(key + " -> " + obj[key]);
    }
  }
}

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

//
//  chop up the web elements to gather details about the tournament
//
var getTournamentDetails = function (tour, year, event) {
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

//
// sort the schedule by date and tournament id
// it's important the order stays the same since the order of
// this list determines the id used to retrieve the
// details of each individual tournament
//
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

var TourSchedule = function (tour, year) {

  this.getUrl = function () {
    // [djb 04/15/2017] the URL for the golf channel now requires that you put in a year and tournament
    //                  name just to search on other years.  so we just use 2016 and the safeway open
    //                  the old URL didn't require this:
    //                  "http://www.golfchannel.com/tours/" + tour + "/?t=schedule&year=" + year;
    //
    // [djb 04/23/2019] changed URL again. :-(  Previously was this:
    //                  return "http://www.golfchannel.com/tours/" + tour + "/2016/safeway-open/?t=schedule&year=" + year;
    //

    return "https://www.golfchannel.com/tours/" + tour + "/" + year + "/schedule";
  }

  this.getId = function () {
    // create a unique id we can use for caching and for 
    // searching the archives

    var id = config.archive.getTourScheduleId(year, tour);
    return id;
  }

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

    var records = [];

    for (var i = 0; i < tourEvents.length; i++) {
      var event = tourEvents[i];
      var record = {};

      // console.log(JSON.stringify(event));

      record.startDate = event.startDate;
      record.endDate = event.endDate;
      record.tournament = getTournamentDetails(tour, year, event);
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

  this.get = function (callback) {

    var self = this;

    //
    // get tour schedule from our back end data source

    var provider = new TourDataProvider(year);

    provider.get(self, function (records) {

      if (provider.isGolfChannel()) {
        // need to post process golf channel data before
        // returning it
        records = self.normalize(records);
      } else if (provider.isPGATour()) {
        records = records.season;
      }

      callback(records);
    });

  };
}

module.exports = TourSchedule;
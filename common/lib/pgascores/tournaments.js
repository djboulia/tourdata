var NameUtils = require('./utils/nameutils.js');
var TourEvent = require('./tourevent.js');
var TourSchedule = require('./tourschedule.js');

var createPath = function(tour, year, tournament) {
  // build the path to get details about this individual tournament
  return '/' + year + '/tour/' + tour + '/event/' + NameUtils.normalize(tournament.name);
};

//
// look at the tournament details to figure out if this is a stroke play
// or match play event
//
var tournamentFormat = function(tournament) {
  // most are stroke format, look for the exceptions
  var format = "stroke";

  var name = NameUtils.normalize(tournament.name);
  console.log("normalized tournament name: " + name);

  if (name.includes("match_play") ||
    name.includes("presidents_cup") ||
    name.includes("ryder_cup")) {
    console.log("found match play event: " + name);
    format = "match";
  }

  return format;
};

//
// look at the tournament details to figure out if this is one of the
// four majors: The Masters, US Open, Open Championship (British) and PGA Championship
//
// Note: the (former) British Open has been renamed multiple times from
//       140th Open Championship, to Open Championship to simply "The Open".
//       So we try to catch all of those.
//
var isMajor = function(tournament) {
  // most are not majors, look for the exceptions
  var major = false;

  var name = NameUtils.normalize(tournament.name);
  console.log("normalized tournament name: " + name);

  if (name.includes("masters") ||
    name.includes("us_open") ||
    name === "the_open" ||
    name.includes("open_championship") ||
    name.includes("pga_championship")) {
    console.log("found major: " + name);
    major = true;
  }

  return major;
};

var fixupDates = function(records, year) {
  // the PGA and European seasons for a given year actually start in the prior year
  // e.g. 2015 season kicks off with fall events in Oct/Nov of 2014
  //
  // since the data returned from the feed only has month and day (no year) we need
  // to account for that here
  //
  // NOTE: this solution assumes a January tournament.  For the PGA and European
  //       tours this is true... may not work for others

  var lastYear = true;

  // process all records (which are in chronological order) looking for the date
  // transition to the current year
  for (var i = 0; i < records.length; i++) {
    var record = records[i];

    // expect a month<sp>day combination
    var startDateParts = record['startDate'].split(" ");
    var endDateParts = record['endDate'].split(" ");

    // flip over to new year when we see January
    if (lastYear && (startDateParts[0].toLowerCase() == 'jan')) {
      lastYear = false;

      record['startDate'] = new Date(record['startDate'] + ", " + year);
      record['endDate'] = new Date(record['endDate'] + ", " + year);
    } else if (lastYear && (endDateParts[0].toLowerCase() == 'jan')) {
      // special case: start/end date spans a year
      lastYear = false;

      record['startDate'] = new Date(record['startDate'] + ", " + year - 1);
      record['endDate'] = new Date(record['endDate'] + ", " + year);
    } else {
      // not a boundary condition, just process the date
      record['startDate'] = new Date(record['startDate'] + ", " + ((lastYear) ? year - 1 : year));
      record['endDate'] = new Date(record['endDate'] + ", " + ((lastYear) ? year - 1 : year));
    }
  }
};

//
// map our tour names to the Golf Channel tour name
//
var getGCTourName = function(tour) {
  var tourname = "";

  switch (tour) {
    case 'pga':
      tourname = 'pga-tour';
      break;
    case 'european':
      tourname = 'european-tour';
      break;
    default:
      console.error("Invalid tour name " + tour);
  }

  return tourname;
};

//
// Take the raw golfchannel feed and munge it into our schedule structure
//
exports.search = function(tour, year, callback) {

  TourSchedule.getSchedule(getGCTourName(tour), year, function(results) {
    if (results == null) {
      console.log("getSchedule() failed!");
      callback(null);

    } else {

      // golf channel data returns a series of records, each representing a
      // tour stop in the season.  Each record has the following fields:
      //
      //  startDate
      //  endDate
      //  purse
      //  winner
      //  tournament : {
      //    name : tournament name
      //    courses[] : array of courses played in this event
      //    url : golf channel url for this event
      //    tour : tour name
      //    year : event year
      //    id : event id on golf channel site
      //  }
      //

      var records = [];

      for (var i=0; i<results.length; i++) {
        var result = results[i];
        var record = {};

        record.startDate = result.startDate;
        record.endDate = result.endDate;

        record.tournament = result.tournament.name;
        record.link = {
          rel: "self",
          href: createPath(tour, year, result.tournament)
        };
        record.courses = result.tournament.courses;
        record.format = tournamentFormat(result.tournament);
        record.major = isMajor(result.tournament);

        record.purse = result.purse;
        record.winner = result.winner;

        records.push(record);
      }

      fixupDates(records, year);

      callback({
        "schedule": records,
        "created_at": new Date()
      });
    }
  });

};

//
// translate between our API naming convention and the Golf Channel site
// we do this by looking up the tour schedule from the golf channel, finding
// the event that matches, then returning the id that the Golf Channel expects
//
var findGCEvent = function( tour, year, name, callback ) {

  TourSchedule.getSchedule(getGCTourName(tour), year, function(results) {
    if (results == null) {
      console.log("getSchedule() failed!");
      callback(null);

    } else {

      var id = null;

      for (var i=0; i<results.length; i++) {
        var result = results[i];

        if (name === NameUtils.normalize(result.tournament.name)) {
          console.log("found id " + result.tournament.id + " for name " + name);
          tour = result.tournament.tour;
          year = result.tournament.year;
          id = result.tournament.id;
          break;
        }
      }

      callback(tour, year, id);
    }
  });
};

/**
 *	getEvent
 *
 *	@year 			: year this tournament took place
 *  @tour           : tour name (e.g. pga-tour)
 *  @event          : event name (e.g. us-open)
 *	@callback 		: will be called back with eventdata as only argument
 *		 			  eventdata : hash of event keys, tournament descriptions
 */
exports.getEvent = function (tour, year, event, callback) {

  findGCEvent(tour, year, event, function(tour, year, id) {
    console.log("getting tour info for " + tour + " " + year + " " + id);

    TourEvent.getEvent(tour, year, id, function (eventdata) {
        if (eventdata == null) {

            console.log("PGA event call failed!");
            callback(null);

        } else {

            callback(eventdata);
        }
    });
  });

};

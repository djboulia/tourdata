var NameUtils = require('./utils/nameutils.js');
var TourEvent = require('./tourevent.js');
var TourSchedule = require('./tourschedule.js');

//
// look at the tournament details to figure out if this is a stroke play
// or match play event
//
var tournamentFormat = function (tournament) {
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
var isMajor = function (tournament) {
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



//
// map our tour names to the Golf Channel tour name
//
var getGCTourName = function (tour) {
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

var createPath = function (tour, year, index) {
  // build the path to get details about this individual tournament
  return '/' + year + '/tour/' + tour + '/event/' + index;
};

var formatScheduleResults = function (tour, year, results) {
  // golf channel data returns a series of records, each representing a
  // tour stop in the season.  Each record has the following fields:
  //
  //  startDate
  //  endDate
  //  purse
  //  winner
  //  major
  //  format
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

  for (var i = 0; i < results.length; i++) {
    var result = results[i];
    var record = {};

    record.startDate = new Date(result.startDate);
    record.endDate = new Date(result.endDate);

    record.tournament = result.tournament.name;
    record.link = {
      rel: "self",
      href: createPath(tour, year, i)
    };
    record.courses = result.tournament.courses;
    record.format = tournamentFormat(result.tournament);
    record.major = isMajor(result.tournament);

    record.purse = result.purse;
    record.winner = result.winner;

    records.push(record);
  }

  return records;
};

//
// Take the raw golfchannel feed and munge it into our schedule structure
//
exports.search = function (tour, year, callback) {

  var tourSchedule = new TourSchedule(getGCTourName(tour), year);

  tourSchedule.get(function (results) {
    if (results == null) {
      console.log("getSchedule() failed!");
      callback(null);

    } else {

      var records = formatScheduleResults(tour, year, results);

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
var findGCEvent = function (tour, year, eventid, callback) {
  var format = null;
  var major = null;

  var tourSchedule = new TourSchedule(getGCTourName(tour), year);

  tourSchedule.get(function (results) {
    if (results == null) {
      console.log("getSchedule() failed!");
      callback(null);

    } else {

      var id = null;

      if (eventid >= results.length) {
        console.log("error!  invalid event id found!");
        callback(null);
        return;
      }

      var result = results[eventid];

      console.log("found id " + result.tournament.id + " for event " + eventid);
      tour = result.tournament.tour;
      year = result.tournament.year;

      var gcid = result.tournament.id; // golf channel id
      var format = tournamentFormat(result.tournament);
      var major = isMajor(result.tournament);

      callback(tour, year, gcid, eventid, format, major);
    }
  });
};

/**
 *	getEvent
 *
 *	@year 			: year this tournament took place
 *  @tour           : tour name (e.g. pga-tour)
 *  @event          : event id (e.g. us-open)
 *  @details        : true to include per hole and per round data
 *	@callback 		: will be called back with eventdata as only argument
 *		 			  eventdata : hash of event keys, tournament descriptions
 */
exports.getEvent = function (tour, year, event, details, callback) {

  findGCEvent(tour, year, event, function (tour, year, gcid, eventid, format, major) {

    if (tour == undefined) {
      callback(null);
      return;
    }

    console.log("getting tour info for " + tour + " " + year + " " + gcid  + " eventid " + eventid);

    var tourEvent = new TourEvent(tour, year, gcid, eventid);

    tourEvent.get(details, function (eventdata) {
      if (eventdata == null) {

        console.log("PGA event call failed!");
        callback(null);

      } else {
        console.log("format " + format + " major " + major);

        eventdata.format = format;
        eventdata.major = major;

        callback(eventdata);
      }
    });
  });

};
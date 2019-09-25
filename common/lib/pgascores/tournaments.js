/**
 * 
 * This is the main interface the external API uses to get access to the 
 * tour schedule and event information.  It takes the raw feed from the
 * golf feeds, simplifies it and adds information such as stroke vs. match
 * play, whether the tournament is a major, etc.
 *
 */
var NameUtils = require('./utils/nameutils.js');
var TourDataProvider = require('./tourdataprovider.js');

/**
 * look at the tournament name to figure out if this is a stroke play
 * or match play event
 * 
 * @param {String} tournament_name The event name (e.g. The Masters)
 */
var tournamentFormat = function (tournament_name) {

  // most are stroke format, look for the exceptions
  var format = "stroke";

  var name = NameUtils.normalize(tournament_name);
  // console.log("normalized tournament name: " + name);

  if (name.includes("match_play") ||
    name.includes("presidents_cup") ||
    name.includes("ryder_cup")) {
    console.log("found match play event: " + name);
    format = "match";
  }

  return format;
};

/**
 * look at the tournament name to figure out if this is one of the
 * four majors: The Masters, US Open, Open Championship (British) and 
 * PGA Championship
 * 
 * Note: the (former) British Open has been renamed multiple times from
 *       140th Open Championship, to Open Championship to simply "The Open".
 *       So we try to catch all of those.
 * 
 * @param {String} tournament_name The event name (e.g. The Masters)
 */
var isMajor = function (tournament_name) {

  // most are not majors, look for the exceptions
  var major = false;

  var name = NameUtils.normalize(tournament_name);
  // console.log("normalized tournament name: " + name);

  if (name.includes("masters") ||
    name.includes("us_open") ||
    name === "the_open" ||
    name.includes("open_championship") ||
    name.includes("pga_championship")) {
    console.log("found major: " + name + " for tournament " + tournament_name);
    major = true;
  }

  return major;
};

/**
 * Normalize our tour name to what the tour provider will expect
 * 
 * @param {String} tour name of tour, PGA, or European are accepted
 */
var normalizeTourName = function (tour) {
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
    record.format = tournamentFormat(result.tournament.name);
    record.major = isMajor(result.tournament.name);

    record.purse = result.purse;
    record.winner = result.winner;

    records.push(record);
  }

  return records;
};

/**
 * Take the raw tour data feed and munge it into our schedule structure
 * 
 *	@year 			    : year this tournament took place
 *  @tour           : tour name (e.g. pga-tour)
 *	@callback 		  : will be called back with eventdata as only argument
 */
exports.search = function (tour, year, callback) {

  const tourName = normalizeTourName(tour);

  if (!tourName) {
    console.log("Invalid tour name!");
    callback(null);
  }

  var provider = new TourDataProvider(tourName, year);

  provider.getSchedule(function (results) {

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


/**
 *	getEvent
 *
 *	@year 			    : year this tournament took place
 *  @tour           : tour name (e.g. pga-tour)
 *  @event          : event id (e.g. us-open)
 *  @details        : true to include per hole and per round data
 *	@callback 		  : will be called back with eventdata as only argument
 *		 			  eventdata : hash of event keys, tournament descriptions
 */
exports.getEvent = function (tour, year, eventid, details, callback) {

  const tourName = normalizeTourName(tour);

  if (!tourName) {
    console.log("Invalid tour name!");
    callback(null);
  }

  console.log("getting tour info for " + tourName + " " + year + " eventid " + eventid);

  var provider = new TourDataProvider(tourName, year);

  provider.getEvent(eventid, details, function (eventdata) {
    if (eventdata == null) {

      console.log("PGA event call failed!");
      callback(null);

    } else {

      const format = tournamentFormat(eventdata.name);
      const major = isMajor(eventdata.name);

      console.log("format " + format + " major " + major);
      console.log("eventdata.name " + JSON.stringify(eventdata.name));

      eventdata.format = format;
      eventdata.major = major;

      callback(eventdata);
    }
  });

};
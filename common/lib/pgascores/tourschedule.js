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

var request = require('request');
var cheerio = require('cheerio');

var Parser = require('./utils/htmlparser.js');

var getUrl = function(tour, year) {
  return "http://www.golfchannel.com/tours/" + tour + "/?t=schedule&year=" + year;
};

//
// return true if course is contained in courses
//
var isDuplicateCourse = function( courses, course ) {
  for (var i=0; i<courses.length; i++) {
    console.log("courses[i]=" + courses[i] + ", course=" + course);

    if (courses[i] === course) {
      console.log("found duplicate course " + course);
      return true;
    }
  }

  return false;
};

//
//  some tournaments are held on multiple courses
//  the web site represents these as follows:
//  <small>
//      Course Name 1 <br>
//      Course Name 2 <br>
//      ...
//  </small>
//
//  look for the outer tag and parse the contents
//  into an array of courses
//
var parseCourses = function($, el) {
  var contents = $('small', el).contents();
  var courses = [];

  for (var i = 0; i < contents.length; i++) {

    //        console.log("found text " + contents.eq(i).text() +
    //                    " with tagName " + contents.get(i).tagName);

    var course = Parser.text($(contents.get(i)));

    // sometimes the golf channel site will list the same course name twice.
    // check for that and don't bother to add when that's the case
    if (course && !isDuplicateCourse(courses, course)) {
      courses.push(course);
    }
  }

  return courses;
};

//
//  chop up the web elements to gather details about the tournament
//
var parseTournamentDetails = function($, el) {
  var details = {};

  var tournamentName = $('p', el);
  details.name = Parser.text($(tournamentName));

  var tournamentUrl = $('a', tournamentName);
  details.url = tournamentUrl.attr('href');

  details.courses = parseCourses($, el);

  // get tour and tournament name identifiers from the url
  var parts = details.url.split('/');

  details.tour = parts[4];
  details.year = parts[5];
  details.id = parts[6];

  console.log(JSON.stringify(details));

  return details;
};

//
// get tour schedule from Golf Channel
//
// tour: the name of the tour, e.g. pga-tour or european_tour
// year: year to search
// callback: function called when complete
//
exports.getSchedule = function(tour, year, callback) {

  //
  // labels for the fields we want to keep
  //
  var fields = [
    "date", // 0: start and end dates for the tournament
    "tournament", // 1: tournament name, link to details, course name
    "purse", // 2: purse for winner
    "winner" // 3: winning player name
  ];

  var url = getUrl(tour, year);

  console.log("url : " + url);

  request(url, function(error, response, html) {
    if (!error && response.statusCode == 200) {

      var $ = cheerio.load(html);

      // get table data
      var table = $('table#tourSchedule');
      if (table == undefined) {
        console.log("Couldn't find schedule table!");
        callback(null);
        return;
      }

      var row = 0;
      var records = [];

      // process each row in the table
      $('tr.scheduleRow', table).each(function(i, tr) {
        var record = {};
        var td = $('td', tr);

        if (td.each != undefined) {
          var ndx = 0;

          td.each(function(i, el) {
            var key = "";

            if (ndx < fields.length) {
              key = fields[ndx];
            }

            if (key == 'tournament') {
              // tournament needs to be parsed into tournament name, url, course
              var tournament = parseTournamentDetails($, this);

              record.tournament = tournament;

            } else if (key == 'date') {
              // parse into start and end dates
              var start = $('p.scheduleDateStart', this);
              var end = $('p.scheduleDateEnd', this);

              // remove embedded white space to get month, day
              var startDate = Parser.text($(start));
              record.startDate = startDate;

              // remove embedded white space to get month, day
              var endDate = Parser.text($(end));
              record.endDate = endDate;

            } else if (key != "") {
              // replace whitespace with spaces to resolve encoding issues
              record[key] = Parser.text($(this));
            }

            ndx++;
          });

          //console.log(JSON.stringify(record));

          records.push(record);
        }

        row++;
      });

      callback(records);
    } else {
      //            console.log("Error retrieving page: " + JSON.stringify(response));
      console.log("Error retrieving page");
      callback(null);
    }
  });
};

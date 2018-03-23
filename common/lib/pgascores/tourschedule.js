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

var getUrl = function (tour, year) {
    return "http://www.golfchannel.com/tours/" + tour + "/?t=schedule&year=" + year;
};

var fixupDates = function (records, year) {
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

var createPath = function (tournament) {
    // build the path to get details about this tournament

    return '/' + tournament.year +
        '/tour/' + tournament.tour +
        '/event/' + tournament.id;
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
var parseCourses = function ($, el) {
    var contents = $('small', el).contents();
    var courses = [];

    for (var i = 0; i < contents.length; i++) {

        //        console.log("found text " + contents.eq(i).text() + 
        //                    " with tagName " + contents.get(i).tagName);

        var course = Parser.text($(contents.get(i)));

        if (course) {
            courses.push(course);
        }
    }

    return courses;
};

//
//  chop up the web elements to gather details about the tournament
//
var parseTournamentDetails = function ($, el) {
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
}

//
// Go to the golfchannel site for schedule data
//
var getSchedule = function (tour, year, callback) {

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

    request(url, function (error, response, html) {
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
            $('tr.scheduleRow', table).each(function (i, tr) {
                var record = {};
                var td = $('td', tr);

                if (td.each != undefined) {
                    var ndx = 0;

                    td.each(function (i, el) {
                        var key = "";

                        if (ndx < fields.length) {
                            key = fields[ndx];
                        }

                        if (key == 'tournament') {
                            // tournament needs to be parsed into tournament name, url, course
                            var tournament = parseTournamentDetails($, this);

                            record.tournament = tournament.name;
                            record.link = {
                                rel: "self",
                                href: createPath(tournament)
                            };
                            record.courses = tournament.courses;

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

            fixupDates(records, year);


            callback({
                "schedule": records,
                "created_at": new Date()
            });
        } else {
            //            console.log("Error retrieving page: " + JSON.stringify(response));
            console.log("Error retrieving page");
            callback(null);
        }
    });
};


/**
 *	getSchedule
 *
 *	@tour 			: tour, e.g. pga or european
 *	@year 			: year to get schedule for 
 *	@callback 		: will be called back with results of search
 */
exports.getSchedule = function (tour, year, callback) {

    var tourname = "";
    switch (tour.toLowerCase()) {
    case 'pga':
        tourname = 'pga-tour';
        break;
    case 'european':
        tourname = 'european-tour';
        break;
    default:
        console.error("Invalid tour name " + tour);
    }

    getSchedule(tourname, year, function (results) {
        if (results == null) {
            console.log("getSchedule() failed!");
            callback(null);

        } else {
            callback(results);
        }
    });
};
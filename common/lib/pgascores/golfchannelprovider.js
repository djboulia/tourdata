/**
 *
 *	Get tournament results from the Golf Channel site.  
 *
 *  I've tried multiple options over the past few years to get consistent tour data.
 *  First Yahoo! Sports, then the PGA tour site
 *  The PGA Tour site is flaky with historical data... it used to have the PGA championship
 *  past leaderboards (prior to 2016) but then stopped listing past events.  The Golf Channel
 *  seems to have the data, so we use that for tournament data going forward.
 *
 **/

var request = require('request');
var cheerio = require('cheerio');

var PlayerData = require('./playerdata.js');
var Parser = require('./utils/htmlparser.js');

//
// expects a string in Month dd-dd, yyyy 
// or Month dd-Month dd, yyyy format
//
var parseDateRange = function (str) {
    var dateparts = str.split('-');
    var startdate = dateparts[0];
    var startdateparts = startdate.split(' ');
    var startmonth = startdateparts[0];
    var startday = startdateparts[1];

    var enddate = dateparts[1];
    var enddateparts = enddate.split(',');

    var endmonth = startmonth;
    var endday = enddateparts[0];

    if (isNaN(parseInt(endday))) {
        var parts = endday.split(' ');

        // end month is in the result, parse that
        endmonth = parts[0];
        endday = parts[1];
    }

    var year = enddateparts[1];

    console.log('start: ' + startmonth + ' ' + startday + ',' + year);
    console.log('end: ' + endmonth + ' ' + endday + ',' + year);

    return {
        start: new Date(startmonth + ' ' + startday + ',' + year),
        end: new Date(endmonth + ' ' + endday + ',' + year),
    };
};

var getEventDetails = function ($) {
    //
    // labels for the fields we want to keep
    //
    var fields = [
        "name",
        "par",
        "yardage",
        "purse"
    ];

    // get table data
    var eventDetails = $('div.currentTourHeading');

    if (eventDetails == undefined) {
        console.log("Couldn't find event details!");
        return null;
    }

    var eventName = Parser.text($('h1', eventDetails));
    var details = $('div#tournamentData', eventDetails);
    var courseDetails = $('div#infoBar', details);
    var eventDate = Parser.text($('h4', details));
    var dateRange = parseDateRange(eventDate);

    var ndx = 0;
    var courseInfo = {};

    $('span', courseDetails).each(function (i, span) {
        var key = null;

        if (ndx < fields.length) {
            key = fields[ndx];
        }

        if (key) {

            switch (key) {
            case 'par':
            case 'yardage':
            case 'purse':
                //
                // expect these fields to contain Title:<sp>Data
                //
                var words = Parser.words($(this));

                courseInfo[key] = words[1]; // only take the data portion
                    
                break;

            default:
                courseInfo[key] = Parser.text($(this));
            }
        }

        ndx++;
    });

    var purse = courseInfo['purse'];
    courseInfo['purse'] = undefined;

    return {
        name: eventName,
        start: dateRange.start,
        end: dateRange.end,
        purse: purse,
        course: courseInfo
    };
};

//
// labels for the fields we want to keep
//
var fieldsComplete = [
    null, // 0: don't keep this field, which has no data
    "pos", // 1: position on the leaderboard
    null, // 2: don't keep this field, which has movement up/down the rankings (not interesting)
    "name", // 3: player name
    "total",
    "thru",
    "today",
    "1", // 7-10: scores for each round
    "2",
    "3",
    "4",
    "strokes" // 11: total number of strokes
];

//
// labels for the fields we want to keep
//
var fieldsInProgress = [
    null, // 0: don't keep this field, which has no data
    "pos", // 1: position on the leaderboard
    null, // 2: don't keep this field, which has movement up/down the rankings (not interesting)
    "name", // 3: player name
    "total",
    "time", // 5: tee time
    "1", // 7-10: scores for each round
    "2",
    "3",
    "4",
    "strokes" // 10: total number of strokes
];

//
// return the right field mapping based on whether the tournament is in progress
// or not.  we detect that by looking at the cell count, which changes from 
// a table showing starting tee time to one where the player's current round
// progress is displayed
//
var getFields = function(cells){
    
    var fields = null;
    
    if (cells.length == 11) {
        console.log("cells.length == 11, round in progress");
                    
        fields = fieldsInProgress;
    } else {
        fields = fieldsComplete;
    }
    
    return fields;
};

var getUrl = function (year, tour, event) {
    return "http://www.golfchannel.com/tours/" + tour + "/" + year + "/" + event;
};


var getEvent = function (year, tour, event, callback) {

    var url = getUrl(year, tour, event);
    
    console.log("url : " + url);

    request(url, function (error, response, html) {
        if (!error && response.statusCode == 200) {

            var $ = cheerio.load(html);

            var eventInfo = getEventDetails($);

            if (!eventInfo) {
                callback(null);
                return;
            }

            var start = eventInfo.start;
            var year = start.getFullYear();

            // get table data
            var table = $('table.gc_leaderboard');
            if (table == undefined) {
                console.log("Couldn't find event table!");
                callback(null);
                return;
            }

            var row = 0;
            var records = [];

            // process each row in the table
            $('tr.playerRow', table).each(function (i, tr) {
                
                var cells = Parser.cells($, tr);                
                var playerFields = getFields(cells);
                var record = Parser.mapFields(cells, playerFields);

                if (record) {
                    var player = new PlayerData(record);

                    player.normalize(eventInfo);

                    // console.log(JSON.stringify(player.data));

                    records.push(player.data);

                    // console.log( "row=" + row + " name=" + record.name);
                }

                row++;
            });

            callback({
                "name": eventInfo.name,
                "start": eventInfo.start.toString(),
                "end": eventInfo.end.toString(),
                "course": eventInfo.course,
                "scores": records,
                "created_at": new Date()
            });
        } else {
            console.log("Error retrieving page: " + JSON.stringify(response));
            callback(null);
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
exports.getEvent = function (year, tour, event, callback) {


    getEvent(year, tour, event, function (eventdata) {
        if (eventdata == null) {

            console.log("PGA event call failed!");
            callback(null);

        } else {

            callback(eventdata);
        }
    });
};
/**
 *
 *	Get the world rankings from the PGA tour site.  See yahooprovider.js for another
 * 	option.  The PGA tour site gives the more complete list of world rankings
 *  (through 1000 players).
 *
 *  The Yahoo site has the same info but is limited to the top 250 players.
 *
 **/

var request = require('request');
var cheerio = require('cheerio');

var NameUtils = require('./utils/nameutils.js');
var Parser = require('./utils/htmlparser.js');

var thisYear = function () {
    return new Date().getFullYear();
};

var getUrl = function (year) {
    var url = "http://www.pgatour.com/stats/stat.186";

    if (year == thisYear()) {
        url = url + ".html";
    } else {

        // prior years are at a url of the form http://www.pgatour.com/stats/stat.186.YYYY.html
        url = url + "." + year.toString() + ".html";
    }

    return url;
};

//
// only save the fields we care about.  For each position in the row,
// given the field a meaningful name, or null to ignore the field
// 
// for the world rankings, we care about the first field (rank) and the third
// field (player name)
//
var rankingRow = [
    "rank", // this week's ranking
    null, // last week's ranking.  ignore this
    "name" // player name
];

/**
 *
 * getPGARankings
 *
 * returns an array of objects of the form:
 *
 *		[ { "player_id" : "tiger_woods", "rank" : 1, "name" : "Tiger Woods" },
 *		  { "player_id" : "phil_michelson", "rank" : 2, "name" : "Phil Mickelson" }, 
 *         ... 
 *      ];
 *
 **/
var getPGARankings = function (year, callback) {

    var url = getUrl(year);

    console.log("PGA rankings url for year " + year + ": " + url);

    request(url, function (error, response, html) {

        if (error || response.statusCode != 200) {
            console.log("Couldn't find rankings! Error: " + error);
            callback(null);

            return;
        }

        // get table data
        var $ = cheerio.load(html);
        var table = $('table#statsTable');

        if (table == undefined) {

            console.log("Couldn't find rankings! No table data found.");
            callback(null);

            return;
        }

        var row = 0;
        var records = [];
        var tbody = $('tbody', table);

        if (!tbody) {

            console.log("Couldn't find rankings! No table body found.");
            callback(null);

            return;
        }

        // process each row in the table
        $('tr', tbody).each(function (i, tr) {

            var cells = Parser.cells($, tr);                
            var record = Parser.mapFields(cells, rankingRow);

            if (record) {

                if (record.name) {
                    record.player_id = NameUtils.normalize(record.name);

                    records.push(record);
                } else {
                    // if the row has no name field, then this was a bogus row, probably
                    // an ad inserted in the table
                    console.log("found invalid record = " + JSON.stringify(row));
                }
            }

            //				console.log( "row=" + row + " player_id=" + record.player_id +
            //							 "name=" + record.name + " rank=" + record.rank );

            row++;
        });

        callback(records);
    });
}

/**
 *	getRankings		: return current world rankings for PGA tour players
 *
 *	@tour			: tour to get rankings for.  currently only supports PGA
 *
 *	@year			: rankings year to return.  if year is in current year, will be the
 *					  latest world rankings for players
 *
 *	@callback 		: will be called back with eventdata as only argument
 *		 			  eventdata : array of ranking data
 */
exports.getRankings = function (tour, year, callback) {

    if (tour.toLowerCase() != "pga") {

        console.log("Error: this API currently only supports PGA rankings.")

        callback(null);

    } else {

        console.log("getting world rankings for tour " + tour + " and year " + year);

        getPGARankings(year, function (eventdata) {
            if (eventdata == null) {

                console.log("PGA Tour call failed!");
                callback(null);

            } else {

                console.log("rankings: " + JSON.stringify(eventdata));
                callback(eventdata);

            }
        });
    }

};
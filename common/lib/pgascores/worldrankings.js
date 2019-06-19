/**
 *
 *	Get the world rankings from the PGA tour site
 *  Uses cache and archive when available 
 *
 **/

var request = require('request');

var Cache = require('./utils/cache.js');
var PGAWorldRankingsArchive = require('./worldrankingsarchive.js');
var PGATourRankingsPage = require('./pgatourrankingspage.js');

var pageCache = new Cache(60 * 60 * 24); // rankings don't change much; keep for 24 hrs
var pgaArchive = new PGAWorldRankingsArchive(60 * 60 * 24 * 30); // archive data is stable; keep for 30 days

var thisYear = function () {
    return new Date().getFullYear();
};

var getPageWithCache = function (page, cb) {
    var url = page.getUrl();
    var html = pageCache.get(url);

    // check cache first, return that if we have it already
    if (html) {
        process.nextTick(function () {
            cb(html);
        });
    } else {
        // nope, go to the web and get it
        request.get(url, (error, response, body) => {

            if (!error && response.statusCode == 200) {
                html = body;

                // save it in the cache for next time
                pageCache.put(url, html);

            } else {
                console.error("Error retrieving page.  Response code: " + response.statusCode);
                console.error("Error message: " + JSON.stringify(error));
            }

            cb(html);
        });
    }
}

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
var getPGARankings = function (tour, year, callback) {

    if (year >= thisYear()) {
        var page = new PGATourRankingsPage(tour, year);
        var url = page.getUrl();

        console.log("PGA rankings url for year " + year + ": " + url);

        getPageWithCache(page, function (html) {

            var records = page.parse(html);

            callback(records);
        });
    } else {
        console.log("Using PGA rankings *archive* for year " + year);
        pgaArchive.get(year, callback);
    }
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

        getPGARankings("pga-tour", year, function (eventdata) {
            if (eventdata == null) {

                console.log("PGA Tour call failed!");
                callback(null);

            } else {

                // console.log("rankings: " + JSON.stringify(eventdata));
                callback(eventdata);

            }
        });
    }

};
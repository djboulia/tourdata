/**
 *
 *	Get the world rankings from the PGA tour site.  
 *
 **/

var request = require('request');

var NameUtils = require('./utils/nameutils.js');
var CacheModule = require('./utils/cache.js');
var TableScraper = require('./utils/tablescraper.js');
var PGAWorldRankingsArchive = require('./worldrankingsarchive.js');

var pageCache = new CacheModule.Cache(60 * 60 * 24); // rankings don't change much; keep for 24 hrs
var pgaArchive = new PGAWorldRankingsArchive(60 * 60 * 24 * 30); // archive data is stable; keep for 30 days

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

var RankingsScraper = function (html) {

    var tableId = 'table#statsTable'; // table we will look for in the html
    var fieldMap = ["rank", "", "name"]; // columns we care about
    var tableScraper = new TableScraper(html);

    this.init = function () {
        return tableScraper.init(tableId);
    };

    this.scrape = function () {
        var records = tableScraper.scrape(fieldMap, (record) => {
            // validate the name field and turn it into a unique player_id 
            if (record.name) {
                record.player_id = NameUtils.normalize(record.name);
            } else {
                console.log("found invalid record = " + JSON.stringify(record));
                return null; // don't include in the result
            }

            return record;
        });

        //
        //  returns an array of objects of the form:
        //  		[ { "player_id" : "tiger_woods", "rank" : 1, "name" : "Tiger Woods" },
        //  		  { "player_id" : "phil_michelson", "rank" : 2, "name" : "Phil Mickelson" }, ... ];
        //
        return records;
    };
};

var getPage = function (url, cb) {
    var page = pageCache.get(url);

    // check cache first, return that if we have it already
    if (page) {
        process.nextTick(function () {
            cb(page);
        });
    } else {
        // nope, go to the web and get it
        request.get(url, (error, response, body) => {

            if (!error && response.statusCode == 200) {
                page = body;

                // save it in the cache for next time
                pageCache.put(url, page);

            } else {
                console.error("Error retrieving page.  Response code: " + response.statusCode);
                console.error("Error message: " + JSON.stringify(error));
            }

            cb(page);

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
var getPGARankings = function (year, callback) {

    var url = getUrl(year);

    if (year >= thisYear()) {
        console.log("PGA rankings url for year " + year + ": " + url);

        getPage(url, function (html) {

            var scraper = new RankingsScraper(html);

            if (!scraper.init()) {
                callback(null);
                return;
            }

            var records = scraper.scrape();

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
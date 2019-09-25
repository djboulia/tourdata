/**
 *
 *	Get the world rankings from the PGA tour site
 *  Uses cache and archive when available 
 *
 **/

var Cache = require('./utils/cache.js');
var PGAWorldRankingsArchive = require('./worldrankingsarchive.js');
var PGATourRankingsPage = require('./pgatourrankingspage.js');

var rankingsCache = new Cache(60 * 60 * 24); // rankings don't change much; keep for 24 hrs

var thisYear = function () {
    return new Date().getFullYear();
};

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
    var records = rankingsCache.get(year);

    // check cache first, return that if we have it already
    if (records) {
        process.nextTick(function () {
            callback(records);
        });
    } else {
        if (year >= thisYear()) {
            console.log("Using PGA.com site for year " + year);

            var page = new PGATourRankingsPage(tour, year);

            page.get(function (records) {
                // save it in the cache for next time
                rankingsCache.put(year, records);

                callback(records);
            });
        } else {
            console.log("Using PGA rankings *archive* for year " + year);

            var pgaArchive = new PGAWorldRankingsArchive(year);

            pgaArchive.get(function (records) {
                // save it in the cache for next time
                rankingsCache.put(year, records);

                callback(records);
            });
        }

    }
}

var WorldRankingsProvider = function () {

    /**
     *	get		        : return current world rankings for PGA tour players
     *
     *	@tour			: tour to get rankings for.  currently only supports PGA
     *
     *	@year			: rankings year to return.  if year is in current year, will be the
     *					  latest world rankings for players
     *
     *	@callback 		: will be called back with eventdata as only argument
     *		 			  eventdata : array of ranking data
     */
    this.get = function (tour, year, callback) {

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
};

module.exports = WorldRankingsProvider;
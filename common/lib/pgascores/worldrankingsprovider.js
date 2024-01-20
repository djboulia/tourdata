/**
 *
 *	Get the world rankings from the PGA tour site
 *  Uses cache and archive when available
 *
 **/

const Cache = require("./utils/cache.js");
const PGAWorldRankingsArchive = require("./worldrankingsarchive.js");
const PGATourRankingsPage = require("./pgatourrankingspage.js");
const qlGetRankings = require("./pgatour/graphql/rankingdetails.js");
const RankingDetails = require("./pgatour/rankingdetails.js");

const rankingsCache = new Cache(60 * 60 * 24); // rankings don't change much; keep for 24 hrs

const thisYear = function () {
  return new Date().getFullYear();
};

/**
 *
 * getOldPGARankings
 *
 * Prior to 2023, the rankings data was scraped from pgatour.com.  After they moved
 * to a graphql implementation, the rankings data is now retrieved from the graph
 * We still have old rankings data in the archive, so we keep this for those years
 *
 * returns an array of objects of the form:
 *
 *		[ { "player_id" : "tiger_woods", "rank" : 1, "name" : "Tiger Woods" },
 *		  { "player_id" : "phil_michelson", "rank" : 2, "name" : "Phil Mickelson" },
 *         ...
 *      ];
 *
 **/
const getOldPGARankings = function (tour, year, callback) {
  var records = rankingsCache.get(year);

  // check cache first, return that if we have it already
  if (records) {
    process.nextTick(function () {
      callback(records);
    });
  } else {
    if (year >= thisYear()) {
      console.log("Using pgatour.com site for year " + year);

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
};

const getGraphPGARankings = function (tour, year, callback) {
  const graphData = rankingsCache.get(year);
  const rankingDetails = new RankingDetails();

  // check cache first, return that if we have it already
  if (graphData) {
    console.log(`cache hit for rankings year ${year}`);

    // normalize the rankings data
    const records = rankingDetails.normalize(graphData);
    process.nextTick(function () {
      callback(records);
    });
  } else {
    if (year >= thisYear()) {
      console.log("Using PGA.com site for year " + year);

      qlGetRankings(tour, year)
        .then((graphData) => {
          // save it in the cache for next time
          rankingsCache.put(year, graphData);
          const records = rankingDetails.normalize(graphData);

          callback(records);
        })
        .catch((e) => {
          console.log("graph error for rankings data");
          callback(null);
        });
    } else {
      console.log("Using PGA rankings *archive* for year " + year);

      const pgaArchive = new PGAWorldRankingsArchive(year);

      pgaArchive.get(function (graphData) {
        // save it in the cache for next time
        rankingsCache.put(year, graphData);

        // graph result is in archive, normalize rankings before returning
        const records = rankingDetails.normalize(graphData);

        callback(records);
      });
    }
  }
};

const WorldRankingsProvider = function () {
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
      console.log("Error: this API currently only supports PGA rankings.");

      callback(null);
    } else {
      if (year < 2023) {
        console.log(
          "getting legacy world rankings for tour " + tour + " and year " + year
        );

        getOldPGARankings("pga-tour", year, function (eventdata) {
          if (eventdata == null) {
            console.log("PGA Tour call failed!");
            callback(null);
          } else {
            // console.log("rankings: " + JSON.stringify(eventdata));
            callback(eventdata);
          }
        });
      } else {
        console.log(
          "getting world rankings for tour " + tour + " and year " + year
        );

        getGraphPGARankings(tour, year, function (eventdata) {
          if (eventdata == null) {
            console.log("pgatour.com rankings call failed!");
            callback(null);
          } else {
            // console.log("rankings: " + JSON.stringify(eventdata));
            callback(eventdata);
          }
        });
      }
    }
  };
};

module.exports = WorldRankingsProvider;

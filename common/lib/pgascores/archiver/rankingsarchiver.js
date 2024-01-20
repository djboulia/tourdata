/**
 * attempt to archive the given year's world rankings
 */

const PGAWorldRankingsArchive = require("../worldrankingsarchive.js");
const PGATourRankingsPage = require("../pgatourrankingspage.js");
const qlGetRankings = require("../pgatour/graphql/rankingdetails.js");

const legacyRankings = function (tour, year, rankingsArchive) {
  // didn't find it, go get it from the web and store result
  var page = new PGATourRankingsPage(tour, year);
  page.get(function (records) {
    if (records) {
      rankingsArchive.put(records, (result) => {
        console.log("stored item");
      });
    }
  });
};

const graphRankings = function (tour, year, rankingsArchive) {
  // didn't find it, go get it from the web and store result
  qlGetRankings(tour, year)
    .then((results) => {
      if (results) {
        rankingsArchive.put(results, () => {
          console.log("stored item");
        });
      }
    })
    .catch((e) => {
      console.error("Error:" + e);
    });
};

const RankingsArchiver = function (tour) {
  this.archive = function (year) {
    var now = new Date();
    console.log(
      "Beginning rankings archive for year " + year + " at " + now.toString()
    );

    var rankingsArchive = new PGAWorldRankingsArchive(year);

    rankingsArchive.exists((result) => {
      if (result) {
        console.log(
          `No action required.  Ranking exists in archive for year ${year}.`
        );
      } else {
        console.log("No rankings archive for year " + year);

        if (year < 2023) {
          legacyRankings(tour, year, rankingsArchive);
        } else {
          // move to new graph based query for later rankings
          graphRankings("pga", year, rankingsArchive);
        }
      }
    });
  };
};

module.exports = RankingsArchiver;

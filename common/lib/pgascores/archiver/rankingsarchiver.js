/**
 * ttempt to archive the given year's world rankings
 */

var PGAWorldRankingsArchive = require('../worldrankingsarchive.js');
var PGATourRankingsPage = require('../pgatourrankingspage.js');

var RankingsArchiver = function (tour) {

    this.archive = function (year) {
        var now = new Date();
        console.log("Beginning rankings archive for year " + year + " at " + now.toString());

        var rankingsArchive = new PGAWorldRankingsArchive(year);

        rankingsArchive.exists((result) => {
            if (result) {
                console.log("No action required.  Ranking exists in archive for year " + year + ".");
            } else {
                console.log("No rankings archive for year " + year);

                // didn't find it, go get it from the web and store result
                var page = new PGATourRankingsPage(tour, year);
                page.get(function (records) {

                    if (records) {
                        rankingsArchive.put(records,
                            (result) => {
                                console.log("stored item");
                            });
                    }
                });
            }
        });
    }
};

module.exports = RankingsArchiver;
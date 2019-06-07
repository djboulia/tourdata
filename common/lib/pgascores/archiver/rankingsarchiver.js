//
// attempt to archive the given year's world rankings
//

var Storage = require('../utils/storage.js');
var Config = require('../utils/config.js');
var PGATourRankingsPage = require('../pgatourrankingspage.js');

var config = new Config();
var cos = new Storage(config.archive.getWorldRankingsBucket());

var RankingsArchiver = function (tour) {

    this.archive = function (year) {
        var page = new PGATourRankingsPage(tour, year);
        var id = page.getId();

        var now = new Date();
        console.log("Beginning rankings archive for year " + year + " at " + now.toString());

        cos.exists(id)
            .then((result) => {
                if (result) {
                    console.log("No action required.  Ranking exists in archive for year " + year + ".");
                } else {
                    console.log("No rankings archive for year " + year);

                    // didn't find it, go get it from the web and store result
                    page.get(page.getUrl(), function (html) {
                        var records = page.parse(html);

                        if (records) {
                            cos.put(id, records)
                                .then((result) => {
                                    console.log("stored key " + id);
                                })
                                .catch((e) => {
                                    console.log("Error!");
                                });
                        }
                    });
                }
            })
            .catch((e) => {
                console.log("Error!");
            });
    }
};

module.exports = RankingsArchiver;
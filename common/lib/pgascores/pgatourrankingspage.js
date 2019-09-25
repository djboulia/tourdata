/**
 *
 *	Get the world rankings from the PGA tour site.  
 *
 **/

var request = require('request');

var NameUtils = require('./utils/nameutils.js');
var TableScraper = require('./utils/tablescraper.js');

var thisYear = function () {
    return new Date().getFullYear();
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

var PGATourRankingsPage = function (tour, year) {

    var getUrl = function () {
        var url = "http://www.pgatour.com/stats/stat.186";

        if (year == thisYear()) {
            url = url + ".html";
        } else {
            // prior years are at a url of the form http://www.pgatour.com/stats/stat.186.YYYY.html
            url = url + "." + year.toString() + ".html";
        }

        return url;
    };

    this.parse = function (html) {
        var scraper = new RankingsScraper(html);

        if (!scraper.init()) {
            return null;
        }

        var records = scraper.scrape();

        return records;
    };

    this.get = function (cb) {
        var page = null;
        const url = getUrl();

        // go to the web and get it
        request.get(url, (error, response, body) => {

            if (!error && response.statusCode == 200) {
                page = body;

            } else {
                console.error("Error retrieving page.  Response code: " + response.statusCode);
                console.error("Error message: " + JSON.stringify(error));
            }

            const records = this.parse(page);
            cb(records);
        });
    };
};

module.exports = PGATourRankingsPage;
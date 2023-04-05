/**
 *
 *	Get the world rankings from the PGA tour site.
 *
 **/

var request = require('request');

var Header = require('./utils/header.js');
var NameUtils = require('./utils/nameutils.js');
var ScriptScraper = require('./utils/scriptscraper.js');

var thisYear = function () {
    return new Date().getFullYear();
};

var RankingsScraper = function (html) {

    var scriptId = 'script#__NEXT_DATA__'; // script we will look for in the html
    var fieldMap = ["rank", "playerName"];
    var scriptScraper = new ScriptScraper(html);

    this.init = function () {
        return scriptScraper.init(scriptId);
    };

    this.scrape = function () {
        var records = scriptScraper.scrape(fieldMap, (record) => {
            // validate the name field and turn it into a unique player_id
            if (record.playerName) {
                record.player_id = NameUtils.normalize(record.playerName);
                record.name = record.playerName;
                record.playerName = undefined;
            } else {
                console.log("found invalid record = " + JSON.stringify(record));
                return null; // don't include in the result
            }

            if (record.rank) {
                record.rank = record.rank.toString();
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
        var url = "https://www.pgatour.com/stats/detail/186";

        if (year !== thisYear()) {
            // prior years are at a url of the form http://www.pgatour.com/stats/stat.186.yYYYY.html
            url = url + ".y" + year.toString() + ".html";
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
        var options = {
            url: url,
            method: 'GET',
            headers: Header.UserAgent.FIREFOX
          };

          console.log('options: ', options);

          request(options, (error, response, body) => {

            if (!error && response.statusCode == 200) {
                page = body;

                const records = this.parse(page);
                cb(records);
            } else {
                console.error("Error retrieving page: " + url + "  Response code: " + response.statusCode);
                console.error("Error message: " + JSON.stringify(error));
                cb(null);
            }
        });
    };
};

module.exports = PGATourRankingsPage;
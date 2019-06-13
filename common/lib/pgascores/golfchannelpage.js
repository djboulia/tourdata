var request = require('request');
var cheerio = require('cheerio');

var getTournamentData = function ($) {
    // get all script tags, look for the tournament data and parse it
    var scripts = $('script');
    if (scripts == undefined) {
        console.log("Couldn't find scripts!");
        callback(null);
        return;
    } else {
        // console.log("found scripts");
    }

    // all event info now stored in this variable in the web page
    var searchString = "__gc_tournament_data__ = ";
    var text = scripts.text();
    var start = text.indexOf(searchString);
    var end = text
        .substr(start + searchString.length)
        .indexOf('";');

    if (start < 0) {
        console.log("Couldn't find tournament data!!");
        callback(null);
        return;
    }

    // the tournament data is stored as a string in a script with
    // all sorts of escaped characters.  A normal JSON.parse doesn't seem
    // to process it.  I think there's an encoding/conversion issue somewhere
    // To fix, we munge it back by converting unicode numbers and special characters
    var tournament_string = text.substr(start + searchString.length + 1, end - 1);

    // console.log(tournament_string.substr(0, 30) + "..." + tournament_string.substr(-30));

    var r = /\\u([\d\w]{4})/gi;
    tournament_string = tournament_string.replace(r, function (match, grp) {
        return String.fromCharCode(parseInt(grp, 16));
    });
    var r = /\\([–’‘èéúíáñö“”\\\/])/gi;
    tournament_string = tournament_string.replace(r, function (match, grp) {
        return grp;
    });

    // console.log(tournament_string.substr(0, 1000));
    // console.log("start " + start + " end " + end);

    var tournament_data = JSON.parse(tournament_string);
    return tournament_data;
}

var processPage = function (page, cb) {
    if (page) {
        //
        // parse the html to get at the tournament data
        //
        var $ = cheerio.load(page);

        var tournament_data = getTournamentData($);

        cb(tournament_data);
    } else {
        //            console.log("Error retrieving page: " + JSON.stringify(response));
        console.log("Error retrieving page!");
        cb(null);
    }

}

//
// public interface
//

var GolfChannelPage = function () {

    this.get = function (url, cb) {
        var page = null;

        request.get(url, (error, response, body) => {

            if (error || response.statusCode != 200) {
                console.error("Error retrieving page.  Response code: " + (response) ? response.statusCode : undefined) ;
                console.error("Error message: " + JSON.stringify(error));
            } else {
                page = body;
            }

            processPage(page, cb);
        });

    };

};

module.exports = GolfChannelPage;
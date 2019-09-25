var request = require('request');
var cheerio = require('cheerio');

var searchString = "__gc_tournament_data__ = ";

// the tournament data is stored as a string in a script with
// all sorts of escaped characters.  A normal JSON.parse doesn't seem
// to process it.  I think there's an encoding/conversion issue somewhere
// To fix, we munge it back by converting unicode numbers and special characters
var unescapeString = function (string) {
    var r = /\\u([\d\w]{4})/gi;
    string = string.replace(r, function (match, grp) {
        return String.fromCharCode(parseInt(grp, 16));
    });

    var r = /\\([–’‘èéúíáñö“”\\\/])/gi;
    string = string.replace(r, function (match, grp) {
        return grp;
    });

    return string;
};

var findTournamentDataScript = function ($) {
    var result = undefined;

    var scripts = $('script');
    if (scripts != undefined) {
        // search each script tag for the right data
        console.log("found " + $(scripts).length + " scripts!");

        $(scripts).each(function (i, elem) {
            var script = $(this).text();

            var start = script.indexOf(searchString);
            if (start >= 0) {
                console.log("found tournament script!");
                result = script;
                return false;
            }

            return true;
        });

    }

    return result;
};

//
// version 1 of the tournament data had the
// format __gc_tournament_data = "xxx";
// where "xxx" was the data we're looking for
//
var isVersion1 = function (script) {
    var start = script.indexOf(searchString);

    var nextChar = script
        .substr(start + searchString.length, 1);

    // console.log("isVersion1: " + nextChar);

    if (nextChar === '"') {
        return true;
    }

    return false;
};

//
// version 2 of the tournament data has the
// format:
//   __gc_tournament_data = {
//    display = "full",
//    scoring = "StrokePlay",
//    data = "xxx"
//  }
// where "xxx" is the data we're looking for
//
var isVersion2 = function (script) {
    var start = script.indexOf(searchString);

    var nextChar = script
        .substr(start + searchString.length, 1);

    // console.log("isVersion2: " + nextChar);

    if (nextChar === "{") {
        return true;
    }

    return false;
};

var getTournamentData = function ($) {
    // get all script tags, look for the tournament data and parse it
    var script = findTournamentDataScript($);
    if (script === undefined) {
        console.log("Couldn't find tournament data script!");
        return null;
    }

    var tournament_string = undefined;

    if (isVersion1(script)) {
        console.log("version 1 format detected");

        // all event info now stored in this variable in the web page
        var start = script.indexOf(searchString);
        var end = script
            .substr(start + searchString.length)
            .indexOf('";');

        // console.log("start " + start + " end " + end);

        tournament_string = script.substr(start + searchString.length + 1, end - 1);
    } else if (isVersion2(script)) {
        // GC changed the format in the middle of the 2019 season... handle that here
        console.log("version 2 format detected");

        // eval of the script should give us a data structure
        // like isVersion2 above
        eval(script);

        console.log(JSON.stringify(__gc_tournament_data__));

        if (__gc_tournament_data__ && __gc_tournament_data__.data) {
            tournament_string = __gc_tournament_data__.data;
        }
    }

    if (tournament_string === undefined) {
        console.log("Bad format for tournament data!");
        return null;
    }


    // console.log(tournament_string.substr(0, 30) + "..." + tournament_string.substr(-30));
    tournament_string = unescapeString(tournament_string);

    // console.log(tournament_string.substr(0, 1000));

    var tournament_data = null;

    try {
        tournament_data = JSON.parse(tournament_string);
    } catch (err) {
        console.log(err);
        console.log("tournament_string " + tournament_string);

        tournament_data = null;
    }
    return tournament_data;
}

var processPage = function (page, cb) {
    if (page) {
        //
        // parse the html to get at the tournament data
        //
        var $ = cheerio.load(page);

        var tournament_data = getTournamentData($);

        if (tournament_data != null) {
            cb(tournament_data);
            return true;
        } else {
            cb(null);
            return false;
        }

    } else {
        //            console.log("Error retrieving page: " + JSON.stringify(response));
        console.log("Error retrieving page!");
        cb(null);
    }

    return false;
}

//
// public interface
//

var GolfChannelPage = function () {

    this.get = function (url, cb) {
        var page = null;

        request.get(url, (error, response, body) => {

            if (error || response.statusCode != 200) {
                console.error("Error retrieving page.  Response code: " + (response) ? response.statusCode : undefined);
                console.error("Error message: " + JSON.stringify(error));
            } else {
                page = body;
            }

            var result = processPage(page, cb);

            if (!result) {
                console.error("Error parsing page " + url);
            }
        });

    };

};

module.exports = GolfChannelPage;
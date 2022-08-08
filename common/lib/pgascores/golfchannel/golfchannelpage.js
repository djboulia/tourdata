var request = require('request');
var cheerio = require('cheerio');

var SCRIPT_VARIABLE = "__gc_tournament_data__ = ";

/**
 * the tournament data is stored as a string in a script with
 * all sorts of escaped characters.  A normal JSON.parse doesn't seem
 * to process it.  I think there's an encoding/conversion issue somewhere
 * 
 * To fix, we munge it by converting unicode numbers and special characters
 * 
 * @param {String} string the content to be unescaped
 */
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

/**
 * Look for the SCRIPT tag that matches the tournament data variable
 * 
 * @param {Object} $ cheerio parser
 */
var findTournamentDataScript = function ($) {
    var result = undefined;

    var scripts = $('script');
    if (scripts != undefined) {
        // search each script tag for the right data
        console.log("found " + $(scripts).length + " scripts!");

        $(scripts).each(function (i, elem) {
            var script = $(this).text();

            var start = script.indexOf(SCRIPT_VARIABLE);
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


/**
 * version 1 of the tournament data had the
 * format __gc_tournament_data = "xxx";
 * where "xxx" was the data we're looking for
 * @param {String} script contents of a SCRIPT tag
 */
var isVersion1 = function (script) {
    var start = script.indexOf(SCRIPT_VARIABLE);

    var nextChar = script
        .substr(start + SCRIPT_VARIABLE.length, 1);

    // console.log("isVersion1: " + nextChar);

    if (nextChar === '"') {
        return true;
    }

    return false;
};

/**
 * version 2 of the tournament data has the format:
 *   __gc_tournament_data = {
 *     display = "full",
 *     scoring = "StrokePlay",
 *     data = "xxx"
 *   }
 * 
 *  where "xxx" is the data we're looking for
 * 
 * @param {String} script contents of a SCRIPT tag
 */
var isVersion2 = function (script) {
    var start = script.indexOf(SCRIPT_VARIABLE);

    var nextChar = script
        .substr(start + SCRIPT_VARIABLE.length, 1);

    // console.log("isVersion2: " + nextChar);

    if (nextChar === "{") {
        return true;
    }

    return false;
};

/**
 * get all script tags in a page, look for the tournament data and parse it
 * 
 * @param {Object} $ cheerio parser results
 */
var getTournamentData = function ($) {

    var script = findTournamentDataScript($);
    if (script === undefined) {
        console.log("Couldn't find tournament data script!");
        return null;
    }

    var tournament_string = undefined;

    if (isVersion1(script)) {
        console.log("version 1 format detected");

        // all event info now stored in this variable in the web page
        var start = script.indexOf(SCRIPT_VARIABLE);
        var end = script
            .substr(start + SCRIPT_VARIABLE.length)
            .indexOf('";');

        // console.log("start " + start + " end " + end);

        tournament_string = script.substr(start + SCRIPT_VARIABLE.length + 1, end - 1);
    } else if (isVersion2(script)) {
        // GC changed the format in the middle of the 2019 season... handle that here
        console.log("version 2 format detected");

        // eval of the script should give us a data structure
        // like isVersion2 above
        eval(script);

        // console.log(JSON.stringify(__gc_tournament_data__));

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
        // console.log("tournament_string " + tournament_string);

        tournament_data = null;
    }
    return tournament_data;
}

/**
 * The Golf Channel uses extensive client side java script to format
 * event results.  The tournament data can't be just scraped from the
 * html. Instead the data is in a variable in a SCRIPT tag.  Furthermore
 * the data is escaped inside a string.  So we first have to look at
 * all of the SCRIPT tags on the page, find the one with our variable,
 * the get the variable data and unescape it.  After all of that, it
 * can be parsed into a javascript object.
 * 
 * [djb 06/05/2020] 
 * In mid 2020, the golf channel went to a much easier JSON based approach
 * So we don't need to do any funky parsing of the SCRIPT tag in a page.
 * 
 * @param {String} page content of the page
 */
var parseEvent = function (page) {
    return new Promise((resolve, reject) => {
        if (!page) {
            //            console.log("Error retrieving page: " + JSON.stringify(response));
            reject("No page content!");
            return;
        }

        try {
            const event = JSON.parse(page);
            resolve(event);
        } catch (err) {
            console.log(err);
            console.log("page " + page);

            reject(err);
        }
    });
}


/**
 * In late 2019, the format changed from a single page that had both
 * schedule and tournament results, to a split format where the tour
 * schedule was hosted on a different page from the individual events
 * 
 * The new schedule format is an escaped string of JSON.  We unpack
 * that here
 * 
 * [djb 06/05/2020]
 * In mid 2020, yet another change occurred which moved the data
 * we're looking for to straight JSON.  Therefore we no longer have to 
 * parse the weird unescaped strings inside the html page.
 * 
 * @param {String} page content of the page
 */
var parseSchedule = function (page) {
    return new Promise((resolve, reject) => {

        if (!page) {
            //            console.log("Error retrieving page: " + JSON.stringify(response));
            reject("No page content!");
            return;
        }

        try {
            const schedule = JSON.parse(page);
            resolve(schedule);
        } catch (err) {
            console.log(err);
            console.log("page " + page);

            reject(err);
        }
    });
}


/**
 * Public interface.
 * 
 * Handles scraping and parsing the golf channel format for tour
 * schedule and individual events
 */
var GolfChannelPage = function () {

    /**
     * go get the specified URL, parse the content into an
     * event object
     */
    this.getEvent = function (url) {
        return new Promise((resolve, reject) => {

            request.get(url, (error, response, body) => {

                if (error || response.statusCode != 200) {
                    console.error("Error retrieving page.  Response code: " + (response) ? response.statusCode : undefined);
                    console.error("Error message: " + JSON.stringify(error));

                    reject(error);
                } else {

                    parseEvent(body)
                        .then((result) => {
                            resolve(result);
                        })
                        .catch((e) => {
                            console.error("Error parsing event " + url);
                            console.error(e);
                            reject(e);
                        });
                }
            });
        });
    };

    /**
     * go get the specified URL, parse the content into a
     * schedule object
     */
    this.getSchedule = function (url) {
        return new Promise((resolve, reject) => {

            request.get(url, (error, response, body) => {

                if (error || response.statusCode != 200) {
                    console.error("Error retrieving page.  Response code: " + (response) ? response.statusCode : undefined);
                    console.error("Error message: " + JSON.stringify(error));

                    reject(error);
                } else {
                    parseSchedule(body)
                        .then((result) => {
                            resolve(result);
                        })
                        .catch((e) => {
                            console.error("Error parsing schedule " + url);
                            console.error(e);
                            reject(e);
                        });
                }
            });
        });
    };
};

module.exports = GolfChannelPage;
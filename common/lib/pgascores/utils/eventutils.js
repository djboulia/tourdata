var NameUtils = require('./nameutils.js');

/**
 * utilties related to tournament events
 * 
 * @param {String} tournament_name The event name (e.g. The Masters)
 */
var EventUtils = function (tournament_name) {

    /**
     * look at the tournament name to figure out if this is a stroke play
     * or match play event
     */
    this.getFormat = function () {

        // most are stroke format, look for the exceptions
        var format = "stroke";

        var name = NameUtils.normalize(tournament_name);
        // console.log("normalized tournament name: " + name);

        if (name.includes("match_play") ||
            name.includes("presidents_cup") ||
            name.includes("ryder_cup")) {
            console.log("found match play event: " + name);
            format = "match";
        }

        return format;
    };

    /**
     * look at the tournament name to figure out if this is one of the
     * four majors: The Masters, US Open, Open Championship (British) and 
     * PGA Championship
     * 
     * Note: the (former) British Open has been renamed multiple times from
     *       140th Open Championship, to Open Championship to simply "The Open".
     *       So we try to catch all of those.
     */
    this.isMajor = function () {

        // most are not majors, look for the exceptions
        var major = false;

        var name = NameUtils.normalize(tournament_name);
        // console.log("normalized tournament name: " + name);

        if (name.includes("masters") ||
            name.includes("us_open") ||
            name === "the_open" ||
            name.includes("open_championship") ||
            name.includes("pga_championship")) {
            console.log("found major: " + name + " for tournament " + tournament_name);
            major = true;
        }

        return major;
    };

};

module.exports = EventUtils;
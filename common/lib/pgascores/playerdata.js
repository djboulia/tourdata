/**
 *
 * helper class for normalizing the player record obtained from the Golf Channel
 * to fit the format we are looking for
 *
 **/

var NameUtils = require('./utils/nameutils.js');
var GameUtils = require('./utils/gameutils.js');

var Logger = require('../logger.js');
var logger = new Logger(true);

var fixEmptyRoundScore = function (round, score, pos) {
    if (score == "") {
        if (pos == 'WD') {
            return 'WD';
        } else if (pos == 'CUT' && round > 2) {
            return 'MC';
        } else if (pos == 'DNS') {
            return 'DNS';
        } else if (pos == 'MDF') {
            return 'MDF';
        } else if (pos == 'DQ') {
            return 'DQ';
        } else {
            return '-';
        }
    } else {
        return score;
    }
};

var isValidScore = function (score) {
    // if it has anything but digits, that's bad
    if (String(score).search(/^\s*\d+\s*$/) != -1) {
        return true;
    }

    return false;
};

var withdrewFromTournament = function (record) {
    var pos = record.pos;

    return pos == 'WD';
};

//
// The Golf Channel lists scores for the round even if the player withdrew
// mid round (e.g. due to injury).  These are  bogus since they represent an incomplete,
// not posted round that's not a useful score.  Other providers like pgatour.com
// don't show these partial round scores.
//
// we try to look for invalid scores like this and just reset them to
// WD so that it doesn't invalidate other stats like low round of the day
//
// returns round number 1..4 if bogus round found, otherwise zero
//
var findBogusWithdrawalRound = function (record, par) {
    if (withdrewFromTournament(record)) {

        // walk backward looking for last round with a score
        for (var i = 4; i > 0; i--) {

            if (isValidScore(record[i])) {

                // is the score bogus relative to par?  For our purposes we'll assume
                // anything more than 5 under for a round is bogus when a player withdraws

                if ((parseInt(record[i]) - par) < -5) {

                    return i; // return bogus round
                }
            }
        }

    }

    return 0; // no bogus round found
};

//
// if you didn't make the cut (CUT), withdrew (WD), or did not start (DNS)
// you didn't finish the tournament
//
var finishedTournament = function (record) {
    var finished = true;
    var pos = record.pos;

    switch (pos) {

    case 'WD':
    case 'CUT':
    case 'DNS':
    case 'MDF':
    case 'DQ':
        finished = false;
        break;

    default:
        finished = true;
    }

    return finished;
};

//
// some tournaments implement a "secondary cut" after round 3
// check for that and set to MDF which means Made cut - Did not Finish
//
var missedSecondaryCut = function (record, eventInfo) {

    return GameUtils.tournamentComplete(eventInfo.start,
            eventInfo.end) &&
        data["4"] == "-";
}



//
// public interface
//

var PlayerData = function (data) {

    // data is player scoring information for this tournament.
    // It should be of the form:
    //
    // {
    //      "name": 'Jason Day',/* player name in First<sp>Last format */
    //      "1": "71",          /* round 1-4 scores.  '-' for rounds not played */
    //      "2": "72",
    //      "3": "72",
    //      "4": "73",
    //      "pos": "T7",        /* can be a score or status, e.g. "WD", "CUT", "DNS", "MDF"
    //      "total": "E",       /* total relative to par */
    //      "thru": "18",        /* how many holes played in last round (1-18) */
    //      "today": "+1",      /* score in last round played */
    //      "strokes": "288"    /* total strokes so far in tournament */
    // }
    //
    // unfortunately, it doesn't always come in from the back end service
    // provider (e.g. golfchannel.com) in exactly the right format.  so
    // we use this object to turn the data into the normalized format above

    this.data = data;

    this.normalize = function (eventInfo) {

        // this is where we fix up any anomalies from the input data
        data.name = NameUtils.formatGolfChannelName(data.name);
        data.id = NameUtils.normalize(data.name);

        // golfchannel site puts an "F" in the thru column when a round is finished
        // vs. other sites that indicate 18 when a round is finished.  We normalize
        // all F entries to 18 so that the thru field can always be treated as an integer
        if (data.thru == "F") {
            data.thru = "18";
        }

        // translate any empty round scores into an appropriate format
        for (var i = 1; i <= 4; i++) {
            data[i] = fixEmptyRoundScore(i, data[i], data.pos);
        }

        // if there is a tee time field, it means the player's round hasn't
        // started for the day.  our policy is to put the tee time in the
        // appropriate round field.  So if a player has a 12:20PM tee time
        // for the start of round 2, it would look like this:
        //
        // { ..., 1 : 68, 2 : "12:20PM", 3: "-", 4: "-" }
        //
        // we pick the round based on the first '-' we find
        if (data.time) {
            for (var i = 1; i <= 4; i++) {
                if (data[i] == '-') {

                    data[i] = data.time;
                    delete data.time;

                    data.thru = '-';
                    data.today = '-';

                    break;
                }
            }
        }

        // The Golf Channel site puts scores/blanks in even for players who didn't
        // make the cut, withdrew, etc.  We fix that here
        if (!finishedTournament(data)) {
            data.today = '-';
            data.thru = '-';
        }

        var round = findBogusWithdrawalRound(data, eventInfo.course.par);

        if (round > 0) {
            logger.log("Changing round " + round + " score to WD in player data " +
                JSON.stringify(data));

            data[round] = 'WD';
        }

        // strokes property can be blank if the player hasn't started yet.  fix that
        if (!isValidScore(data.strokes)) {
            data.strokes = '-';
        }

        if (missedSecondaryCut(data, eventInfo)) {
            logger.log("Setting round 4 score to MDF in record " + JSON.stringify(data));

            data["4"] = 'MDF';
            data.today = '-';
            data.thru = '-';
        }

        return data;
    };

};

module.exports = PlayerData;

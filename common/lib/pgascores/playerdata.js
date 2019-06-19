/**
 *
 * helper class for normalizing the player record obtained from the Golf Channel
 * to fit the format we are looking for
 *
 **/


var formatNetScore = function (score) {
    // pretty print the score with zero represented as "even"
    // and above par scores with a leading + sign
    if (score == 0) return "E";

    if (score > 0) return "+" + score;

    return String(score);
};

//
// if you didn't make the cut (CUT), withdrew (WD), or did not start (DNS) you
// didn't finish the tournament
//
var playerFinishedTournament = function (record) {
    var finished = true;
    var pos = record["pos"];

    if (pos == "WD") {
        finished = false;
    } else if (pos == "CUT") {
        finished = false;
    } else if (pos == "MDF") {
        finished = false;
    } else if (pos == "DNS") {
        finished = false;
    }

    return finished;
};

var isValidScore = function (score) {
    // if it has anything but digits, that's bad
    if (String(score).search(/^\s*\d+\s*$/) != -1) {
        return true;
    }

    return false;
};

var fixEmptyRoundScore = function (golfer, record) {
    if (golfer.status.toLowerCase() === "cut") {
        // console.log("cut player: " + JSON.stringify(record));

        if (record[3] == 0 || record[3] == '-') {
            record[3] = "CUT";
            record[4] = "CUT";
            record.pos = "CUT";
        } else {
            // some tournaments employ a secondary cut after day three
            // these players will still be "cut" but have a day 3
            // score. MDF == Made Cut Didn't Finish            
            record[4] = "MDF";
            record.pos = "MDF";
        }
    } else if (golfer.status.toLowerCase() === "did not start") {
        record[1] = "DNS";
        record[2] = "DNS";
        record[3] = "DNS";
        record[4] = "DNS";
        record.pos = "DNS";
    } else if (golfer.status.toLowerCase() === "withdrawn") {
        for (var rounds = 1; rounds <= 4; rounds++) {
            if (record[rounds] === '-') {
                record[rounds] = "WD";
            }
            record.pos = "WD";
        }
    } else if (golfer.status === "") {
        // look for the case where the golfer is still active in the
        // tournament, but has not completed all of his rounds
        // in this case, we put his tee time in the next scoring slot
        // this mimics old behavior in a prior golf data provider
        for (var round = 1; round <= 4; round++) {
            if (record[round] === '-') {
                record[round] = golfer.teeTime;
                break;
            }
        }
    }
};


//
// public interface
//

var PlayerData = function (golfer) {

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

    this.normalize = function () {
        var record = {
            name: "",
            strokes: '-',
            pos: "-",
            thru: '-',
            today: '-',
            total: '-',
            1: '-',
            2: '-',
            3: '-',
            4: '-'
        }

        record.name = golfer.firstName + " " + golfer.lastName;
        record.strokes = golfer.totalStrokes;

        if (golfer.position) {
            record.pos = golfer.position;
        }

        if (golfer.thruHole) {
            record.thru = golfer.thruHole;
        }

        if (golfer.todayPar != null) {
            record.today = formatNetScore(golfer.todayPar);
        }

        if (golfer.overallPar != null) {
            record.total = formatNetScore(golfer.overallPar);
        }

        for (var j = 0; j < golfer.leaderboardRounds.length; j++) {
            var roundInfo = golfer.leaderboardRounds[j];
            record[roundInfo.roundNumber] = roundInfo.roundScore;
        }

        fixEmptyRoundScore(golfer, record);

        // The Golf Channel site puts scores in even for players who didn't make the
        // cut, withdrew, etc.  We fix that here
        if (!playerFinishedTournament(record)) {
            record["today"] = '-';
            record["thru"] = '-';
        }

        // strokes can be blank if the player hasn't started yet.  fix that
        if (!isValidScore(record["strokes"])) {
            record["strokes"] = '-';
        }

        return record;
    };

    this.addRoundDetails = function( record, scorecards ) {
        // go through the scorecards, find this golfer's per hole
        // scoring information
        var golferId = golfer.golferId;

        for (var i=0; i<scorecards.length; i++) {
            var scorecard = scorecards[i];

            if (scorecard.golferId === golferId) {
                var round = scorecard.round;
                var currentRound = {
                    round_values: [],
                    par_values: [],
                    net_values: []
                };

                if (round == null) {
                    console.error("Found null round for " + record.name);
                    return record;
                }

                // console.log("found per hole scores for " + record.name + " round " + round);

                for (var j=1; j<=18; j++) {
                    currentRound.round_values.push("");
                    currentRound.par_values.push("");
                    currentRound.net_values.push("");
                }

                for (j=0; j<scorecard.scores.length; j++) {
                    var score = scorecard.scores[j];
                    var netScore = (score.score === "") ? "" : score.score - score.par;

                    currentRound.round_values[j] = score.score;
                    currentRound.par_values[j] = score.par;
                    currentRound.net_values[j] = (netScore === "") ? "" : formatNetScore(netScore);
                }

                // console.log(round.name + " round " + round + ": " + JSON.stringify(currentRound));

                if (!record.round_details) {
                    record.round_details = {};
                }
                record.round_details[round] = currentRound;
            }
        }

        return record;
    }
};

module.exports = PlayerData;
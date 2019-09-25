var PlayerData = require('./playerdata.js');

/**
 * Format details of a given tournament coming from the golf channel into 
 * our standard representation
 * 
 * @param {Boolean} includeDetails true to get per hole scoring details
 */
var EventData = function (includeDetails) {

    /**
     * debug function to dump the top level parts of the JSON structure
     * 
     * @param {Object} obj 
     */
    var dumpData = function (obj) {
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                console.log(key + " -> " + obj[key]);
            }
        }
    };

    /**
     * the incoming JSON object is enormous and contains a bunch
     * of stuff we wouldn't need to see.  This allows a check
     * of the data structures we're expecting to see in the object
     * 
     * @param {*} tournament_data 
     */
    var dumpTournamentData = function (tournament_data) {
        dumpData(tournament_data);
        console.log("leaderboard:");
        dumpData(tournament_data.leaderboard);
        console.log("scorecards[0]:");
        dumpData(tournament_data.leaderboard.scorecards[0]);
        if (tournament_data.leaderboard.scorecards[0]) {
            console.log("scores[0]:");
            dumpData(tournament_data.leaderboard.scorecards[0].scores[0]);
        }
        console.log("event:");
        dumpData(tournament_data.event);
        console.log("golfClubs[0]:");
        dumpData(tournament_data.event.golfClubs[0]);
        console.log("courses[0]:");
        dumpData(tournament_data.event.golfClubs[0].courses[0]);
    }

    var getEventDetails = function (event) {

        var courses = [];

        for (var i = 0; i < event.golfClubs.length; i++) {
            var club = event.golfClubs[i];

            for (var j = 0; j < club.courses.length; j++) {
                var course = club.courses[j];
                var record = {
                    name: course.name,
                    par: course.totalPar,
                    yardage: course.totalYardage
                }

                courses.push(record);
            }
        }

        return {
            name: event.name,
            start: event.startDate,
            end: event.endDate,
            purse: event.purse,
            course: courses[0]
        };
    };

    /**
     * Main entry point for the module.  Returns tournament data in a common format
     * 
     * @param {*} tournament_data 
     */
    this.normalize = function (tournament_data) {
        if (!tournament_data) {
            return null;
        }

        // dumpTournamentData(tournament_data);

        // we should have an object with a valid leaderboard and golfer array
        // check that first before we load up the players
        if (!tournament_data.leaderboard || !tournament_data.leaderboard.golfers) {
            console.log("Couldn't find golfer data!!");
            console.log(JSON.stringify(tournament_data.leaderboard));
            return null;
        }

        var records = [];
        var golfers = tournament_data.leaderboard.golfers;

        // console.log(JSON.stringify(golfers));

        for (var i = 0; i < golfers.length; i++) {
            var golfer = golfers[i];
            var player = new PlayerData(golfer);
            var record = player.normalize();

            if (includeDetails) {
                record = player.addRoundDetails(record, tournament_data.leaderboard.scorecards);
            }

            // console.log(JSON.stringify(record));

            records.push(record);
        }

        var eventInfo = getEventDetails(tournament_data.event);
        console.log("Found event " + JSON.stringify(eventInfo));

        var eventData = {
            "name": eventInfo.name,
            "start": eventInfo.start,
            "end": eventInfo.end,
            "course": eventInfo.course,
            "scores": records,
            "created_at": new Date()
        };

        return eventData;
    };


};

module.exports = EventData;
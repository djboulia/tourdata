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
     * @param {Object} tournament_data 
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

    /**
     * check to make sure the data structure is what we're expecting
     */
    this.isValid = function(tournament_data) {
        if (!tournament_data || !tournament_data.result) {
            // console.log("EventData.normalize: invalid tournament_data: " + JSON.stringify(tournament_data));
            console.log("EventData.isValid: invalid tournament_data: " + JSON.stringify(tournament_data));
            return false;
        }

        return true;
    };

    /**
     * Main entry point for the module.  Returns tournament data in a common format
     * 
     * [djb 06/05/2020]
     * Format of the object changed in mid 2020.  we handle that in here
     * 
     * @param {*} tournament_data 
     */
    this.normalize = function (tournament_data, eventDetails) {

        // new format 
        if (this.isValid(tournament_data)) {
            tournament_data = tournament_data.result;
        } else {
            return null;
        }

        // dumpTournamentData(tournament_data);

        // we should have an object with a valid leaderboard and golfer array
        // check that first before we load up the players
        if (!tournament_data.golfers) {
            console.log("Couldn't find golfer data!!");
            // console.log(JSON.stringify(tournament_data.leaderboard));
            return null;
        }

        var records = [];
        var golfers = tournament_data.golfers;

        // console.log(JSON.stringify(golfers));

        for (var i = 0; i < golfers.length; i++) {
            var golfer = golfers[i];
            var player = new PlayerData(golfer);
            var record = player.normalize();

            if (includeDetails) {
                record = player.addRoundDetails(record, tournament_data.scorecards);
            }

            // console.log(JSON.stringify(record));

            records.push(record);
        }

        var eventData = {
            "name": eventDetails.tournament.name,
            "start": eventDetails.startDate,
            "end": eventDetails.endDate,
            "course": eventDetails.courseDetails,
            "scores": records,
            "created_at": new Date()
        };

        return eventData;
    };


};

module.exports = EventData;
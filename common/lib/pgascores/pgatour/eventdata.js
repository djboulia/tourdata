const Player = require("./player");

/**
 * Format details of a given tournament coming from the pga tour into
 * our standard representation
 *
 * @param {Boolean} includeDetails true to get per hole scoring details
 */
const EventData = function (includeDetails) {
  /**
   * check to make sure the data structure is what we're expecting
   */
  this.isValid = function (tournament_data) {
    if (!tournament_data || !tournament_data.leaderboardV2) {
      console.log(
        "EventData.isValid: invalid tournament_data: " +
          JSON.stringify(tournament_data)
      );
      return false;
    }

    return true;
  };

  /**
   * Main entry point for the module.  Returns tournament data in a common format
   *
   * returned data structure for an event looks like this:
   * 
      {
        "name": "Fortinet Championship",
        "start": "2021-09-16T00:00:00",
        "end": "2021-09-19T00:00:00",
        "scores": [..],
        "created_at": "2024-01-06T16:29:54.440Z",
        "format": "stroke",
        "major": false
      }

      each score in scores[] above looks like this:
      {
          "1": 67,
          "2": 72,
          "3": 65,
          "4": 65,
          "name": "Max Homa",
          "strokes": 269,
          "pos": "1",
          "thru": 18,
          "today": "-7",
          "total": "-19",
          "round_details": {...} // see below
      }

   * @param {Object} tournament_data
   */
  this.normalize = function (tournament_data, eventDetails) {
    const leaderboard = tournament_data.leaderboardV2;
    // we should have an object with a valid leaderboard and golfer array
    // check that first before we load up the players
    if (!leaderboard) {
      console.log("Couldn't find golfer data!!");
      // console.log(JSON.stringify(tournament_data.leaderboard));
      return null;
    }

    const playerParser = new Player(includeDetails);
    const records = [];

    for (const player of leaderboard.players) {
      const record = playerParser.normalize(player);

      if (record) {
        // console.log("player:", record);
        records.push(record);
      } else {
        console.log(
          "EventData.normalize, skipping player record with invalid data: ",
          player
        );
      }
    }

    const eventData = {
      name: eventDetails.tournament.name,
      start: eventDetails.startDate,
      end: eventDetails.endDate,
      course: eventDetails.courseDetails,
      scores: records,
      created_at: new Date(),
    };

    return eventData;
  };
};

module.exports = EventData;

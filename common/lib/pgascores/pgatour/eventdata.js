const { formatNetScore } = require("../../utils/scorecard");

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

  const normalizeDetails = function (details) {
    const round_details = {};

    if (!details?.scorecardV2?.roundScores) {
      console.log("no round scores found");
      return undefined;
    }

    if (details?.scorecardV2?.roundScores) {
      for (const round of details?.scorecardV2?.roundScores) {
        console.log("round:", round);

        // console.log("round.firstNine.holes:", round?.firstNine?.holes);
        // console.log("round.secondNine.holes:", round?.secondNine?.holes);

        // round_details: {
        //   "1": {
        //         "round_values": [...],  // array of string scores for each hole, e.g. { "3", "4", "2", "5"}
        //         "par_values": [...],    // array of numbers representing par for each hole, e.g. { 3, 4, 2, 5 }
        //         "net_values": [...]     // array of string net par values for each hole , e.g ("E", "-1", "+1", etc.)
        //   }
        //   "2" {...}
        //   "3" {...}
        //   "4" {...}

        const details = {
          round_values: [],
          par_values: [],
          net_values: [],
        };

        for (const hole of round?.firstNine?.holes) {
          console.log("hole:", hole);

          details.round_values.push(`${hole?.score}`);
          details.par_values.push(hole?.par);
          details.net_values.push(formatNetScore(hole?.score - hole?.par));
        }

        for (const hole of round?.secondNine?.holes) {
          console.log("hole:", hole);

          details.round_values.push(`${hole?.score}`);
          details.par_values.push(hole?.par);
          details.net_values.push(formatNetScore(hole?.score - hole?.par));
        }

        round_details[`${round.roundNumber}`] = details;
      }
    }

    return round_details;
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

      if includeDetails is true, each score will also have a round_details{} object
      which consist of each round with hole by hole details per round:

      round_details: {
        "1": {
              "round_values": [...],  // array of string scores for each hole, e.g. { "3", "4", "2", "5"}
              "par_values": [...],    // array of numbers representing par for each hole, e.g. { 3, 4, 2, 5 }
              "net_values": [...]     // array of string net par values for each hole , e.g ("E", "-1", "+1", etc.)
        }
        "2" {...}
        "3" {...}
        "4" {...}
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

    var records = [];
    for (const player of leaderboard.players) {
      const record = {
        1: player.rounds[0],
        2: player.rounds[1],
        3: player.rounds[2],
        4: player.rounds[3],
        name: player.player?.displayName,
        strokes: player.totalStrokes,
        pos: player.position,
        thru: player.thru === "F*" ? 18 : player.thru,
        today: player.score,
        total: player.total,
      };

      if (includeDetails) {
        record.round_details = normalizeDetails(player.details);
      }

      console.log("player:", record);
      records.push(record);
    }

    var eventData = {
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

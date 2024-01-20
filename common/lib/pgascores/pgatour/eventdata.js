const { formatNetScore } = require("../../utils/scorecard");
const PlayerDetails = require("./playerdetails");

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

  var fixEmptyRoundScore = function (golfer, record) {
    if (record.pos.toLowerCase() === "cut") {
      // console.log("cut player: " + JSON.stringify(record));

      if (record[3] == 0 || record[3] == "-") {
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
    } else if (record.pos.toLowerCase() === "wd") {
      for (var rounds = 1; rounds <= 4; rounds++) {
        if (record[rounds] === "-") {
          record[rounds] = "WD";
        }
        record.pos = "WD";
      }
    } else if (record.pos.toLowerCase() === "dq") {
      for (var rounds = 1; rounds <= 4; rounds++) {
        if (record[rounds] === "-") {
          record[rounds] = "DQ";
        }
        record.pos = "DQ";
      }
    }
    // TODO: does this state exist in the new API?
    //
    // } else if (golfer.status.toLowerCase() === "did not start") {
    //   record[1] = "DNS";
    //   record[2] = "DNS";
    //   record[3] = "DNS";
    //   record[4] = "DNS";
    //   record.pos = "DNS";
    // else if (golfer.status === "") {
    //   // look for the case where the golfer is still active in the
    //   // tournament, but has not completed all of his rounds
    //   // in this case, we put his tee time in the next scoring slot
    //   // this mimics old behavior in a prior golf data provider
    //   for (var round = 1; round <= 4; round++) {
    //     if (record[round] === "-") {
    //       record[round] = golfer.teeTime;
    //       break;
    //     }
    //   }
    // }
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

      note that pos above will indicate the position of the player in the tournament -OR-
      it will be a string like "CUT", "MDF", "DNS", "DQ", or "WD" indicating the player did not make the cut
      Addiitonally any rounds that are unplayed will contain the same string to indicate why there was no round score

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
    const playerDetails = new PlayerDetails();

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
      // the player list can actually include non player data
      // check the type to make sure it's a valid player record
      if (player["__typename"] === "PlayerRowV2") {
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

        fixEmptyRoundScore(player, record);

        if (includeDetails) {
          record.round_details = playerDetails.normalize(player.details);
        }

        // console.log("player:", record);
        records.push(record);
      } else {
        console.log(
          "EventData.normalize, skipping player record with invalid typename: ",
          player
        );
      }
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

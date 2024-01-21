const PlayerDetails = require("./playerdetails");

/**
 * Format details of a player into our standard representation
 *
 * @param {Boolean} includeDetails true to get per hole scoring details
 */
const Player = function (includeDetails) {
  const fixEmptyRoundScore = function (golfer, record) {
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

  const parseThru = function (thru) {
    // pgatour site uses a * sometimes... not clear why, but get rid of it
    if (thru.endsWith("*")) {
      thru = thru.substring(0, thru.length - 1);
    }

    if (thru === "F") {
      return 18;
    } else {
      const thruNumber = parseInt(thru);
      if (isNaN(thruNumber)) {
        return thru;
      } else {
        return thruNumber;
      }
    }
  };

  /**
   * Main entry point for the module.  Returns tournament data in a common format
   *
   * returned data structure for a player looks like this:
   * 
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
   * @param {Object} tournament_data
   */
  this.normalize = function (player, rounds) {
    const playerDetails = new PlayerDetails();

    // the player list can actually include non player data
    // check the type to make sure it's a valid player record
    if (player["__typename"] !== "PlayerRowV2") return undefined;

    const record = {
      1: player.rounds[0],
      2: player.rounds[1],
      3: player.rounds[2],
      4: player.rounds[3],
      name: player.player?.displayName,
      strokes: player.totalStrokes,
      pos: player.position,
      thru: parseThru(player.thru),
      today: player.score,
      total: player.total,
    };

    // console.log(`thru original: ${player.thru} parsed: ${record.thru}`);

    fixEmptyRoundScore(player, record);

    if (includeDetails) {
      record.round_details = playerDetails.normalize(player.id, rounds);
    }

    return record;
  };
};

module.exports = Player;

var TourDataProvider = require('../pgascores/tourdataprovider.js');
var ScoreCard = require('../utils/scorecard.js');

var perHoleScoring = function (round_details) {
  var stats = {
    dblEaglePlus: 0,
    eagle: 0,
    birdie: 0,
    par: 0,
    bogie: 0,
    dblBogie: 0,
    other: 0,
    score: 0
  };

  for (var j = 1; j <= 4; j++) {
    var index = j.toString();

    if (round_details[index]) {
      var round_values = round_details[index].round_values;
      var net_values = round_details[index].net_values;

      // per hole scoring:
      //    Double eagle or better : 13 pts
      //    eagle                  : 8 pts
      //    birdie                 : 3 pts
      //    par                   : 0.5 pts
      //    bogie                 : -0.5 pts
      //    double bogey          : -1 pts
      //    worse than double     : -1 pts

      for (var hole = 0; hole < net_values.length; hole++) {

        var netScore = ScoreCard.parseNetScore(net_values[hole]);

        if (isNaN(netScore)) { // unplayed hole, don't add to scoring
          stats.score += 0;
        } else if (netScore < -2) { // dbl eagle or better
          stats.score += 13;
          stats.dblEaglePlus++;
        } else if (netScore == -2) { // eagle
          stats.score += 8;
          stats.eagle++;
        } else if (netScore == -1) { // birdie
          stats.score += 3;
          stats.birdie++;
        } else if (netScore == 0) { // par
          stats.score += .5;
          stats.par++;
        } else if (netScore == 1) { // bogie
          stats.score += -.5;
          stats.bogie++;
        } else if (netScore == 2) { // double or worse
          stats.score += -1;
          stats.dblBogie++;
        } else { // double or worse
          stats.score += -1;
          stats.other++;
        }

      }
    }
  }

  return stats;
};

var positionScoring = function (posString) {

  var pos = ScoreCard.parsePosition(posString);

  var stats = {
    pos: pos,
    score: 0
  };

  // position scoring:
  //    1st : 30 pts
  //    2nd : 20
  //    3rd : 18
  //    4th : 16
  //    5th : 14
  //    6th : 12
  //    7th : 10
  //    8th : 9
  //    9th : 8
  //    10th : 7
  //    11-15th : 6
  //    16-20th : 5
  //    21-25th : 4
  //    26-30th : 3
  //    31-40th : 2
  //    41-50th : 1

  if (pos == 1) {
    stats.score += 30;
  } else if (pos == 2) {
    stats.score += 20;
  } else if (pos == 3) {
    stats.score += 18;
  } else if (pos == 4) {
    stats.score += 16;
  } else if (pos == 5) {
    stats.score += 14;
  } else if (pos == 6) {
    stats.score += 12;
  } else if (pos == 7) {
    stats.score += 10;
  } else if (pos == 8) {
    stats.score += 9;
  } else if (pos == 9) {
    stats.score += 8;
  } else if (pos == 10) {
    stats.score += 7;
  } else if (pos >= 11 && pos <= 15) {
    stats.score += 6;
  } else if (pos >= 16 && pos <= 20) {
    stats.score += 5;
  } else if (pos >= 21 && pos <= 25) {
    stats.score += 4;
  } else if (pos >= 26 && pos <= 30) {
    stats.score += 3;
  } else if (pos >= 31 && pos <= 40) {
    stats.score += 2;
  } else if (pos >= 41 && pos <= 50) {
    stats.score += 1;
  }

  return stats;
};

var streakScoring = function (round_details) {
  var stats = {
    birdieStreaks: 0,
    bogieFreeRounds: 0,
    allRoundsSub70: true,
    holeInOnes: 0,
    score: 0,
  }

  var roundsPlayed = 0;

  for (var j = 1; j <= 4; j++) {
    var index = j.toString();

    //  debug
    //    stats.round = {};
    //    stats.round[index] = {};
    //    stats.round[index].birdieStreak = 0;
    //    stats.round[index].net_values = [];
    //    stats.round[index].streak = [];
    //    stats.round[index].hasBirdieStreak = [];

    if (round_details[index]) {

      var round_values = round_details[index].round_values;
      var net_values = round_details[index].net_values;

      var roundTotal = 0;
      var bogieFree = true;
      var consecutiveBirdies = 0;
      var hasBirdieStreak = false;

      var validScores = 0;

      // streak and bonus scoring:
      //    Streak of 3 birdies or better (one per round) : 3 pts
      //    Bogie free round              : 3 pts
      //    All 4 round under 70 strokes  : 5 pts
      //    Hole in one                   : 5 pts

      for (var hole = 0; hole < net_values.length; hole++) {
        var score = parseInt(round_values[hole])
        var netScore = ScoreCard.parseNetScore(net_values[hole]);

        //        stats.round[index].net_values.push(netScore < 0) ;

        if (isNaN(netScore)) {
          break;
        }

        if (netScore < 0) {
          consecutiveBirdies++;

          if (consecutiveBirdies >= 3) {
            hasBirdieStreak = true;
          }

          // if (consecutiveBirdies > stats.round[index].birdieStreak) {
          //   stats.round[index].birdieStreak = consecutiveBirdies;
          // }

        } else {
          consecutiveBirdies = 0; // reset
        }
        //        stats.round[index].streak.push(consecutiveBirdies) ;
        //        stats.round[index].hasBirdieStreak.push(hasBirdieStreak) ;


        if (netScore > 0) {
          bogieFree = false;
        }

        roundTotal += score;

        if (score == 1 && netScore == -2) {
          console.log("Found a hole in one!");
          stats.holeInOnes++;
          stats.score += 5;
        }

        validScores++;
      }

      // if we found a full round, update rounds played
      if (validScores == 18) {
        console.log("found a full round of scores");
        roundsPlayed++;
      }

      if (hasBirdieStreak) {
        console.log("Found birdie streak!");
        stats.birdieStreaks++;
        stats.score += 3;
      }

      if (bogieFree && validScores > 0) {
        console.log("Found bogie free round!");
        stats.bogieFreeRounds++;
        stats.score += 3;
      }

      if (roundTotal >= 70) {
        stats.allRoundsSub70 = false;
      }

    }
  }

  if (stats.allRoundsSub70 && (roundsPlayed > 0)) {
    console.log("Found 4 rounds under 70!");
    stats.score += 5;
  } else {
    stats.allRoundsSub70 = false; // don't set to true until at least one round in progress
  }

  return stats;
};

/**
 *	getScores
 *
 *	@year 			: year this tournament took place
 *  @tour           : tour name (e.g. pga-tour)
 *  @event          : event name (e.g. us-open)
 *	@callback 		: will be called back with eventdata as only argument
 *		 			  eventdata : object with player data mixed with scoring data
 */
exports.getScores = function (tour, year, event, callback) {
  console.log("getting fantasy scoring for " + tour + " " + year + " " + event);

  const provider = new TourDataProvider(tour, year);
  
  provider.getEvent(event, true)
    .then((eventdata) => {
      if (eventdata == null) {

        console.log("PGA event call failed!");
        callback(null);

      } else {

        var scores = eventdata.scores;

        for (var i = 0; i < scores.length; i++) {
          var score = scores[i];
          var score_details = {};

          console.log("round_details " + JSON.stringify(score.round_details));

          score_details.holeStats = perHoleScoring(score.round_details);
          score_details.positionStats = positionScoring(score.pos);
          score_details.streakStats = streakScoring(score.round_details);

          score_details.multiplier = (eventdata.major) ? 2 : 1; // Major tournamnets are 2x

          score_details.total = (score_details.holeStats.score +
            score_details.positionStats.score +
            score_details.streakStats.score) * score_details.multiplier;

          score.score_details = score_details;
        }

        callback(eventdata);
      }
    })
    .catch((e) => {
      callback(null);
    })

};
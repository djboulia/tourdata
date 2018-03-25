var Tournaments = require('../pgascores/tournaments.js');
var ScoreCard = require('../utils/scorecard.js');

var perHoleScoring = function(round_details) {
  var totalScore = 0;

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
        if (netScore < -2) { // dbl eagle or better
          totalScore += 15;
        } else if (netScore == -2) { // eagle
          totalScore += 8;
        } else if (netScore == -1) { // birdie
          totalScore += 3;
        } else if (netScore == 0) { // par
          totalScore += .5;
        } else if (netScore == 1) { // bogie
          totalScore += -.5;
        } else { // double or worse
          totalScore += -1;
        }
      }
    }
  }

  return totalScore;
};

var positionScoring = function(pos) {
  var totalScore = 0;

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
    totalScore += 30;
  } else if (pos == 2) {
    totalScore += 20;
  } else if (pos == 3) {
    totalScore += 18;
  } else if (pos == 4) {
    totalScore += 16;
  } else if (pos == 5) {
    totalScore += 14;
  } else if (pos == 6) {
    totalScore += 12;
  } else if (pos == 7) {
    totalScore += 10;
  } else if (pos == 8) {
    totalScore += 9;
  } else if (pos == 9) {
    totalScore += 8;
  } else if (pos == 10) {
    totalScore += 7;
  } else if (pos >= 11 && pos <= 15) {
    totalScore += 6;
  } else if (pos >= 16 && pos <= 20) {
    totalScore += 5;
  } else if (pos >= 21 && pos <= 25) {
    totalScore += 4;
  } else if (pos >= 26 && pos <= 30) {
    totalScore += 3;
  } else if (pos >= 31 && pos <= 40) {
    totalScore += 2;
  } else if (pos >= 41 && pos <= 50) {
    totalScore += 1;
  }

  return totalScore;
};

var streakScoring = function(round_details) {
  var totalScore = 0;
  var allRoundsSub70 = true;

  for (var j = 1; j <= 4; j++) {
    var index = j.toString();

    if (round_details[index]) {
      var round_values = round_details[index].round_values;
      var net_values = round_details[index].net_values;

      var roundTotal = 0;
      var bogieFree = true;
      var birdieStreak = 0;
      var longestBirdieStreak = 0;

      // streak and bonus scoring:
      //    Streak of 3 birdies or better (one per round) : 3 pts
      //    Bogie free round              : 3 pts
      //    All 4 round under 70 strokes  : 5 pts
      //    Hole in one                   : 5 pts

      for (var hole = 0; hole < net_values.length; hole++) {
        var score = parseInt(round_values[hole])
        var netScore = ScoreCard.parseNetScore(net_values[hole]);

        if (netScore < 0) {
          birdieStreak++;
        } else {
          if (birdieStreak > longestBirdieStreak) {
            longestBirdieStreak = birdieStreak;
          }
          birdieStreak = 0; // reset
        }

        if (netScore > 0) {
          bogieFree = false;
        }

        roundTotal += score;

        if (score == 1 && netScore == -2) {
          console.log("Found a hole in one!");
          totalScore += 5;
        }
      }

      if (longestBirdieStreak > 2) {
        console.log("Found birdie streak!");
        totalScore += 3;
      }

      if (bogieFree) {
        console.log("Found bogie free round!");
        totalScore += 3;
      }

      if (roundTotal >= 70) {
        allRoundsSub70 = false;
      }
    }
  }

  if (allRoundsSub70) {
    console.log("Found 4 rounds under 70!");
    totalScore += 5;
  }

  return totalScore;
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
exports.getScores = function(tour, year, event, callback) {
  console.log("getting fantasy scoring for " + tour + " " + year + " " + event);

  Tournaments.getEvent(tour, year, event, true, function(eventdata) {
    if (eventdata == null) {

      console.log("PGA event call failed!");
      callback(null);

    } else {
      var scores = eventdata.scores;

      for (var i = 0; i < scores.length; i++) {
        var score = scores[i];
        var score_details = {};

        score_details.hole = perHoleScoring(score.round_details);
        score_details.position = positionScoring(i + 1);
        score_details.streak = streakScoring(score.round_details);
        score_details.multiplier = (eventdata.major) ? 2 : 1; // Major tournamnets are 2x
        score_details.total = (score_details.hole +
          score_details.position +
          score_details.streak) * score_details.multiplier;

        score.score_details = score_details;
      }

      callback(eventdata);
    }
  });

};

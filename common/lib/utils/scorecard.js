  exports.parseNetScore = function(score) {
    // parse a score in net format, e.g. -3, E, +1
    // returns NaN if the score isn't valid

    if (typeof score === 'string' || score instanceof String) {
      // look for special case of "even" par as "E"
      if (score.toUpperCase() == "E") {
        return 0;
      }

    }

    return parseInt(score);
  };

  exports.formatNetScore = function(score) {
    // pretty print the score with zero represented as "even"
    // and above par scores with a leading + sign
    if (score == 0) return "E";

    if (score > 0) return "+" + score;

    return String(score);
  };

  exports.isValidScore = function(score) {
    // if it has anything but digits, that's bad
    if (String(score).search(/^\s*\d+\s*$/) != -1) {
      return true;
    }

    return false;
  };

  exports.isValidNetScore = function(score) {
    return !isNaN(this.parseNetScore(score));
  };

  exports.isNumber = function(str) {
    var result = parseInt(str);
    return !isNaN(result);
  };

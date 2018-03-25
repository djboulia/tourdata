exports.tournamentComplete = function(event) {
  var end = Date.parse(event.end);

  end = end + (1000 * 59 * 60 * 24); // go to end of the day

  //    console.log("tournamentComplete: " + start + ", ending " + end);
  return end < Date.now();
};

exports.tournamentInProgress = function(start, end) {
  var start = Date.parse(start);
  var end = Date.parse(end);
  var now = Date.now();

  end = end + (1000 * 59 * 60 * 24); // go to end of the day

  //    console.log("tournamentInProgress: start: " + start + " end: " + end + " now: " + now);

  return (now > start) && (now < end);
};
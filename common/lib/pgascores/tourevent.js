/**
 *
 *	Get tournament results from the Golf Channel site.
 *
 *  I've tried multiple options over the past few years to get consistent tour data.
 *  First Yahoo! Sports, then the PGA tour site
 *  The PGA Tour site is flaky with historical data... it used to have the PGA championship
 *  past leaderboards (prior to 2016) but then stopped listing past events.  The Golf Channel
 *  seems to have the data, so we use that for tournament data going forward.
 *
 **/

var PlayerData = require('./playerdata.js');
var TourDataProvider = require('./tourdataprovider.js');
var Config = require('./utils/config.js');

var config = new Config();

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

var dumpData = function (obj) {
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      console.log(key + " -> " + obj[key]);
    }
  }
}

//
// the incoming JSON object is enormous and contains a bunch
// of stuff we wouldn't need to see.  This allows a check
// of the data structures we're expecting to see in the object
//
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

var TourEvent = function (tour, year, gcid, eventid) {

  this.getUrl = function () {
    return "https://www.golfchannel.com/tournament/" + gcid;
  }

  this.getId = function () {
    // create a unique id we can use for caching and for 
    // searching the archives

    var id = config.archive.getTourEventId(year, tour, eventid);
    return id;
  }

  this.normalize = function (includeDetails, tournament_data) {
    if (!tournament_data) {
      return null;
    }

    dumpTournamentData(tournament_data);

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

  this.get = function (details, callback) {

    var self = this;

    //
    // get tour schedule from our back end data source

    var provider = new TourDataProvider(year);

    provider.get(self, function (records) {

      if (provider.isGolfChannel()) {
        // need to post process golf channel data before
        // returning it
        records = self.normalize(details, records);
      }

      callback(records);
    });

  };

}


module.exports = TourEvent;
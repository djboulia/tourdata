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

var request = require('request');
var cheerio = require('cheerio');

var NameUtils = require('./utils/nameutils.js');
var PlayerData = require('./playerdata.js');
var Parser = require('./utils/htmlparser.js');
var ScoreCard = require('../utils/scorecard.js');
var CacheModule = require('./utils/cache.js');

var pageCache = new CacheModule.Cache(60 * 10); // cache for ten minutes

//
// expects a string in Month dd-dd, yyyy
// or Month dd-Month dd, yyyy format
//
var parseDateRange = function(str) {
  console.log("parseDateRange: " + str);

  var dateparts = str.split('-');
  var startdate = dateparts[0];
  var startdateparts = startdate.split(' ');
  var startmonth = startdateparts[0];
  var startday = startdateparts[1];

  var enddate = dateparts[1];
  var enddateparts = enddate.split(',');

  var endmonth = startmonth;
  var endday = enddateparts[0];

  if (isNaN(parseInt(endday))) {
    var parts = endday.split(' ');

    // end month is in the result, parse that
    endmonth = parts[0];
    endday = parts[1];
  }

  var year = enddateparts[1];

  console.log('start: ' + startmonth + ' ' + startday + ',' + year);
  console.log('end: ' + endmonth + ' ' + endday + ',' + year);

  return {
    start: new Date(startmonth + ' ' + startday + ',' + year),
    end: new Date(endmonth + ' ' + endday + ',' + year),
  };
};

var getEventDetails = function($) {
  //
  // labels for the fields we want to keep
  //
  var fields = [
    "name",
    "par",
    "yardage",
    "purse"
  ];

  // get table data
  var eventDetails = $('div.currentTourHeadingTitle');

  if (eventDetails == undefined) {
    console.log("Couldn't find event details!");
    return null;
  }

  var eventName = Parser.text($('h1', eventDetails));
  var details = $('div#tourteaser', eventDetails);
  var courseDetails = details; // $('div#infoBar', details);
  var eventDate = Parser.text($('h4', details));
  var dateRange = parseDateRange(eventDate);

  var ndx = 0;
  var courseInfo = {};

  $('span', courseDetails).each(function(i, span) {
    var key = null;

    if (ndx < fields.length) {
      key = fields[ndx];
    }

    if (key) {

      switch (key) {
        case 'par':
        case 'yardage':
        case 'purse':
          //
          // expect these fields to contain Title:<sp>Data
          //
          var words = Parser.words($(this));

          courseInfo[key] = words[1]; // only take the data portion

          break;

        default:
          courseInfo[key] = Parser.text($(this));
      }
    }

    ndx++;
  });

  var purse = courseInfo['purse'];
  courseInfo['purse'] = undefined;

  return {
    name: eventName,
    start: dateRange.start,
    end: dateRange.end,
    purse: purse,
    course: courseInfo
  };
};

//
// labels for the fields we want to keep
//
var fieldsComplete = [
  null, // 0: don't keep this field, which has no data
  "pos", // 1: position on the leaderboard
  null, // 2: don't keep this field, which has movement up/down the rankings (not interesting)
  "name", // 3: player name
  "total",
  "thru",
  "today",
  "1", // 7-10: scores for each round
  "2",
  "3",
  "4",
  "strokes" // 11: total number of strokes
];

//
// labels for the fields we want to keep
//
var fieldsInProgress = [
  null, // 0: don't keep this field, which has no data
  "pos", // 1: position on the leaderboard
  null, // 2: don't keep this field, which has movement up/down the rankings (not interesting)
  "name", // 3: player name
  "total",
  "time", // 5: tee time
  "1", // 7-10: scores for each round
  "2",
  "3",
  "4",
  "strokes" // 10: total number of strokes
];

//
// return the right field mapping based on whether the tournament is in progress
// or not.  we detect that by looking at the cell count, which changes from
// a table showing starting tee time to one where the player's current round
// progress is displayed
//
var getFields = function(cells) {

  var fields = null;

  if (cells.length == 11) {
    console.log("cells.length == 11, round in progress");

    fields = fieldsInProgress;
  } else {
    fields = fieldsComplete;
  }

  return fields;
};

var getUrl = function(year, tour, event) {
  return "http://www.golfchannel.com/tours/" + tour + "/" + year + "/" + event;
};

//
// return an array of inline script content from the html page
//
var getInlineScripts = function($) {

  var scriptTags = $('script').get();
  var length = scriptTags.length;
  console.log("script tags: " + length);

  var scripts = [];

  for (var i = 0; i < length; i++) {
    // scripts can be external <script src="http://foo.bar"></script>
    // or inline <script>var foo=bar;</script>
    // inline scripts are those without a src attribute
    var src = scriptTags[i].attribs['src'];

    if (!src) {
      var inline = scriptTags[i].children[0].data;

      scripts.push(inline);
    }
  }

  return scripts;
};

//
// tournament round details are contained in an inline script from the source
// webpage.  we look for the right inline script and parse the JSON
// structure to get at the tournament details.
//
var parseRoundDetails = function($) {

  var scripts = getInlineScripts($);

  for (var i = 0; i < scripts.length; i++) {
    var inline = scripts[i];

    // look for an inline script that has the tournamentJSON
    // the golf channel puts this in the web page for use by
    // browser side scripts to show per-round detail of a
    // tournament. we can parse this info as a JSON structure
    // to get all of the detailed round stats.

    if (inline.includes('tournamentJSON')) {
      console.log("tournamentJSON found!");

      var beginString = "tournamentJSON = ";
      var endString = ";\n  $('body').data";

      var start = inline.indexOf(beginString);
      var end = inline.indexOf(endString);

      if (start > 0 && end > 0) {
        var tournamentJSON = JSON.parse(inline.substring(start + beginString.length, end));
        console.log("tournament=" + tournamentJSON.title + ", defending champ=" + tournamentJSON.defending_champ);
        console.log(JSON.stringify(tournamentJSON), null, 2);

        return tournamentJSON;
      }
    }
  }

  console.log("ERROR: did not find tournament round details!");

  return null;
};

var findPlayer = function(players, name) {
  for (var prop in players) {
    var player = players[prop];

    playerName = NameUtils.formatGolfChannelName(player.name);

    if (name === playerName) {
      return player;
    }
  }

  return null;
};

var getRoundNetValues = function(round, courses) {
  var net_values = [];
  var course = courses[round.course_id];
  var round_values = round.round_values;

  if (course) {
    for (var i = 0; i < round_values.length; i++) {
      var score = round_values[i];
      var hole_number = (i + 1).toString();
      var par = course.holes[hole_number].par;

      var net = ScoreCard.isNumber(score) ? ScoreCard.formatNetScore(parseInt(score) - parseInt(par)) : "";

      net_values.push(net);
    }
  } else {
    console.log("ERROR: invalid course id!");
  }

  return net_values;
};

var getRoundParValues = function(index, player, courses) {
  var round = player.score_cards[index];
  var par_values = [];
  var course = courses[round.course_id];

  if (course && course.holes) {
    console.log("found course :" + course.id + " holes " + course.holes.length);

    for (var i = 1; i <= 18; i++) {
      var hole  = course.holes[i];
      var par = (hole) ? hole.par : "";

      par_values.push(par);
    }
  } else {
    console.log("ERROR: invalid course id!");
  }

  return par_values;
};


var addRoundDetails = function(records, players, courses) {

  for (var i = 0; i < records.length; i++) {
    var record = records[i];

    var player = findPlayer(players, record.name);
    if (!player) {
      console.log("ERROR: invalid JSON tournament info for " + record.name);
    } else {
      var details = {};

      for (var j = 1; j <= 4; j++) {
        var index = j.toString();

        if (player.score_cards[index]) {
          var round_values = player.score_cards[index].round_values;
          var net_values = getRoundNetValues(player.score_cards[index], courses);
          var par_values = getRoundParValues(index, player, courses);

          console.log("par_values " + JSON.stringify(par_values));

          details[index] = {
            "round_values": round_values,
            "net_values": net_values,
            "par_values": par_values
          };
        }
      }

      record.round_details = details;
    }
  }
};

var getPage = function(url, cb) {
  var page = pageCache.get(url);

  // check cache first, return that if we have it already
  if (page) {
    process.nextTick(function() {
      cb(page);
    });
  } else {
    // nope, go to the web and get it
    request.get(url, (error, response, body) => {

      if (!error && response.statusCode == 200) {
        page = body;

        // save it in the cache for next time
        pageCache.put(url, page);

      } else {
        console.error("Error retrieving page.  Response code: " + response.statusCode);
        console.error("Error message: " + JSON.stringify(error));
      }

      cb(page);

    });
  }

}

exports.getEvent = function(tour, year, event, details, callback) {

  var url = getUrl(year, tour, event);

  console.log("url : " + url);

  getPage(url, function(html) {
    if (html) {

      var $ = cheerio.load(html);

      var eventInfo = getEventDetails($);

      if (!eventInfo) {
        callback(null);
        return;
      }

      var start = eventInfo.start;
      var year = start.getFullYear();

      // get table data
      var table = $('table.gc_leaderboard');
      if (table == undefined) {
        console.log("Couldn't find event table!");
        callback(null);
        return;
      }

      var row = 0;
      var records = [];

      // process each row in the table
      $('tr.playerRow', table).each(function(i, tr) {

        var cells = Parser.cells($, tr);
        var playerFields = getFields(cells);
        var record = Parser.mapFields(cells, playerFields);

        if (record) {
          var player = new PlayerData(record);

          player.normalize(eventInfo);

          // console.log(JSON.stringify(player.data));

          records.push(player.data);

          // console.log( "row=" + row + " name=" + record.name);
        }

        row++;
      });

      if (details) {
        var roundDetails = parseRoundDetails($);

        // match up per round information with the players in the field
        var players = roundDetails.scoreboard.players;
        var courses = roundDetails.courses;

        addRoundDetails(records, players, courses);
      }

      callback({
        "name": eventInfo.name,
        "start": eventInfo.start,
        "end": eventInfo.end,
        "course": eventInfo.course,
        "scores": records,
        "created_at": new Date()
      });
    } else {
      // console.log("Error retrieving page: " + JSON.stringify(response));
      console.log("Error retrieving page: " + url);
      callback(null);
    }
  });
};

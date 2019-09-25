var GolfChannelPage = require('./golfchannelpage.js');
var GolfChannelArchive = require('./golfchannelarchive.js');
var ScheduleData = require('./scheduledata.js');
var EventData = require('./eventdata.js');
var Cache = require('../utils/cache.js');

var page = new GolfChannelPage();

/**
 * handle current year golf channel requests.  Will check the archive first
 * and then go to the web if necessary to retrieve the event or schedule
 * 
 * encapsulate the basic golf channel tour data (schedule and events)
 * in an object. Implements an in-memory cache which will 
 * be checked first.  If no cache hit, then we will look
 * to see if we've archived it.  Finally, we'll go out to
 * the web to check the live site.
 * 
 * @param {String} tour pro tour, PGA is only valid one at this point
 * @param {Number} year year to get schedule and event info
 * @param {Object} pageCache (optional) cache object for pages
 */
var GolfChannelCurrent = function (tour, year, pageCache) {

    if (!pageCache) {
        const defaultCacheMs = 10000;
        console.log("No cache provided, defaulting to " + defaultCacheMs / 1000 + "s.");

        pageCache = new Cache(defaultCacheMs);
    }

    const archive = new GolfChannelArchive(tour, year, pageCache);

    /**
     * translate between our event ids and the Golf Channel site
     * we do this by looking up the tour schedule from the golf channel, finding
     * the event that matches, then looking up the event via the url that the 
     * Golf Channel expects
     * 
     * @param {string} eventid 
     * @param {Function} callback 
     */
    this.getEventFromWeb = function (eventid, callback) {

        this.getSchedule(function (results) {
            if (results == null) {
                console.log("getSchedule() failed!");
                callback(null);

            } else {

                if (eventid >= results.length) {
                    console.log("error!  invalid event id found!");
                    callback(null);
                    return;
                }

                var result = results[eventid];

                console.log("found id " + result.tournament.id + " for event " + eventid);

                var gcid = result.tournament.id; // golf channel id
                const url = "https://www.golfchannel.com/tournament/" + gcid;

                console.log("event url " + url);

                // no cache or archive hit, go to the web
                page.get(url, function (tournament_data) {
                    callback(tournament_data);
                });
            }
        });
    };

    this.getScheduleUrl = function () {
        //
        // [djb 04/15/2017] the URL for the golf channel now requires that you put in a year and tournament
        //                  name just to search on other years.  so we just use 2016 and the safeway open
        //                  the old URL didn't require this:
        //                  "http://www.golfchannel.com/tours/" + tour + "/?t=schedule&year=" + year;
        //
        // [djb 04/23/2019] changed URL again. :-(  Previously was this:
        //                  return "http://www.golfchannel.com/tours/" + tour + "/2016/safeway-open/?t=schedule&year=" + year;
        //

        var url = "https://www.golfchannel.com/tours/" + tour + "/" + year + "/schedule";
        console.log("TourSchedule.getUrl: " + url);
        return url;
    };

    /**
     * go get the tournament data
     * check cache, archive, and finally the URL
     */
    this.getEvent = function (eventid, details, cb) {
        const self = this;

        // look in the archive first, then go to web if necessary
        archive.getEvent(eventid, details, function (result) {
            if (result) {
                cb(result);
            } else {
                var id = archive.getEventId(eventid);
                var eventData = new EventData(details);

                console.log("no archive item found, going to web");
                self.getEventFromWeb(eventid, function (tournament_data) {
                    if (tournament_data) {
                        // save it in the cache for next time
                        pageCache.put(id, tournament_data);
                    }

                    // need to post process golf channel data before
                    // returning it
                    var records = eventData.normalize(tournament_data);
                    cb(records);
                });
            }
        });
    };

    /**
     * check cache, archive, and finally the URL
     */
    this.getSchedule = function (cb) {

        // look in the archive first, then go to web if necessary
        archive.getSchedule(function (result) {
            if (result) {
                cb(result);
            } else {
                const url = this.getScheduleUrl();
                const id = archive.getScheduleId();
                const scheduleData = new ScheduleData(tour, year);

                console.log("no archive item found, going to web");

                // no cache or archive hit, go to the web
                page.get(url, function (tournament_data) {
                    if (tournament_data) {
                        // save it in the cache for next time
                        pageCache.put(id, tournament_data);
                    }

                    // need to post process golf channel data before
                    // returning it
                    var records = scheduleData.normalize(tournament_data);
                    cb(records);
                });
            }
        });
    };

    /**
     * check if we've archived the event previously
     * 
     * @returns true if the schedule exists in the archive, false otherwise
     */
    this.isEventArchived = function (eventid, cb) {
        archive.isEventArchived(eventid, cb);
    };

    /**
     * check if we've archived this season already
     * 
     * @returns true if the schedule exists in the archive, false otherwise
     */
    this.isScheduleArchived = function (cb) {
        archive.isScheduleArchived(cb);
    };

    /**
     * go get event from the web and put it in the archive
     */
    this.archiveEvent = function (eventid, cb) {

        // go get content from the web and store result
        this.getEventFromWeb(eventid, function (tournament_data) {
            if (tournament_data) {
                archive.putEvent(eventid, tournament_data, function (result) {
                    cb(result);
                });
            }
        });
    };

    /**
     * go get schedule from the web and put it in the archive
     */
    this.archiveSchedule = function (cb) {
        const url = this.getScheduleUrl();

        // go get it from the web and store result
        page.get(url, function (tournament_data) {
            if (tournament_data) {
                archive.putSchedule(tournament_data, function (result) {
                    cb(result);
                })
            }
        });

    };
}

module.exports = GolfChannelCurrent;
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

    const baseUrl = "https://www.golfchannel.com";

    this.getEventUrl = function (id) {
        //
        // [djb 06/05/2020] Changed in mid 2020 season... prior URL:
        //                  const url = baseUrl + "/tournament/" + id;

        const url = baseUrl + "/api/v2/events/" + id + "/leaderboard";
        console.log("GolfChannelCurrent.getEventUrl: " + url);
        return url;
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
        //
        // [djb 09/25/2019] Changed for 2020 season... prior URL:
        //                  return "https://www.golfchannel.com/tours/" + tour + "/" + year + "/schedule";
        //
        // [djb 06/05/2020] Changed in mid 2020 season... prior URL:
        //                  const url = "https://www.golfchannel.com/api/Tour/GetTourEvents/1?year=" + year;

        const url = baseUrl + "/api/v2/tours/1/events/" + year;
        console.log("GolfChannelCurrent.getScheduleUrl: " + url);
        return url;
    };

    var getEventDetails = function (results, eventid) {
        if (results == null) {
            const str = "getSchedule() failed!";
            console.log(str);
            return undefined;
        }

        const scheduleData = new ScheduleData(tour, year);
        const record = scheduleData.findEvent(results, eventid);

        return record;
    };

    /**
     * translate between our event ids and the Golf Channel site
     * we do this by looking up the tour schedule from the golf channel, finding
     * the event that matches, then looking up the event via the url that the 
     * Golf Channel expects
     * 
     * @param {string} eventid 
     * @param {Function} callback 
     */
    this.getEventFromWeb = function (eventid) {
        const self = this;

        return new Promise((resolve, reject) => {
            this.getSchedule()
                .then((results) => {
                    const result = getEventDetails(results, eventid);
                    if (result == undefined) {
                        reject("Error retrieving schedule details for event " + eventid);
                        return;
                    }

                    console.log("found id " + result.tournament.id + " for event " + eventid);

                    const gcid = result.tournament.id; // golf channel id
                    const url = self.getEventUrl(gcid);

                    // no cache or archive hit, go to the web
                    page.getEvent(url)
                        .then((data) => {
                            resolve(data);
                        })
                        .catch((e) => {
                            reject(e);
                        })
                })
                .catch((e) => {
                    reject(e);
                });
        });
    };

    /**
     * go get the tournament data
     * check cache, archive, and finally the URL
     */
    this.getEvent = function (eventid, details) {
        return new Promise((resolve, reject) => {
            const self = this;

            self.getSchedule()
                .then((results) => {
                    const eventDetails = getEventDetails(results, eventid);
                    if (eventDetails == undefined) {
                        reject("Error retrieving schedule details for event " + eventid);
                        return;
                    }

                    console.log("found id " + eventDetails.tournament.id + " for event " + eventid);

                    const eventData = new EventData(details);

                    // look in the archive first, then go to web if necessary
                    archive.getEvent(eventid, details)
                        .then((tournament_data) => {
                            if (tournament_data) {
                                // need to post process golf channel data before
                                // returning it
                                const records = eventData.normalize(tournament_data, eventDetails);

                                resolve(records);
                            } else {
                                const id = archive.getEventId(eventid);

                                console.log("no archive item found, going to web");
                                self.getEventFromWeb(eventid)
                                    .then((tournament_data) => {
                                        // need to post process golf channel data before
                                        // returning it
                                        const records = eventData.normalize(tournament_data, eventDetails);

                                        if (records) {
                                            // if we parsed the data correctly, 
                                            // save it in the cache for next time
                                            pageCache.put(id, tournament_data);
                                        }
                                        resolve(records);
                                    })
                                    .catch((e) => {
                                        reject(e);
                                    });
                            }
                        })
                        .catch((e) => {
                            reject(e);
                        });
                }).catch((e) => {
                    reject(e);
                });
        });
    };

    /**
     * check cache, archive, and finally the URL
     */
    this.getScheduleFromWeb = function () {
        return new Promise((resolve, reject) => {
            const url = this.getScheduleUrl();
            const id = archive.getScheduleId();
            const scheduleData = new ScheduleData(tour, year);

            console.log("going to web for schedule");

            // no cache or archive hit, go to the web
            page.getSchedule(url)
                .then((tournament_data) => {
                    // need to post process golf channel data before
                    // returning it
                    const records = scheduleData.normalize(tournament_data);

                    if (records) {
                        // if we parsed the data correctly, 
                        // save it in the cache for next time
                        pageCache.put(id, tournament_data);
                    }
                    resolve(records);
                })
                .catch((e) => {
                    reject(e);
                })
        });
    };

    /**
     * check cache, archive, and finally the URL
     */
    this.getSchedule = function () {
        const self = this;

        return new Promise((resolve, reject) => {
            const scheduleData = new ScheduleData(tour, year);

            // look in the archive first, then go to web if necessary
            archive.getSchedule()
                .then((tournament_data) => {
                    if (tournament_data) {
                        // need to post process golf channel data before
                        // returning it
                        const records = scheduleData.normalize(tournament_data);

                        resolve(records);
                    } else {
                        console.log("no archive item found, going to web");

                        self.getScheduleFromWeb()
                            .then((records) => {
                                resolve(records);
                            })
                            .catch((e) => {
                                reject(e);
                            });

                    }
                })
                .catch((e) => {
                    reject(e);
                })
        });
    };

    /**
     * check if we've archived the event previously
     * Promise resolves if true, rejects otherwise
     */
    this.isEventArchived = function (eventid) {
        return archive.isEventArchived(eventid);
    };

    /**
     * check if we've archived this season already
     * Promise resolves if true, rejects otherwise
     */
    this.isScheduleArchived = function () {
        return archive.isScheduleArchived();
    };

    /**
     * go get event from the web and put it in the archive
     */
    this.archiveEvent = function (eventid) {
        return new Promise((resolve, reject) => {
            const eventData = new EventData(false);

            // go get content from the web and store result
            this.getEventFromWeb(eventid)
                .then((tournament_data) => {
                    if (eventData.isValid(tournament_data)) {
                        archive.putEvent(eventid, tournament_data)
                            .then((result) => {
                                resolve(result);
                            })
                            .catch((e) => {
                                reject(e);
                            })
                    } else {
                        reject("archiveEvent failed: invalid tournament_data found");
                    }
                })
                .catch((e) => {
                    reject(e);
                })
        });
    };

    /**
     * go get schedule from the web and put it in the archive
     */
    this.archiveSchedule = function () {
        return new Promise((resolve, reject) => {
            const url = this.getScheduleUrl();
            const scheduleData = new ScheduleData(tour, year);

            // go get it from the web and store result
            page.getSchedule(url)
                .then((tournament_data) => {
                    if (tournament_data) {
                        // make sure the schedule is valid
                        const records = scheduleData.normalize(tournament_data);

                        if (records) {
                            archive.putSchedule(tournament_data)
                                .then((result) => {
                                    resolve(result);
                                })
                                .catch((e) => {
                                    reject(e);
                                })
                        } else {
                            reject("archiveSchedule failed! Invalid schedule data!");
                        }
                    }
                })
                .catch((e) => {
                    reject(e);
                })
        });
    };
}

module.exports = GolfChannelCurrent;
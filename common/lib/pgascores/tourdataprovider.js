var Cache = require('./utils/cache.js');
var GolfChannelTourData = require('./golfchannel/golfchannelcurrent.js');
var PGATourData = require('./pgatourarchive.js');
var EventUtils = require('./utils/eventutils.js');

/**
 * Use one cache provider for all instances of PGA archive
 */
var pgaArchiveCache = new Cache(60 * 60 * 24 * 30); // archive data doesn't change; keep for 30 days
var golfChannelCache = new Cache(60 * 5); // 5 min cache

/**
 * Normalize our tour name to what the tour provider will expect
 * 
 * @param {String} tour name of tour, PGA currently the only one accepted
 */
var normalizeTourName = function (tour) {
    var tourname = "";

    switch (tour) {
        case 'pga':
            tourname = 'pga-tour';
            break;
            // case 'european':
            //     tourname = 'european-tour';
            //     break;
        default:
            console.error("Invalid tour name " + tour);
    }

    return tourname;
};

var createEventUrl = function (tour, year, index) {
    // build the path to get details about this individual tournament
    return '/' + year + '/tour/' + tour + '/event/' + index;
};

var formatScheduleResults = function (tour, year, results) {
    // golf channel data returns a series of records, each representing a
    // tour stop in the season.  Each record has the following fields:
    //
    //  startDate
    //  endDate
    //  purse
    //  winner
    //  major
    //  format
    //  tournament : {
    //    name : tournament name
    //    courses[] : array of courses played in this event
    //    url : golf channel url for this event
    //    tour : tour name
    //    year : event year
    //    id : event id on golf channel site
    //  }
    //

    const records = [];

    for (var i = 0; i < results.length; i++) {
        const result = results[i];
        const record = {};
        const eventUtils = new EventUtils(result.tournament.name);

        record.startDate = new Date(result.startDate);
        record.endDate = new Date(result.endDate);

        record.tournament = result.tournament.name;
        record.link = {
            rel: "self",
            href: createEventUrl(tour, year, i)
        };
        record.courses = result.tournament.courses;
        record.format = eventUtils.getFormat();
        record.major = eventUtils.isMajor();

        record.purse = result.purse;
        record.winner = result.winner;

        records.push(record);
    }

    return records;
};


/**
 * This module encapsulates the various changes to back end data providers
 * so that there is a consistent API for getting season and event info.
 * 
 * I've switched data sources over the years based on data
 * availability.  In the past the pgatour.com web site 
 * provided the best data.  But in more recent years,
 * golfchannel.com has been the source of more detailed
 * per hole stroke data.  Furthermore, the sites are not 
 * reliable about keeping the old data around, so I've stored
 * the prior years in an object storage archive.  Depending
 * on the year, the source changes, so we figure that out here
 * 
 * @param {String} tour which pro tour.  Currently pga is all that's supported 
 * @param {Number} year tour year.  note that PGA tour year actually begins
 *                      the year before.  e.g. 2019 began in Sep 2018. You can't
 *                      make this stuff up.
 */

var TourDataProvider = function (tour, year) {

    const tourName = normalizeTourName(tour);

    const pgaTourData = new PGATourData(tourName, year, pgaArchiveCache);
    const golfChannelTourData = new GolfChannelTourData(tourName, year, golfChannelCache);

    var isGolfChannel = function () {
        return year >= 2013;
    };

    /**
     * [djb 06/08/2020] switched over to the golf channel data for all
     *                  prior years. Originally the GC site only had the
     *                  last two years of data.  But it has since added
     *                  prior years, so we just use that for all years.
     *                  I'm leaving this code in here in case I have to revert
     *                  to other data providers in the future.
     */
    var isPGATour = function () {
        return false;   // see comment above
    };

    var promiseError = function (str) {
        return new Promise((resolve, reject) => {
            console.log(str);
            reject(str);
        });
    };

    /**
     * internal entry point for getting schedule information.  will return all
     * events for the season, including the eventids for each event
     * 
     * Use getEvent below to retrieve specific event details.
     * 
     * @returns a Promise object
     */
    var getScheduleFromProvider = function () {
        if (isGolfChannel()) {
            return golfChannelTourData.getSchedule();
        } else if (isPGATour()) {
            return pgaTourData.getSchedule();
        } else {
            return promiseError("No data available for year " + year);
        }
    };

    /**
     * internal entry point for getting event data for a tournament within a season
     * 
     * @param {String} eventid  the event id for this tour event
     * @param {Boolean} details true to include per hole scoring details (only
     *                          supported in Golf Channel provider)
     * @returns a Promise object
     */
    var getEventFromProvider = function (eventid, details, cb) {
        if (isGolfChannel()) {
            return golfChannelTourData.getEvent(eventid, details);
        } else if (isPGATour()) {
            if (details) {
                // old PGA tour site data didn't provide per hole details
                return promiseError("Details data not available for year " + year);
            } else {
                return pgaTourData.getEvent(eventid);
            }
        } else {
            return promiseError("No data available for year " + year);
        }
    };

    /**
     * main entry point for getting schedule information.  will return all
     * events for the season, including the eventids for each event
     * 
     * Use getEvent below to retrieve specific event details.
     * 
     * @returns a Promise object
     */
    this.getSchedule = function () {
        return new Promise((resolve, reject) => {

            if (!tourName) {
                const str = "Invalid tour name!";
                console.log(str);
                reject(str);
                return;
            }

            getScheduleFromProvider()
                .then((results) => {
                    if (results == null) {
                        const str = "getSchedule() failed!";
                        console.log(str);
                        reject(str);
                    } else {

                        var records = formatScheduleResults(tour, year, results);

                        resolve({
                            "schedule": records,
                            "created_at": new Date()
                        });
                    }
                })
                .catch((e) => {
                    console.error(e);
                    reject(e);
                })
        });
    };

    /**
     * main entry point for getting event data for a tournament within a season
     * 
     * @param {String} eventid  the event id for this tour event
     * @param {Boolean} details true to include per hole scoring details (only
     *                          supported in Golf Channel provider)
     * @returns a Promise object
     */
    this.getEvent = function (eventid, details) {
        return new Promise((resolve, reject) => {

            if (!tourName) {
                const str = "Invalid tour name!";
                console.log(str);
                reject(str);
                return;
            }

            console.log("getting tour info for " + tourName + " " + year + " eventid " + eventid);

            getEventFromProvider(eventid, details)
                .then((eventdata) => {
                    if (eventdata == null) {
                        const str = "getEvent() failed!";
                        console.log(str);
                        reject(str);
                    } else {
                        const eventUtils = new EventUtils(eventdata.name);
                        const format = eventUtils.getFormat();
                        const major = eventUtils.isMajor();

                        console.log("format " + format + " major " + major);
                        console.log("eventdata.name " + JSON.stringify(eventdata.name));

                        eventdata.format = format;
                        eventdata.major = major;

                        resolve(eventdata);
                    }
                })
                .catch((e) => {
                    console.error(e);
                    reject(e);
                })
        });
    };

};

module.exports = TourDataProvider;
var Cache = require('./utils/cache.js');
var GolfChannelTourData = require('./golfchannel/golfchannelcurrent.js');
var PGATourData = require('./pgatourarchive.js');

/**
 * Use one cache provider for all instances of PGA archive
 */
var pgaArchiveCache = new Cache(60 * 60 * 24 * 30); // archive data doesn't change; keep for 30 days
var golfChannelCache = new Cache(60 * 5); // 5 min cache

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

    var pgaTourData = new PGATourData(tour, year, pgaArchiveCache); 
    var golfChannelTourData = new GolfChannelTourData(tour, year, golfChannelCache); 
    
    this.isGolfChannel = function () {
        return year >= 2019;
    };

    this.isPGATour = function () {
        return year >= 2013 && year < 2019;
    };

    /**
     * main entry point for getting schedule information.  will return all
     * events for the season, including the eventids for each event
     * 
     * Use getEvent below to retrieve specific event details.
     * 
     * @param {function} cb     callback with records for this event
     */
    this.getSchedule = function (cb) {
        if (this.isGolfChannel()) {

            golfChannelTourData.getSchedule(cb);
        } else if (this.isPGATour()) {

            pgaTourData.getSchedule(cb);
        } else {
            console.log("No data available for year " + year);
            cb(null);
        }
    };

    /**
     * main entry point for getting event data for a tournament within a season
     * 
     * @param {Boolean} details true to include per hole scoring details (only
     *                          supported in Golf Channel provider)
     * @param {String} eventid  the event id for this tour event
     * @param {function} cb     callback with records for this event
     */
    this.getEvent = function (eventid, details, cb) {
        if (this.isGolfChannel()) {
            golfChannelTourData.getEvent(eventid, details, cb);
        } else if (this.isPGATour()) {
            if (details) {
                // old PGA tour site data didn't provide per hole details
                console.log("Details data not available for year " + year);
                cb(null);
            } else {
                pgaTourData.getEvent(eventid, cb);
            }
        } else {
            console.log("No data available for year " + year);
            cb(null);
        }
    };


};

module.exports = TourDataProvider;
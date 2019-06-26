var GolfChannelTourData = require('./golfchannelcache.js');
var PGATourData = require('./pgatourarchive.js');

var golfChannelTourData = new GolfChannelTourData(60 * 5); // 5 min cache
var pgaTourData = new PGATourData(60 * 60 * 24 * 30); // archive data doesn't change; keep for 30 days

// I've switched data sources over the years based on data
// availability.  In the past the pgatour.com web site 
// provided the best data.  But in more recent years,
// golfchannel.com has been the source of more detailed
// per hole stroke data.  Furthermore, the sites are not 
// reliable about keeping the old data around, so I've stored
// the prior years in an object storage archive.  Depending
// on the year, the source changes, so we figure that out here

var TourDataProvider = function (year) {
 
    this.isGolfChannel = function () {
        return year >= 2019;
    };

    this.isPGATour = function () {
        return year >= 2013 && year <= 2019;
    };

    //
    // the request object needs to implement two methods:
    //  getUrl: to tell the data provider where to look if it has to 
    //          go to the web to retrieve data
    //  getId: the unique id for this request in object storage or cache
    //
    this.get = function (request, cb) {
        if (this.isGolfChannel()) {
            golfChannelTourData.get(request, cb);
        } else if (this.isPGATour()) {
            pgaTourData.get(request, cb);
        } else {
            console.log("No data available for year " + year);
            cb(null);
        }
    };

};

module.exports = TourDataProvider;
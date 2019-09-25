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

var TourDataProvider = require('./tourdataprovider.js');

var TourEvent = function (tour, year, eventid) {

  this.get = function (details, callback) {

    //
    // get tour schedule from our back end data source
    var provider = new TourDataProvider(tour, year); 
    
    provider.getEvent(eventid, details, function (records) {
      callback(records);
    });

  };

}


module.exports = TourEvent;
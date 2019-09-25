/**
 *
 *	return the tour schedule for the year. currently the only supported tours are:
 *      PGA and European tours
 *  This will return the schedule information for each stop on the chosen tour, including:
 *      - name of tournament
 *      - names of course(s) played
 *      - dates of tournament
 *      - url for specific tournament data
 *
 **/

var TourDataProvider = require('./tourdataprovider.js');

var TourSchedule = function (tour, year) {

  this.get = function (callback) {

    //
    // get tour schedule from our back end data source

    var provider = new TourDataProvider(tour, year);

    provider.getSchedule( function (records) {

      callback(records);
    });

  };
}

module.exports = TourSchedule;
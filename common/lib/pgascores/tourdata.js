var GolfChannelPage = require('./golfchannelpage.js');
var CacheModule = require('./utils/cache.js');
var Storage = require('./utils/storage.js');


// 
// encapsulate the basic tour data (schedule and events)
// in an object. Implements an in-memory cache which will 
// be checked first.  If no cache hit, then we will look
// to see if we've archived it.  Finally, we'll go out to
// the web to check the live site.
//
var TourData = function (timeMs) {
    var pageCache = new CacheModule.Cache(timeMs);
    var page = new GolfChannelPage();
    var pageArchive = new Storage('tourdata-gc-pga');

    //
    // check cache, archive, and finally the URL
    //
    var getPage = function (request, cb) {
        var url = request.getUrl();
        var id = request.getId();

        var tournament_data = pageCache.get(id);

        // check cache first, return that if we have it already
        if (tournament_data) {
            process.nextTick(function () {
                cb(tournament_data);
            });
        } else {

            // go to the archives next
            pageArchive.exists(id)
            .then((result) => {
                if (result) {
                    console.log("found item in archive!");

                    pageArchive.get(id)
                    .then((tournament_data) => {
                        if (tournament_data) {
                            // save it in the cache for next time
                            pageCache.put(id, tournament_data);
                        }

                        cb(tournament_data);
                    });
                } else {
                    console.log("no archive item found, going to web");

                    // no cache or archive hit, go to the web
                    page.get(url, function (tournament_data) {
                        if (tournament_data) {
                            // save it in the cache for next time
                            pageCache.put(id, tournament_data);
                        }
        
                        cb(tournament_data);
                    });
                }
            });
        }
    }

    this.getSchedule = function (request, cb) {

        console.log("url : " + request.getUrl() + " id : " + request.getId());

        getPage(request, cb);
    }

    this.getEvent = function (request, cb) {

        console.log("url : " + request.getUrl() + " id : " + request.getId());

        getPage(request, cb);
    }
}

module.exports = TourData;
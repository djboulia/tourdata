var libPath = '../../common/lib';
var pgaLibPath = libPath + '/pgascores';
var TourDataProvider = require(pgaLibPath + '/tourdataprovider.js')

var Logger = require(libPath + '/utils/logger.js');
logger = new Logger(false);


module.exports = function (Tournament) {

    var app = require('../server');

    /**
     * /search
     *
     * tournament/search?year=2016&tour=pga
     *
     * returns the tour events that match the specified search parameters
     *
     **/
    Tournament.search = function (tour, year, cb) {

        var str = "searching for tournaments in year " + year + " and tour " + tour;
        logger.log(str);

        var provider = new TourDataProvider(tour, year);
        provider.getSchedule()
            .then((results) => {
                logger.debug(JSON.stringify(results));

                cb(null, results);
            })
            .catch((e) => {
                cb(e, null);
            });
    };

    Tournament.remoteMethod(
        'search', {
            http: {
                path: '/search',
                verb: 'get'
            },
            description: 'Search for tournaments',

            accepts: [{
                    arg: 'tour',
                    type: 'string',
                    description: 'Tour name, e.g. PGA, European',
                    http: {
                        source: 'query'
                    },
                    required: true
                },
                {
                    arg: 'year',
                    type: 'number',
                    description: 'Year to search, e.g. 2016',
                    http: {
                        source: 'query'
                    },
                    required: true
                }
            ],
            returns: {
                arg: 'tournaments',
                type: 'object',
                root: true
            }
        }
    );

    /**
     *
     * validate search arguments
     *
     **/
    Tournament.beforeRemote('search', function (context, unused, next) {
        if (context.args.tour) {
            var tour = context.args.tour.toLowerCase();

            logger.debug('beforeRemote: found tour= ' + tour);

            switch (tour.toLowerCase()) {
                case 'pga':
                case 'european':
                    break;

                default:
                    next(new Error('Invalid value for tour: ' + tour));
                    return;
            }
        } else {
            next(new Error("Couldn't find tour search argument!"));
            return;
        }

        if (context.args.year) {
            var year = context.args.year;
            var thisMonth = new Date().getMonth();
            var thisYear = new Date().getFullYear();

            // next  year's PGA tour season starts in September of the
            // year before... so once we hit September, allow next
            // year as a valid year.
            var maxYear = (thisMonth >= 8) ? thisYear + 1 : thisYear;

            if (year < 2003 || year > maxYear) {
                next(new Error("Invalid year " + year));
                return;
            }
        } else {
            next(new Error("Couldn't find year search argument!"));
            return;
        }

        // if we fall through to here, we validated all arguments
        next();
    });


    Tournament.scores = function (tour, year, event, details, cb) {

        var str = "getting scores for year " + year + " tour " + tour + " event " + event + " details " + details;

        logger.log(str);

        var provider = new TourDataProvider(tour, year);
        provider.getEvent(event, details)
            .then((results) => {
                //            logger.debug(JSON.stringify(results));
                cb(null, results);
            })
            .catch((e) => {
                cb(e, null);
            })
    };


    Tournament.remoteMethod(
        'scores', {
            http: {
                path: '/:year/tour/:tour/event/:event',
                verb: 'get'
            },
            description: 'Get golfer scores for this event',

            accepts: [{
                    arg: 'tour',
                    type: 'string',
                    description: 'pga or european',
                    required: true
                },
                {
                    arg: 'year',
                    type: 'number',
                    description: 'golf season this event occurred in',
                    required: true
                },
                {
                    arg: 'event',
                    type: 'string',
                    description: 'unique id for this event',
                    required: true
                },
                {
                    arg: 'details',
                    type: 'boolean',
                    description: 'true to include per hole and per round data',
                    http: {
                        source: 'query'
                    },
                    required: false
                },
            ],
            returns: {
                arg: 'scores',
                type: 'object',
                root: true
            }
        }
    );
};
var me = '73533436-838f-4812-ae5c-1341294dd1d1-bluemix';
var password = "864416b31a5c61deec2eeab3537af0dbd2d21315ea6ffc862303d4b024b4d636";
var dbName = 'tourdata';

var cloudant = require('cloudant')({
    account: me,
    password: password
});
var db = cloudant.use(dbName);

var libPath = '../../common/lib';
var pgaLibPath = libPath + '/pgascores';

var Logger = require(libPath + '/logger.js');
logger = new Logger(true);


module.exports = function (Tournament) {

    var app = require('../server');
    var schedule = require(pgaLibPath + '/tourschedule.js')

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

        schedule.getSchedule(tour, year, function (results) {
            logger.debug(JSON.stringify(results));

            cb(null, results);
        });
    };

    Tournament.remoteMethod(
        'search', {
            http: {
                path: '/search',
                verb: 'get'
            },
            description: 'Search for tournaments',

            accepts: [
                {
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
            var thisYear = new Date().getFullYear();

            if (year < 2003 || year > thisYear) {
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


    Tournament.scores = function (year, tour, event, cb) {

        var scores = require(pgaLibPath + '/golfchannelprovider.js')
        var str = "getting scores for year " + year + " tour " + tour + " event " + event;

        logger.log(str);

        scores.getEvent(year, tour, event, function (results) {
            logger.debug(JSON.stringify(results));

            cb(null, results);
        });

    };


    Tournament.remoteMethod(
        'scores', {
            http: {
                path: '/:year/tour/:tour/event/:event',
                verb: 'get'
            },
            description: 'Get golfer scores for this event',

            accepts: [
                {
                    arg: 'year',
                    type: 'number',
                    required: true
                },
                {
                    arg: 'tour',
                    type: 'string',
                    required: true
                },
                {
                    arg: 'event',
                    type: 'string',
                    required: true
                }
            ],
            returns: {
                arg: 'scores',
                type: 'object',
                root: true
            }
        }
    );
};
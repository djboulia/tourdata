var libPath = '../../common/lib';
var pgaLibPath = libPath + '/pgascores';

var Logger = require(libPath + '/utils/logger.js');
logger = new Logger(false);

module.exports = function (Rankings) {

    /**
     * /search
     *
     * rankings/search?year=2016&tour=pga
     *
     * returns the tour events that match the specified search parameters
     *
     **/
    Rankings.search = function (tour, year, cb) {
        var rankings = require(pgaLibPath + '/worldrankings.js');

        var str = "searching for rankings in year " + year + " and tour " + tour;
        logger.log(str);

        rankings.getRankings(tour, year, function (results) {
            logger.debug(JSON.stringify(results));

            cb(null, results);
        });
    };

    Rankings.remoteMethod(
        'search', {
            http: {
                path: '/search',
                verb: 'get'
            },
            description: 'Search for rankings',

            accepts: [
                {
                    arg: 'tour',
                    type: 'string',
                    description: 'Tour name. PGA is currently the only valid value.',
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
                arg: 'rankings',
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
    Rankings.beforeRemote('search', function (context, unused, next) {
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

};

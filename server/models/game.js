var libPath = '../../common/lib';
var Fantasy = require(libPath + '/games/fantasy.js')

var Logger = require(libPath + '/utils/logger.js');
logger = new Logger(false);


module.exports = function (Game) {

    var app = require('../server');

    Game.scores = function (tour, year, event, cb) {

      var str = "getting scores for year " + year + " tour " + tour + " event " + event;

        logger.log(str);

        Fantasy.getScores(tour, year, event, function (results) {
            logger.debug(JSON.stringify(results));

            cb(null, results);
        });

    };


    Game.remoteMethod(
        'scores', {
            http: {
                path: '/:year/tour/:tour/event/:event',
                verb: 'get'
            },
            description: 'Get golfer scores for this event',

            accepts: [
                {
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

//
// access config data in loop back server/config.local.json
//

var Config = function () {
    // get config info stored in loopback server/config.local.json
    var app = require('../../../../server/server');

    this.get = function (key) {

        var obj = app.get(key);
        return obj;
    };
};

module.exports = Config;
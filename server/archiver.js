/**
 * this is an alternate boot script that can be used to load up
 * the object store with prior year tour data.  this is good for re-seeding
 * the object store when a format change happens in the golf channel site
] */

var loopback = require('loopback');
var boot = require('loopback-boot');

var app = module.exports = loopback();

app.start = function () {
    const tour = 'pga-tour';
    const year = 2013;
    
    // try to archive first
    const ArchiveBlaster = require('../common/lib/pgascores/archiver/archiveblaster.js');;
    const archiveBlaster = new ArchiveBlaster(tour);
    archiveBlaster.archive(year);

    // start the web server
    return app.listen(function () {
        app.emit('started');

        var baseUrl = app.get('url').replace(/\/$/, '');

        console.log('Web server listening at: %s', baseUrl);

        if (app.get('loopback-component-explorer')) {
            var explorerPath = app.get('loopback-component-explorer').mountPath;

            console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
        }
    });
};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function (err) {
    if (err) throw err;

    // start the server if `$ node server.js`
    if (require.main === module)
        app.start();
});


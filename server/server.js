var loopback = require("loopback");
var boot = require("loopback-boot");

// var memwatch = require('node-memwatch');
// memwatch.on('leak', function (info) {
//     console.log("=============MEMWATCH LEAK============");
//     console.log(JSON.stringify(info));
//     console.log("=============MEMWATCH LEAK============");
// });

// memwatch.on('stats', function(stats) {
//     console.log("=============MEMWATCH STATS============");
//     console.log(JSON.stringify(stats));
//     console.log("=============MEMWATCH STATS============");
// });

var app = (module.exports = loopback());

app.start = function () {
  // try to archive any unarchived seasons
  if (!process.env.NO_ARCHIVE) {
    var archive = require("../common/lib/pgascores/archivejob.js");
    archive.run();
  }

  // start the web server
  return app.listen(function () {
    app.emit("started");

    var baseUrl = app.get("url").replace(/\/$/, "");

    console.log("Web server listening at: %s", baseUrl);

    if (app.get("loopback-component-explorer")) {
      var explorerPath = app.get("loopback-component-explorer").mountPath;

      console.log("Browse your REST API at %s%s", baseUrl, explorerPath);
    }
  });
};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function (err) {
  if (err) throw err;

  // start the server if `$ node server.js`
  if (require.main === module) app.start();
});

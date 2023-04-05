//
//  Official World Gold Rankings page changed from a simple table to a script based
//  approach.  We parse the script data to get to the names and rankings
//
//  [ { playerName: 'Don Boulia', rank: 1 },
//    { playerName: 'Carter Boulia', rank: 2' }
//  ]

var cheerio = require('cheerio');

var ScriptScraper = function (html) {
    var $ = null;
    var script = null;

    //
    // initialize the scraper, looking for the specified script tag in
    // the source html.
    //
    // scriptTag:   This is JSON data which contains the world rankings info
    //
    // returns true if the script was found, false otherwise
    //
    this.init = function (scriptTag) {
        $ = cheerio.load(html);

        // get table data
        script = $(scriptTag);
        if (script == undefined) {
            console.log("Couldn't find script with tag " + scriptTag);
            return false;
        }

        return true;
    };

    //
    // returns an array of objects for the specified keymap
    //
    // fieldMap       : array of names to assign to each table element
    //
    // rowFunction    : if provided, will be called for each row.
    //                  the function can then manipulate the data
    //                  and return a (possibly changed) result
    //                  if the returned object is null, this row
    //                  is discarded from the output
    //
    this.scrape = function (fieldMap, rowFunction) {

        // console.log("script: " + script.text());
        const content = script.text();
        const result = JSON.parse(content);

        // console.log("result: ", result.props.pageProps.statDetails.rows);
        const rows = result.props.pageProps.statDetails.rows;

        var records = [];

        for (i in rows) {
            const row = rows[i];
            // console.log(row);

            let record = {};

            for (j in fieldMap) {
                var key = fieldMap[j];

                if (row[key]) {
                    record[key] = row[key];
                }
            }

            if (rowFunction) {
                record = rowFunction(record);
            }

            if (record != null) {
                records.push(record);
            }

            console.log('record' , record);
        }

        return records;
    };
};

module.exports = ScriptScraper;

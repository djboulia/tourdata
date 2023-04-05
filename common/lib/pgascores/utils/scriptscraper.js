//
//  records would now consist of:
//
//  [ { first: 'Don', last: 'Boulia', year: '1970' },
//    { first: 'Carter', last: 'Boulia', year: '2001' }
//  ]

var cheerio = require('cheerio');

var ScriptScraper = function (html) {
    var $ = null;
    var script = null;


    //
    // initialize the scraper, looking for the specified script tag in
    // the source html.
    //
    // tableTag:    This can be in jQuery format, e.g. if you want
    //              scrape a table in the html such as <table id="foo">,
    //              then you can call init with a  parameter of "table#foo"
    //
    // returns true if the table was found, false otherwise
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

        console.log("script: " + script.text());
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

        // // process each row in the table
        // $('tr', tbody).each(function (row, tr) {

        //     var record = {};

        //     var td = $('td', tr);
        //     if (td.each != undefined) {

        //         td.each(function (i, el) {
        //             var key = getKey(fieldMap, i);

        //             if (key != "") record[key] = getText($(el));
        //         });


        //         if (record != null) {
        //             records.push(record);
        //         }
        //     }

        // });

        return records;
    };
};

module.exports = ScriptScraper;

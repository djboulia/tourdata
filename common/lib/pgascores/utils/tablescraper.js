//
// this module takes an html source and parses table elements
// the returned object is an array of objects, with each object
// representing the table elements in that row.
//
// The parse method takes a fieldmap, an array of object names to map
// to each field in a row.  If you don't want to preserve one of the
// fields, set it with the empty string.
//
// take an example table:
//
// <table id="names">
//  <tbody>
//      <tr>
//          <td>Don</td><td>Boulia</td><td>April</td><td>17</td><td>1970</td>
//      </tr>
//      <tr>
//          <td>Carter</td><td>Boulia</td><td>July</td><td>5</td><td>2001</td>
//      </tr>
//  </tbody>
//  </table>
// 
//  var ts = new TableScraper(html);
//
//  if (ts.init('table#names')) { // look for the table in our html
//    var records = ts.parse(["first", "last", "", "", year]);
//  }
//
//  records would now consist of:
//
//  [ { first: 'Don', last: 'Boulia', year: '1970' },
//    { first: 'Carter', last: 'Boulia', year: '2001' }
//  ]

var cheerio = require('cheerio');

var TableScraper = function (html) {
    var $ = null;
    var table = null;
    var tbody = null;

    var getText = function (el) {
        // [djb 4-7-2015] replace whitespace with spaces to resolve encoding issues
        var text = el.text().replace(/\s/g, ' ').trim();
        return text;
    }

    var validIndex = function (array, ndx) {
        if (ndx < 0 || ndx >= array.length) {
            return false;
        } else {
            return true;
        }
    }

    var getKey = function (array, field) {
        var key = "";

        if (validIndex(array, field)) {
            key = array[field];
        }

        return key;;
    }

    //
    // initialize the scraper, looking for the specified table tag in
    // the source html.  
    // 
    // tableTag:    This can be in jQuery format, e.g. if you want
    //              scrape a table in the html such as <table id="foo">, 
    //              then you can call init with a  parameter of "table#foo"
    //
    // returns true if the table was found, false otherwise
    //
    this.init = function (tableTag) {
        $ = cheerio.load(html);

        // get table data
        table = $(tableTag);
        if (table == undefined) {
            console.log("Couldn't find table with tag " + tableTag);
            return false;
        }

        tbody = $('tbody', table);
        if (!tbody) {
            console.log("Couldn't find table body for table " + tableTag);
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

        var records = [];

        // process each row in the table
        $('tr', tbody).each(function (row, tr) {

            var record = {};

            var td = $('td', tr);
            if (td.each != undefined) {

                td.each(function (i, el) {
                    var key = getKey(fieldMap, i);

                    if (key != "") record[key] = getText($(el));
                });

                if (rowFunction) {
                    record = rowFunction(record);
                }

                if (record != null) {
                    records.push(record);
                }
            }

        });

        return records;
    };
};

module.exports = TableScraper;

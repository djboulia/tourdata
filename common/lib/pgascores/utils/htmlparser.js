//
// use the fieldNames array to determine whether we
// map the field to a property in our object, or ignore the field
//
var getFieldName = function (ndx, fieldNames) {
    if (ndx < 0 || ndx > fieldNames.length - 1) {
        return null;
    }

    return fieldNames[ndx];
};

//
// [djb 4-7-2015] replace whitespace with spaces to resolve encoding issues
//
var parseFieldText = function (field) {
    return field.text().replace(/\s/g, ' ').trim();
}

//
// return an array of each word in the text of the given field
//
exports.words = function (field) {
    var data = parseFieldText(field);
    return data.split(' ');
}

exports.text = parseFieldText;

/*
 * process a row of the HTML table and return an array of entries
 * representing the cells in this row
 * 
 * so an incoming row:
 * <td>1</td><td>2</td><td>Jason Day</td>
 *
 * would return:
 *
 * ["1", "2", "Jason Day"]
 *
 * returns [] if the row has no data elements
 */
exports.cells = function ($, tr) {

    var items = $('td', tr);
    var cells = [];
    var ndx = 0;

    if (items.each) {        
        items.each(function (i, el) {
            cells.push(parseFieldText($(this)));
        });
    }

    return cells;
}

/*
 * process an array of entries and return a formatted Javascript object
 * representing the data in this row
 * 
 * so an incoming array:
 * ["1", "2", "Jason Day"]
 *
 * and field names of:
 * var fieldNames = ["rank", null, "name"];
 *
 * would return:
 *
 * {
 *   rank: "1",
 *   name: "Jason Day"
 * }
 *
 * returns null if the row has no data elements
 */
exports.mapFields = function (cells, fieldNames) {
    
    if (cells.length==0) {
        return null;
    }
    
    var row = {};

    for (var i=0; i<cells.length; i++) {
        
        var key = getFieldName(i, fieldNames);

        if (key) {
            row[key] = cells[i];
        }
    }

    return row;
}

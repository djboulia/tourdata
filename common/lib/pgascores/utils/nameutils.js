/**
 *
 * helpful functions for mangling player names
 *
 **/

/**
 *	normalize	: turn a name into a searchable entity
 *
 * convert player name into a normalized version we can use as a unique id
 *
 * remove all commas and periods
 * convert hyphens and spaces to underscores
 * make the name lower case
 * The string "Ted Jones-Davis, Jr." would becomes "ted_jones_davis_jr"
 *
 *
 *	@str 		: the string with the player's name
 *  @returns	: the normalized string
 **/
exports.normalize = function( str ) {
	str = str.replace( /,/g, '');	// remove any commas
	str = str.replace( /\./g, '');	// remove any periods
	str = str.replace( /-/g, '_');	// replace hyphens with underscores
	str = str.replace( /\s/g, '_');	// spaces with underscores
	str = str.toLowerCase();
	return str;
};

/**
 * expects Last,<sp>First format and will return First<sp>Last
 **/
exports.reverseName = function( str ) {
    var parts = str.split(",");
    
    if (parts.length<2) {
        console.log("_reverseName: warning, couldn't reverse name " + str);
        return str;
    } else {
        return parts[1].trim() + " " + parts[0].trim();
    }
}


/**
 * attempts to match name1 and name2
 * returns:
 * -1 : no matching components
 *  0 : perfect match
 *  1 : last name match
 *  2 : last name and first letter of first name match
 *  3 : last name and first name match
 *
 * to improve matching chances, we normalize case and remove punctuation
 **/
exports.fuzzyMatch = function (name1, name2) {
    name1 = name1.toLowerCase().replace(/[,\.\']/g, ''); // remove any punctuation
    name2 = name2.toLowerCase().replace(/[,\.\']/g, ''); // remove any punctuation

    // convert whitespace into matchable space characters
    name1 = name1.replace(/\s/g, ' ');
    name2 = name2.replace(/\s/g, ' ');

    // try the easiest thing first
    if (name1 == name2) {
        //		console.log( "found match at name1:'" + name1 + "' name2:'" + name2 + "'");
        return 0;
    }

    var words1 = name1.split(/\s/g);
    //	console.log( JSON.stringify( "words 1:" + words1 ) );
    var words2 = name2.split(/\s/g);
    //	console.log( JSON.stringify( "words 2:" + words2 ) );

    var result = 0;

    // compare last names first
    var word1 = words1.pop();
    var word2 = words2.pop();

    if (word1 == word2) {
        result++;

        // see if the last name was a modifier like jr, i, ii, iii
        if (word1 == "jr" || word1 == "i" || word1 == "ii" || word1 == "iii") {
            // then compare next to last word
            if (words1.length > 0 && words2.length > 0) {
                word1 = words1.pop();
                word2 = words2.pop();
                if (word1 == word2) {
                    result++;
                }
            }
        }

        // now look at first name
        if (words1.length > 0 && words2.length > 0) {
            word1 = words1.shift();
            word2 = words2.shift();
            if (word1 == word2) {
                result++;

                // finally look at remainder
                while (words1.length > 0 && words2.length > 0) {
                    word1 = words1.pop();
                    word2 = words2.pop();
                    if (word1 == word2) {
                        result++;
                    } else {
                        break;
                    }
                }
            }
        }

    }


    if (result > 0) {
        var matchTypes = ["exact", "last name", "last name/first name initial", "last name and first name"]
            //		console.log( "found fuzzy match at name1:'" + name1 + "' name2:'" + name2 + "' - matched: " + matchTypes[result]);
    }

    return (result > 0) ? result : -1;
};


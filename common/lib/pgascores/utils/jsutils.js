//
// clone an array or object's contents and return it
//
var _clone = function (obj) {
    var newObj = (obj instanceof Array) ? [] : {};
    for (i in obj) {
        if (obj[i] && typeof obj[i] == "object") {
            newObj[i] = _clone(obj[i]);
        } else {
            newObj[i] = obj[i];
        }
    }
    return newObj;
};

exports.clone = _clone;


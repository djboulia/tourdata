var Logger = function(debug) {
    this.debug = debug;

    this.log = function (str) {
        console.log(str);
    }
    
    this.debug = function (str) {
        if (this.debug) console.log("[DEBUG] " + str);
    }
    
    this.error = function (str) {
        console.error(str);
    }
};

module.exports = Logger;
/**
 *
 * implement a simple caching mechanism for web content
 *
 * @param ttl : cache time in seconds
 *
 **/

var cachedItems = 0;

var memStats = function () {
    var used = process.memoryUsage();
    var now = new Date();

    console.log("cached items: " + cachedItems);
    console.log("mem stats ==> " + now.toLocaleTimeString() + " heapUsed: " + Math.round(used.heapUsed / 1024 / 1024 * 100) / 100 + " MB");
};

var Cache = function (ttl) {
    this.cache = {};

    var remove = function (cache, key) {
        cache[key] = undefined;

        cachedItems = cachedItems - 1;
    };

    var flush = function (cache) {
        // internal function to remove any expired cache entries
        var now = Date.now();

        const keys = Object.keys(cache)
        for (const key of keys) {
            var entry = cache[key];

            if (entry) {
                if (now - entry.timestamp > ttl * 1000) {
                    console.log("removing expired entry " + key);

                    remove(cache, key);
                }
            }
        }
    };

    this.get = function (key) {

        flush(this.cache);

        var entry = this.cache[key];
        var data = null;

        if (entry) {
            console.log("cache hit for " + key);

            data = this.cache[key].data;
        } else {
            console.log("no cache entry for " + key);
        }

        memStats();

        return data;
    };

    this.put = function (key, obj) {
        if (obj) {
            console.log("setting cache entry for " + key);

            this.cache[key] = {
                "data": obj,
                "timestamp": Date.now()
            };

            cachedItems = cachedItems + 1;
        } else {
            // putting a null/undefined object deletes this entry from the cache
            console.log("removing cache entry for " + key);

            remove(this.cache, key);
        }

        memStats();

    };
};

module.exports = Cache;
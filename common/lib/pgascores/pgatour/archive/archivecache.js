/**
 * get the given key from the archive, checking cache and
 * adding to the cache as appropriate.
 *
 * @param {string} id key to look for
 * @param {object} archive the archive to look in
 * @param {object} cache the cahe to check
 * @returns {object} data from the archive or null if not found
 */
module.exports.get = async function (id, archive, cache) {
  // check cache first, return that if we have it already
  const tournament_data = cache.get(id);
  if (tournament_data) {
    console.log("no cache hit for " + id);
    return tournament_data;
  }

  // not cached, go to the archives
  const result = await archive.exists(id).catch((e) => {
    throw e;
  });

  if (result) {
    console.log("found item in archive!");

    const tournament_data = await archive.get(id).catch((e) => {
      throw e;
    });

    if (tournament_data) {
      // save it in the cache for next time
      cache.put(id, tournament_data);
    }

    return tournament_data;
  } else {
    // no archive found, return null as the result
    const str = "no archive item found!";
    console.log(str);
    return null;
  }
};

module.exports.exists = async function (id, archive) {
  const result = await archive.exists(id).catch((e) => {
    throw e;
  });

  return result ? true : false;
};

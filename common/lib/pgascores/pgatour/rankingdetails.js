const NameUtils = require("../utils/nameutils");

/**
 * Format the world rankings data into a normalized format
 *
 */
const RankingDetails = function () {
  this.normalize = function (graphData) {
    const records = [];

    if (!graphData?.statDetails?.rows) {
      console.log("no ranking data found");
      return undefined;
    }

    const rows = graphData?.statDetails?.rows;

    for (const row of rows) {
      const record = {
        rank: row?.rank?.toString(),
        name: row?.playerName,
        player_id: NameUtils.normalize(row?.playerName),
      };

      records.push(record);
    }

    return records;
  };
};

module.exports = RankingDetails;

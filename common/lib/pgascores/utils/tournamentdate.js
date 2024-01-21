/**
 * compare just the year/month/day and return true if the date
 * is the current date or earlier
 *
 * @param {Date} date javascript date object
 */
const inThePast = function (now, date) {
  if (date.getFullYear() < now.getFullYear()) {
    return true;
  } else if (date.getFullYear() > now.getFullYear()) {
    return false;
  }

  if (date.getMonth() < now.getMonth()) {
    return true;
  } else if (date.getMonth() > now.getMonth()) {
    return false;
  }

  if (date.getDate() < now.getDate()) {
    return true;
  } else if (date.getDate() > now.getDate()) {
    return false;
  }

  // date is today if we get here... we do NOT consider that in the past
  return false;
};

const todayInUTC = function () {
  const now = new Date();

  return new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  ).toISOString();
};

/**
 * check if the tournament is complete
 *
 * @param {string} dateString UTC date string in YYYY-MM-DDT00:00:00:000Z format
 * @returns
 */
exports.isTournamentComplete = function (dateString) {
  const endDate = new Date(dateString);

  // since the incoming date is in UTC, we put our today date in UTC
  const todayString = todayInUTC();
  const today = new Date(todayString);
  // console.log("today:", today);

  const complete = inThePast(today, endDate);

  console.log(
    "Tournament end date: " +
      endDate +
      ", today: " +
      today +
      ", complete=" +
      complete
  );

  return complete;
};

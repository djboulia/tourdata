// change these to be yesterday, today and tomorrow
const TournamentDate = require("../../../common/lib/pgascores/utils/tournamentdate");
const endDateToday = "2024-01-21T00:00:00.000Z";

console.log("endDateToday:", endDateToday);
console.log(TournamentDate.isTournamentComplete(endDateToday));

const endDatePast = "2024-01-20T00:00:00.000Z";

console.log("endDatePast:", endDatePast);
console.log(TournamentDate.isTournamentComplete(endDatePast));

const endDateFuture = "2024-01-22T00:00:00.000Z";

console.log("endDateFuture:", endDateFuture);
console.log(TournamentDate.isTournamentComplete(endDateFuture));

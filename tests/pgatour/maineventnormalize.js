const PgaTourMain = require("../../common/lib/pgascores/pgatour/pgatourmain");
const ScheduleData = require("../../common/lib/pgascores/pgatour/scheduledata");
const EventData = require("../../common/lib/pgascores/pgatour/eventdata");

const run = async () => {
  const tour = "pga";
  const year = 2023;
  const eventid = "R2023546";
  const main = new PgaTourMain(tour, year);

  const schedule = await main.getSchedule().catch((e) => {
    return undefined;
  });

  const scheduleData = new ScheduleData(tour, year);
  const eventDetails = scheduleData.findEvent(schedule, eventid);
  if (eventDetails == undefined) {
    throw new Error("Error retrieving schedule details for event " + eventid);
  }

  console.log(
    "found id " + eventDetails.tournament.id + " for event " + eventid
  );

  const eventData = new EventData(true);

  const eventRaw = await main.getEventLive(eventid);
  console.log(JSON.stringify(eventRaw, null, 2));

  const records = eventData.normalize(eventRaw, eventDetails);
  console.log(JSON.stringify(records, null, 2));
};

run();

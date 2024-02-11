const PgaTourSchedule = require("../../common/lib/pgascores/pgatour/pgatourschedule");
const PgaTourEvent = require("../../common/lib/pgascores/pgatour/pgatourevent");
const ScheduleData = require("../../common/lib/pgascores/pgatour/scheduledata");
const EventData = require("../../common/lib/pgascores/pgatour/eventdata");

const run = async () => {
  const tour = "pga";
  const year = 2023;
  const eventid = "R2023014";
  const mainSchedule = new PgaTourSchedule(tour, year);
  const mainEvent = new PgaTourEvent(tour, year, mainSchedule);

  const schedule = await mainSchedule.get().catch((e) => {
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

  const eventRaw = await mainEvent.getLive(eventid);
  console.log(JSON.stringify(eventRaw, null, 2));

  const records = eventData.normalize(eventRaw, eventDetails);
  console.log(JSON.stringify(records, null, 2));
};

run();

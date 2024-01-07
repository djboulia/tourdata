const { gql } = require("@apollo/client/core");
const client = require("./graphclient");

const QUERY = gql`
  query Schedule($tourCode: String!, $year: String) {
    schedule(tourCode: $tourCode, year: $year) {
      completed {
        tournaments {
          tournamentName
          id
          beautyImage
          champion
          champions {
            displayName
            playerId
          }
          championEarnings
          championId
          city
          country
          countryCode
          courseName
          date
          dateAccessibilityText
          purse
          sortDate
          startDate
          state
          stateCode
          status {
            roundDisplay
            roundStatus
            roundStatusColor
            roundStatusDisplay
          }
          ticketsURL
          tourStandingHeading
          tourStandingValue
          tournamentLogo
          display
          sequenceNumber
        }
        month
        monthSort
        year
      }
      seasonYear
      tour
      seasonYear
      upcoming {
        month
        year
        tournaments {
          id
          date
          startDate
          dateAccessibilityText
          tournamentName
          tournamentLogo
          city
          state
          stateCode
          country
          countryCode
          courseName
          champion
          championId
          champions {
            displayName
            playerId
          }
          championEarnings
          beautyImage
          status {
            roundStatusDisplay
            roundDisplay
            roundStatus
            roundStatusColor
          }
          sortDate
          sequenceNumber
          purse
          ticketsURL
          tourStandingHeading
          tourStandingValue
          tournamentLogo
          tournamentName
          display
          sequenceNumber
        }
        monthSort
      }
      completed {
        month
        year
        monthSort
        tournaments {
          id
          date
          startDate
          dateAccessibilityText
          tournamentName
          tournamentLogo
          city
          state
          stateCode
          country
          countryCode
          courseName
          champion
          championId
          champions {
            displayName
            playerId
          }
          championEarnings
          beautyImage
          status {
            roundStatusDisplay
            roundDisplay
            roundStatus
            roundStatusColor
          }
          sortDate
          sequenceNumber
          purse
          ticketsURL
          tourStandingHeading
          tourStandingValue
          display
        }
      }
    }
  }
`;

const qlGetSchedule = async (tour, year) => {
  if (tour.toLowerCase() !== "pga") {
    throw new Error("Only PGA tour is supported");
  }

  const tourCode = "R";
  const query = await client.query({
    operationName: "Schedule",
    variables: { tourCode: tourCode, year: year },
    query: QUERY,
  });

  return query;
};

module.exports = qlGetSchedule;

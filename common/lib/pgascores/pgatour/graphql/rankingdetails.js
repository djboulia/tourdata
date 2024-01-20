const { gql } = require("@apollo/client/core");
const client = require("./graphclient");

const QUERY = gql`
  query StatDetails(
    $tourCode: TourCode!
    $statId: String!
    $year: Int
    $eventQuery: StatDetailEventQuery
  ) {
    statDetails(
      tourCode: $tourCode
      statId: $statId
      year: $year
      eventQuery: $eventQuery
    ) {
      tourCode
      year
      displaySeason
      statId
      statType
      statTitle
      statDescription
      tourAvg
      lastProcessed
      statHeaders
      statCategories {
        category
        displayName
        subCategories {
          displayName
          stats {
            statId
            statTitle
          }
        }
      }
      rows {
        ... on StatDetailsPlayer {
          __typename
          playerId
          playerName
          country
          countryFlag
          rank
          rankDiff
          rankChangeTendency
          stats {
            statName
            statValue
            color
          }
        }
        ... on StatDetailTourAvg {
          __typename
          displayName
          value
        }
      }
      sponsorLogo
    }
  }
`;

const statIds = {
  fedExCupPoints: "02394",
  top10Finishes: "138",
  worldRank: "186",
  money: "109",
};

const qlGetRankings = async (tour, year) => {
  if (tour.toLowerCase() !== "pga") {
    throw new Error("Only PGA tour is supported");
  }

  const tourCode = "R"; // pga

  const query = await client.query({
    operationName: "StatDetails",
    variables: {
      tourCode: tourCode,
      statId: statIds.worldRank,
      year: year,
      eventQuery: null,
    },
    query: QUERY,
  });

  return query;
};

module.exports = qlGetRankings;

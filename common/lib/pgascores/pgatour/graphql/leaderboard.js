const { gql } = require("@apollo/client/core");
const client = require("./graphclient");

const QUERY = gql`
  query leaderboardV2($id: ID!) {
    leaderboardV2(id: $id) {
      id
      players {
        ... on PlayerRowV2 {
          id
          player {
            id
            firstName
            lastName
            shortName
            displayName
          }
          leaderboardSortOrder
          position
          total
          totalSort
          thru
          thruSort
          score
          scoreSort
          teeTime
          groupNumber
          currentRound
          roundHeader
          roundStatus
          courseId
          backNine
          rounds
          movementDirection
          movementAmount
          playerState
          rankingMovement
          rankingMovementAmount
          rankingMovementAmountSort
          totalStrokes
          official
          officialSort
          projected
          projectedSort
        }
      }
      formatType
    }
  }
`;

const qlLeaderboard = async (id) => {
  const query = await client.query({
    operationName: "leaderboardV2",
    variables: {
      id: id,
    },
    query: QUERY,
  });

  return query;
};

module.exports = qlLeaderboard;

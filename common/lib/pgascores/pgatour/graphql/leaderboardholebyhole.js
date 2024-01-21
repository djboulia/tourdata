const { gql } = require("@apollo/client/core");
const client = require("./graphclient");

const QUERY = gql`
  query LeaderboardHoleByHole($tournamentId: ID!, $round: Int) {
    leaderboardHoleByHole(tournamentId: $tournamentId, round: $round) {
      tournamentId
      currentRound
      tournamentName
      rounds {
        roundNumber
        displayText
      }
      playerData {
        playerId
        courseId
        scores {
          holeNumber
          par
          yardage
          sequenceNumber
          score
          status
          roundScore
        }
        out
        in
        total
        totalToPar
      }
    }
  }
`;

const qlGetLeaderboardHoleByHole = async (tournamentId, round) => {
  const query = await client.query({
    operationName: "LeaderboardHoleByHole",
    variables: {
      tournamentId: tournamentId,
      round: round,
    },
    query: QUERY,
  });

  return query;
};

module.exports = qlGetLeaderboardHoleByHole;

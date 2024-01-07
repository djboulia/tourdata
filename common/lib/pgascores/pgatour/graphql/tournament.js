const { gql } = require("@apollo/client/core");
const client = require("./graphclient");

const QUERY = gql`
  query LeaderboardStrokes($leaderboardStrokesId: ID!) {
    leaderboardStrokes(id: $leaderboardStrokesId) {
      ...LeaderboardStrokesFragment
    }
  }

  fragment LeaderboardStrokesFragment on LeaderboardStrokes {
    id
    strokes {
      ...StrokeFragment
    }
    playoffs {
      ...StrokeFragment
    }
  }

  fragment StrokeFragment on LeaderboardStroke {
    __typename
    id
    strokeId
    playerId
    currentHoleDisplay
    currentHole
    currentShotDisplay
    currentShot
    currentRound
    playByPlay
    finalStroke
    scoreStatus
    par
    yardage
    parSort
    yardageSort
    playoffHole
    playoffHoleDisplay
  }
`;

const qlGetTournament = async (tournamentId) => {
  const query = await client.query({
    operationName: "LeaderboardStrokes",
    variables: {
      leaderboardStrokesId: tournamentId,
    },
    query: QUERY,
  });

  return query;
};

module.exports = qlGetTournament;

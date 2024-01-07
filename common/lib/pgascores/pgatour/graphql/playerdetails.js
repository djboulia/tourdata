const { gql } = require("@apollo/client/core");
const client = require("./graphclient");

const QUERY = gql`
  query ScorecardV2($scorecardV2Id: ID!, $playerId: ID!) {
    scorecardV2(id: $scorecardV2Id, playerId: $playerId) {
      ...ScorecardV2Fragment
    }
  }

  fragment ScorecardV2Fragment on LeaderboardDrawerV2 {
    tournamentName
    id
    currentHole
    currentRound
    player {
      id
      firstName
      lastName
      shortName
      displayName
      abbreviations
      abbreviationsAccessibilityText
      amateur
      country
      countryFlag
      lineColor
      seed
      status
      tourBound
      assets {
        ... on TourBoundAsset {
          tourBoundLogo
          tourBoundLogoDark
        }
      }
    }
    backNine
    teeTime
    groupNumber
    playerState
    roundScores {
      roundNumber
      currentRound
      complete
      groupNumber
      firstNine {
        total
        totalLabel
        parTotal
        holes {
          holeNumber
          par
          yardage
          sequenceNumber
          score
          status
          roundScore
        }
      }
      secondNine {
        total
        totalLabel
        parTotal
        holes {
          holeNumber
          par
          yardage
          sequenceNumber
          score
          status
          roundScore
        }
      }
      parTotal
      total
      scoreToPar
      courseName
      courseId
      tourcastURL
      tourcastURLWeb
      currentHole
    }
  }
`;

const qlGetPlayerDetails = async (tournamentId, playerId) => {
  const query = await client.query({
    operationName: "ScorecardV2",
    variables: { scorecardV2Id: tournamentId, playerId: playerId },
    query: QUERY,
  });

  return query;
};

module.exports = qlGetPlayerDetails;

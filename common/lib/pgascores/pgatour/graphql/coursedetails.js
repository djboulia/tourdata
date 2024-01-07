const { gql } = require("@apollo/client/core");
const client = require("./graphclient");

const QUERY = gql`
  query TournamentRecap($tournamentId: String!, $limit: Int, $offset: Int) {
    tournamentRecap(
      tournamentId: $tournamentId
      limit: $limit
      offset: $offset
    ) {
      tournamentId
      durationDate
      courses {
        id
        image
        name
        city
        state
        country
        par
        yardage
      }
    }
  }
`;

const qlGetCourseDetails = async (tournamentId) => {
  const query = await client.query({
    operationName: "LeaderboardStrokes",
    variables: {
      tournamentId: tournamentId,
      limit: 20,
    },
    query: QUERY,
  });

  return query;
};

module.exports = qlGetCourseDetails;

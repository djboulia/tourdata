const {
  ApolloClient,
  InMemoryCache,
  ApolloLink,
  HttpLink,
  concat,
} = require("@apollo/client/core");

const PGA_TOUR_URL = "https://orchestrator.pgatour.com/graphql";
const PGA_TOUR_API_KEY = "da2-gsrx5bibzbb4njvhl7t37wqyl4";

const ApolloWrapper = function () {
  const httpLink = new HttpLink({
    uri: PGA_TOUR_URL,
  });

  const authMiddleware = new ApolloLink((operation, forward) => {
    // add the authorization to the headers
    operation.setContext(({ headers = {} }) => ({
      headers: {
        ...headers,
        "x-api-key": PGA_TOUR_API_KEY,
      },
    }));

    return forward(operation);
  });

  const client = new ApolloClient({
    link: concat(authMiddleware, httpLink),
    cache: new InMemoryCache(),
  });

  this.query = async function ({ operationName, variables, query }) {
    await client.resetStore(); // disable any caching since we cache the results ourselves
    const queryResult = await client.query({
      operationName: operationName,
      variables: variables,
      query: query,
    });

    // convert the returned query data to a plain object
    // otherwise we won't be able to manipulate it like a normal object
    return queryResult?.data
      ? JSON.parse(JSON.stringify(queryResult?.data))
      : undefined;
  };
};

const apolloWrapper = new ApolloWrapper();

module.exports = apolloWrapper;

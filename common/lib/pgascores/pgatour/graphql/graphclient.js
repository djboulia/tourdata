const {
  ApolloClient,
  InMemoryCache,
  ApolloLink,
  HttpLink,
  concat,
} = require("@apollo/client/core");
// const { loadErrorMessages, loadDevMessages } = require("@apollo/client/dev");

const PGA_TOUR_URL = "https://orchestrator.pgatour.com/graphql";
const PGA_TOUR_API_KEY = "da2-gsrx5bibzbb4njvhl7t37wqyl4";

// Uncomment this for debug purposes.  Adds more detail to Apollo error messages
// loadDevMessages();
// loadErrorMessages();

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

  // [djb 03/16/2025]
  // see comment below on resetStore.  Disabled Apollo cache based on Stack Overflow thread here:
  // https://stackoverflow.com/questions/47879016/how-to-disable-cache-in-apollo-link-or-apollo-client
  const defaultOptions = {
    watchQuery: {
      fetchPolicy: "no-cache",
      errorPolicy: "ignore",
    },
    query: {
      fetchPolicy: "no-cache",
      errorPolicy: "all",
    },
  };

  const client = new ApolloClient({
    link: concat(authMiddleware, httpLink),
    cache: new InMemoryCache(),
    defaultOptions: defaultOptions,
  });

  this.query = async function ({ operationName, variables, query }) {
    // [djb 03/16/2025]
    // resetStore began causing errors on the PGA GraphQL queries, but used to work before
    //
    // await client.resetStore(); // disable any caching since we cache the results ourselves
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

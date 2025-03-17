//
// this is useful for discovering all of the pgatour.com graphql endpoints
// not used in day to day of the app
//
// thanks to Charlie Ahmer for this code
// https://github.com/charlie-ahmer/PGATour-DataCollectionAndDashboard/blob/main/PGA_WebScrape.ipynb
//
const { gql } = require("@apollo/client/core");
const client = require("./graphclient");

const QUERY = gql`
  query IntrospectionQuery {
    __schema {
      queryType {
        name
        fields {
          name
          description
        }
      }
      mutationType {
        name
      }
      subscriptionType {
        name
      }
      types {
        ...FullType
      }
      directives {
        name
        description
        locations
      }
    }
  }

  fragment FullType on __Type {
    kind
    name
    description
    fields(includeDeprecated: true) {
      name
      description
      args {
        ...InputValue
      }
      type {
        name
        description
      }
    }
    interfaces {
      ...TypeRef
    }
    enumValues(includeDeprecated: true) {
      name
      description
      isDeprecated
    }
    possibleTypes {
      ...TypeRef
    }
  }

  fragment InputValue on __InputValue {
    name
    description
  }

  fragment TypeRef on __Type {
    kind
    name
    ofType {
      kind
      name
      ofType {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
              }
            }
          }
        }
      }
    }
  }
`;

const qlIntrospection = async () => {
  const query = await client.query({
    operationName: "IntrospectionQuery",
    query: QUERY,
  });

  return query;
};

module.exports = qlIntrospection;

const qlIntrospection = require("../../common/lib/pgascores/pgatour/graphql/introspection");

const run = async () => {
  const results = await qlIntrospection();
  console.log(JSON.stringify(results, null, 2));
};

run();

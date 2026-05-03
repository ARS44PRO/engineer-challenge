import { authSchema } from "../../modules/auth";

const rootTypeDefs = `
  type Query {
    _health: String!
  }

  type Mutation {
    _empty: String
  }
`;

export const schema = [rootTypeDefs, authSchema].join("\n");

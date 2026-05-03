import type { Container } from "../../infrastructure";
import { buildAuthResolvers } from "../../modules/auth";

export function buildResolvers(container: Container) {
  const auth = buildAuthResolvers(container);

  return {
    Query: {
      _health: () => "ok",
    },
    Mutation: {
      ...auth.Mutation,
    },
  };
}

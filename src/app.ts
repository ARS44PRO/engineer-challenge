import Fastify from "fastify";
import mercurius from "mercurius";
import { buildContainer } from "./infrastructure";
import { schema, buildResolvers } from "./interface";
import { DomainError } from "./modules/auth";

export async function buildApp() {
  const app = Fastify({ logger: true });
  const container = buildContainer();

  app.register(mercurius, {
    schema,
    resolvers: buildResolvers(container),
    graphiql: true,
    errorFormatter: (executionResult, context) => {
      const errors = (executionResult.errors ?? []).map((err) => {
        const original = err.originalError;

        if (original instanceof DomainError) {
          return {
            message: original.message,
            extensions: { code: original.code },
            path: err.path,
            locations: err.locations,
          };
        }

        if (
          err.extensions &&
          typeof err.extensions === "object" &&
          "code" in err.extensions
        ) {
          return {
            message: err.message,
            extensions: err.extensions as Record<string, unknown>,
            path: err.path,
            locations: err.locations,
          };
        }

        app.log.error({ err: original ?? err }, "Unhandled error in resolver");
        return {
          message: "Internal server error",
          extensions: { code: "INTERNAL_ERROR" },
          path: err.path,
          locations: err.locations,
        };
      });

      return {
        statusCode: 200,
        response: {
          data: executionResult.data ?? null,
          errors,
        },
      };
    },
  });

  return { app, container };
}

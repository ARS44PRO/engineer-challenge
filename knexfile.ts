import "dotenv/config";
import type { Knex } from "knex";

const required = (name: string): string => {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
};

const config: Knex.Config = {
  client: "pg",
  connection: {
    host: required("DB_HOST"),
    port: Number(required("POSTGRES_PORT")),
    user: required("POSTGRES_USER"),
    password: required("POSTGRES_PASSWORD"),
    database: required("POSTGRES_DB"),
  },
  migrations: {
    directory: "./src/infrastructure/database/migrations",
    extension: "ts",
  },
};

export default config;

import Knex from "knex";
import config from "../../../knexfile";

export const db = Knex(config);
export type pgClient = typeof db;

import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("users", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.text("email").notNullable().unique();
    table.text("password_hash").notNullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
  });

  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_updated()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await knex.raw(`
    CREATE TRIGGER update_user
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated();
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP TRIGGER IF EXISTS update_user ON users;`);
  await knex.schema.dropTableIfExists("users");
}

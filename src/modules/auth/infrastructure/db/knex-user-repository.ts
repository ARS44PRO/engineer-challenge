import { pgClient } from "../../../../infrastructure";
import { UserRepository } from "../../application";
import { Email, PasswordHash, UserDb, UserEntity } from "../../domain";
import { UserMapper } from "./user-mapper";

export class KnexUserRepository implements UserRepository {
  constructor(private readonly pgClient: pgClient) {}

  async findByEmail(email: Email): Promise<UserEntity | null> {
    const row = await this.pgClient<UserDb>("users")
      .where({ email: email.value })
      .first();
    return row ? UserMapper.toEntity(row) : null;
  }

  async findById(id: string): Promise<UserEntity | null> {
    const row = await this.pgClient<UserDb>("users").where({ id }).first();
    return row ? UserMapper.toEntity(row) : null;
  }

  async save(user: UserEntity): Promise<void> {
    await this.pgClient<UserDb>("users").insert(UserMapper.toDatabase(user));
  }

  async updatePasswordHash(
    userId: string,
    newHash: PasswordHash,
  ): Promise<void> {
    await this.pgClient<UserDb>("users")
      .where({ id: userId })
      .update({ password_hash: newHash.value });
  }
}

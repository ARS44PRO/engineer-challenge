import { UserDb, UserEntity } from "../../domain";
import { User } from "../../domain/entities/user";
import { Email } from "../../domain/value-objects/email";
import { PasswordHash } from "../../domain/value-objects/password-hash";

export const UserMapper = {
  toEntity(row: UserDb): UserEntity {
    return User.restore({
      id: row.id,
      email: Email.create(row.email),
      passwordHash: new PasswordHash(row.password_hash),
      createdAt: row.created_at,
    });
  },

  toDatabase(user: UserEntity): UserDb {
    return {
      id: user.id,
      email: user.email.value,
      password_hash: user.passwordHash.value,
      created_at: user.createdAt,
    };
  },
};

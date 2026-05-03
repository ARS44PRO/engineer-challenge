import { randomUUID } from "crypto";
import { Email } from "../value-objects/email";
import { PasswordHash } from "../value-objects/password-hash";
import { UserEntity } from "./user.entity";

export class User {
  private constructor(
    public readonly id: string,
    public readonly email: Email,
    public readonly passwordHash: PasswordHash,
    public readonly createdAt: Date,
  ) {}

  static register(email: Email, passwordHash: PasswordHash): UserEntity {
    return new User(randomUUID(), email, passwordHash, new Date());
  }

  static restore(props: UserEntity): UserEntity {
    return new User(props.id, props.email, props.passwordHash, props.createdAt);
  }
}

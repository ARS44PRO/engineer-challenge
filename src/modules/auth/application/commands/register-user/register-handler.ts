import { Email } from "../../../domain/value-objects/email";
import { Password } from "../../../domain/value-objects/password";
import { User } from "../../../domain/entities/user";
import type { UserRepository } from "../../ports/user-repository";
import type { PasswordHasher } from "../../ports/password-hasher";
import type { TokenIssuer } from "../../ports/token-issuer";
import { RegisterUserCommand } from "./register-command";
import { RegisterUserResult } from "./register-types";
import { EmailAlreadyTakenError } from "../../../domain";

export class RegisterUserHandler {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenIssuer: TokenIssuer,
  ) {}

  async execute(cmd: RegisterUserCommand): Promise<RegisterUserResult> {
    const email = Email.create(cmd.email);
    const password = Password.create(cmd.password);

    const existing = await this.userRepository.findByEmail(email);
    if (existing) throw new EmailAlreadyTakenError(email.value);

    const passwordHash = await this.passwordHasher.hash(password);
    const user = User.register(email, passwordHash);
    await this.userRepository.save(user);

    const accessToken = this.tokenIssuer.issueAccessToken(user.id);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email.value,
        createdAt: user.createdAt,
      },
    };
  }
}

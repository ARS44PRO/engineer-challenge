import { LoginUserCommand } from "./login-command";
import { LoginUserResult } from "./login-types";
import { PasswordHasher, TokenIssuer, UserRepository } from "../../ports";
import { Email, InvalidCredentialsError } from "../../../domain";

export class LoginUserHandler {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenIssuer: TokenIssuer,
  ) {}

  async execute(cmd: LoginUserCommand): Promise<LoginUserResult> {
    const email = Email.create(cmd.email);

    const user = await this.userRepository.findByEmail(email);
    if (!user) throw new InvalidCredentialsError();

    const compare = await this.passwordHasher.verify(
      cmd.password,
      user.passwordHash,
    );

    if (!compare) throw new InvalidCredentialsError();

    const accessToken = await this.tokenIssuer.issueAccessToken(user.id);
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

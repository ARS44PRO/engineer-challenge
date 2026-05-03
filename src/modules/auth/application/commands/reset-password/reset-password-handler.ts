import { Password } from "../../../domain/value-objects/password";
import { ResetToken } from "../../../domain/value-objects/reset-token";
import { PasswordResetToken } from "../../../domain/entities/password-reset-token";
import { InvalidResetTokenError } from "../../../domain/errors";
import type { UserRepository } from "../../ports/user-repository";
import type { PasswordResetTokenRepository } from "../../ports/password-reset-token-repository";
import type { PasswordHasher } from "../../ports/password-hasher";
import { ResetPasswordCommand } from "./reset-password-command";

export class ResetPasswordHandler {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordResetTokenRepository: PasswordResetTokenRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(cmd: ResetPasswordCommand): Promise<void> {
    const newPassword = Password.create(cmd.newPassword);
    const rawToken = ResetToken.fromRaw(cmd.token);
    const tokenHash = rawToken.hash();

    const tokenEntity =
      await this.passwordResetTokenRepository.findByHash(tokenHash);
    if (!tokenEntity) throw new InvalidResetTokenError();

    const token = PasswordResetToken.restore(tokenEntity);
    token.ensureUsable(new Date());

    const user = await this.userRepository.findById(tokenEntity.userId);
    if (!user) throw new InvalidResetTokenError();

    const newHash = await this.passwordHasher.hash(newPassword);

    await this.userRepository.updatePasswordHash(user.id, newHash);
    await this.passwordResetTokenRepository.markUsed(
      tokenEntity.id,
      new Date(),
    );
  }
}

import { Email } from "../../../domain/value-objects/email";
import { PasswordResetToken } from "../../../domain/entities/password-reset-token";
import type { UserRepository } from "../../ports/user-repository";
import type { PasswordResetTokenRepository } from "../../ports/password-reset-token-repository";
import type { EmailSender } from "../../ports/email-sender";
import { RequestPasswordResetCommand } from "./request-password-reset-command";

const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

export interface RequestPasswordResetResult {
  exposedResetLink: string | null;
}

export class RequestPasswordResetHandler {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordResetTokenRepository: PasswordResetTokenRepository,
    private readonly emailSender: EmailSender,
  ) {}

  async execute(
    cmd: RequestPasswordResetCommand,
  ): Promise<RequestPasswordResetResult> {
    const email = Email.create(cmd.email);

    const user = await this.userRepository.findByEmail(email);

    if (!user) return { exposedResetLink: null };

    const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
    const recent = await this.passwordResetTokenRepository.countRecentByUserId(
      user.id,
      since,
    );
    if (recent >= RATE_LIMIT_MAX) return { exposedResetLink: null };

    const { entity, rawToken } = PasswordResetToken.issue(user.id);
    await this.passwordResetTokenRepository.save(entity);

    const result = await this.emailSender.sendPasswordResetLink(
      email,
      rawToken.value,
    );

    return { exposedResetLink: result.exposedLink };
  }
}

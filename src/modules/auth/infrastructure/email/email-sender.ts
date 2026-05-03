import type {
  EmailSender,
  EmailSenderResult,
} from "../../application/ports/email-sender";
import type { Email } from "../../domain/value-objects/email";
import type { AppLogger } from "../../../../infrastructure/utils/logger/app-logger";

export class ConsoleEmailSender implements EmailSender {
  constructor(
    private readonly logger: AppLogger,
    private readonly resetUrlTemplate: string,
  ) {}

  async sendPasswordResetLink(
    to: Email,
    rawToken: string,
  ): Promise<EmailSenderResult> {
    const link = this.resetUrlTemplate.replace("{token}", rawToken);
    this.logger.info("password_reset.email_stub", {
      to: to.value,
      link,
    });
    return { exposedLink: link };
  }
}

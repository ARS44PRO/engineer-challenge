import type {
  EmailSender,
  EmailSenderResult,
} from "../../application/ports/email-sender";
import type { Email } from "../../domain/value-objects/email";

export class SmtpEmailSender implements EmailSender {
  constructor(
    private readonly smtpHost: string,
    private readonly smtpUser: string,
    private readonly smtpPassword: string,
    private readonly resetUrlTemplate: string,
  ) {}

  async sendPasswordResetLink(
    to: Email,
    rawToken: string,
  ): Promise<EmailSenderResult> {
    const link = this.resetUrlTemplate.replace("{token}", rawToken);
    // TODO: интеграция с nodemailer / sendgrid / ses
    throw new Error(
      `SmtpEmailSender not implemented. Would send to ${to.value}: ${link}`,
    );
  }
}

import type {
  EmailSender,
  EmailSenderResult,
} from "../application/ports/email-sender";
import type { Email } from "../domain/value-objects/email";

interface Call {
  to: Email;
  rawToken: string;
}

export class StubEmailSender implements EmailSender {
  public readonly calls: Call[] = [];
  public exposeLink = true;

  async sendPasswordResetLink(
    to: Email,
    rawToken: string,
  ): Promise<EmailSenderResult> {
    this.calls.push({ to, rawToken });
    return {
      exposedLink: this.exposeLink ? `dev://reset?token=${rawToken}` : null,
    };
  }
}

import type { Email } from "../../domain/value-objects/email";

export interface EmailSenderResult {
  /**
   * Если sender готов «раскрыть» ссылку обратно (например, в dev) — возвращает её.
   * В проде всегда null — sender отправил письмо и не делится ссылкой с caller'ом.
   */
  exposedLink: string | null;
}

export interface EmailSender {
  sendPasswordResetLink(to: Email, rawToken: string): Promise<EmailSenderResult>;
}

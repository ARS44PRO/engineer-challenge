import {
  createContainer,
  asValue,
  asClass,
  asFunction,
  InjectionMode,
} from "awilix";
import type { SignOptions } from "jsonwebtoken";
import { AppLogger } from "./utils/logger";
import { KnexUserRepository } from "../modules/auth/infrastructure/db/knex-user-repository";
import { BcryptPasswordHasher } from "../modules/auth/infrastructure/crypto/bcrypt-password-hasher";
import { JwtTokenIssuer } from "../modules/auth/infrastructure/crypto/jwt-token-issuer";
import { RegisterUserHandler } from "../modules/auth/application/commands/register-user/register-handler";
import {
  ConsoleEmailSender,
  LoginUserHandler,
  RequestPasswordResetHandler,
  ResetPasswordHandler,
  SmtpEmailSender,
} from "../modules";
import { db } from "./database";
import { KnexPasswordResetTokenRepository } from "../modules/auth/infrastructure/db/knex-password-reset-token-repository";

const required = (name: string): string => {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
};

export function buildContainer() {
  const container = createContainer({
    injectionMode: InjectionMode.CLASSIC,
  });

  container.register({
    pgClient: asValue(db),
    logger: asClass(AppLogger).singleton(),

    userRepository: asClass(KnexUserRepository).singleton(),
    passwordHasher: asClass(BcryptPasswordHasher).singleton(),
    tokenIssuer: asFunction(
      () =>
        new JwtTokenIssuer(
          required("JWT_SECRET"),
          (process.env.JWT_ACCESS_TTL ?? "15m") as SignOptions["expiresIn"],
        ),
    ).singleton(),

    registerUserHandler: asClass(RegisterUserHandler).scoped(),
    loginUserHandler: asClass(LoginUserHandler).scoped(),

    passwordResetTokenRepository: asClass(
      KnexPasswordResetTokenRepository,
    ).singleton(),

    emailSender: asFunction((logger: AppLogger) => {
      const template =
        process.env.RESET_URL_TEMPLATE ??
        "http://localhost:3000/reset?token={token}";
      if (process.env.NODE_ENV === "production") {
        return new SmtpEmailSender(
          required("SMTP_HOST"),
          required("SMTP_USER"),
          required("SMTP_PASSWORD"),
          template,
        );
      }
      return new ConsoleEmailSender(logger, template);
    }).singleton(),

    requestPasswordResetHandler: asClass(RequestPasswordResetHandler).scoped(),
    resetPasswordHandler: asClass(ResetPasswordHandler).scoped(),
  });

  return container;
}

export type Container = ReturnType<typeof buildContainer>;

import mercurius from "mercurius";
import type { AwilixContainer } from "awilix";
import {
  RegisterUserCommand,
  RegisterUserHandler,
} from "../../application/commands";
import { DomainError } from "../../domain";
import { LoginUserHandler } from "../../application/commands/login-user/login-handler";
import { LoginUserCommand } from "../../application/commands/login-user/login-command";
import { RequestPasswordResetCommand } from "../../application/commands/request-password-reset/request-password-reset-command";
import type { RequestPasswordResetHandler } from "../../application/commands/request-password-reset/request-password-reset-handler";
import { ResetPasswordCommand } from "../../application/commands/reset-password/reset-password-command";
import type { ResetPasswordHandler } from "../../application/commands/reset-password/reset-password-handler";
import {
  LoginArgs,
  RegisterArgs,
  RequestPasswordResetArgs,
  ResetPasswordArgs,
} from "./types";

export function buildAuthResolvers(container: AwilixContainer) {
  return {
    Mutation: {
      register: async (_: unknown, { input }: RegisterArgs) => {
        const handler = container.resolve<RegisterUserHandler>(
          "registerUserHandler",
        );
        if (input.password !== input.passwordConfirmation) {
          throw new mercurius.ErrorWithProps(
            "Passwords do not match",
            { code: "PASSWORDS_DO_NOT_MATCH" },
            400,
          );
        }

        try {
          const { accessToken, user } = await handler.execute(
            new RegisterUserCommand(input.email, input.password),
          );
          return {
            accessToken,
            user: {
              id: user.id,
              email: user.email,
              createdAt: user.createdAt.toISOString(),
            },
          };
        } catch (e) {
          if (e instanceof DomainError) {
            throw new mercurius.ErrorWithProps(
              e.message,
              { code: e.code },
              400,
            );
          }
          throw e;
        }
      },

      login: async (_: unknown, { input }: LoginArgs) => {
        const handler = container.resolve<LoginUserHandler>("loginUserHandler");
        try {
          const { accessToken, user } = await handler.execute(
            new LoginUserCommand(input.email, input.password),
          );
          return {
            accessToken,
            user: {
              id: user.id,
              email: user.email,
              createdAt: user.createdAt.toISOString(),
            },
          };
        } catch (e) {
          if (e instanceof DomainError) {
            throw new mercurius.ErrorWithProps(
              e.message,
              { code: e.code },
              400,
            );
          }
          throw e;
        }
      },

      requestPasswordReset: async (
        _: unknown,
        { email }: RequestPasswordResetArgs,
      ) => {
        const handler = container.resolve<RequestPasswordResetHandler>(
          "requestPasswordResetHandler",
        );
        const { exposedResetLink } = await handler.execute(
          new RequestPasswordResetCommand(email),
        );
        return { devResetLink: exposedResetLink };
      },

      resetPassword: async (_: unknown, { input }: ResetPasswordArgs) => {
        if (input.newPassword !== input.newPasswordConfirmation) {
          throw new mercurius.ErrorWithProps(
            "Passwords do not match",
            { code: "PASSWORDS_DO_NOT_MATCH" },
            400,
          );
        }
        const handler = container.resolve<ResetPasswordHandler>(
          "resetPasswordHandler",
        );
        await handler.execute(
          new ResetPasswordCommand(input.token, input.newPassword),
        );
        return true;
      },
    },
  };
}

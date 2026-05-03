import { ResetPasswordHandler } from "./reset-password-handler";
import { ResetPasswordCommand } from "./reset-password-command";
import { RegisterUserHandler } from "../register-user/register-handler";
import { RegisterUserCommand } from "../register-user/register-command";
import { RequestPasswordResetHandler } from "../request-password-reset/request-password-reset-handler";
import { RequestPasswordResetCommand } from "../request-password-reset/request-password-reset-command";
import {
  InvalidResetTokenError,
  ResetTokenAlreadyUsedError,
  ResetTokenExpiredError,
} from "../../../domain/errors";
import {
  InMemoryUserRepository,
  InMemoryPasswordResetTokenRepository,
  StubPasswordHasher,
  StubTokenIssuer,
  StubEmailSender,
} from "../../../test-support";

const setupWithIssuedToken = async () => {
  const userRepository = new InMemoryUserRepository();
  const tokenRepository = new InMemoryPasswordResetTokenRepository();
  const passwordHasher = new StubPasswordHasher();
  const emailSender = new StubEmailSender();

  const register = new RegisterUserHandler(
    userRepository,
    passwordHasher,
    new StubTokenIssuer(),
  );
  const requestReset = new RequestPasswordResetHandler(
    userRepository,
    tokenRepository,
    emailSender,
  );
  const resetPassword = new ResetPasswordHandler(
    userRepository,
    tokenRepository,
    passwordHasher,
  );

  await register.execute(
    new RegisterUserCommand("alice@example.com", "Password123"),
  );
  await requestReset.execute(
    new RequestPasswordResetCommand("alice@example.com"),
  );

  const rawToken = emailSender.calls[0].rawToken;

  return {
    resetPassword,
    userRepository,
    tokenRepository,
    rawToken,
  };
};

describe("ResetPasswordHandler", () => {
  it("обновляет пароль и помечает токен использованным", async () => {
    const { resetPassword, userRepository, tokenRepository, rawToken } =
      await setupWithIssuedToken();

    await resetPassword.execute(
      new ResetPasswordCommand(rawToken, "NewPassword456"),
    );

    const userId = tokenRepository.tokens[0].userId;
    const user = await userRepository.findById(userId);
    expect(user!.passwordHash.value).toBe("hashed:NewPassword456");
    expect(tokenRepository.tokens[0].usedAt).not.toBeNull();
  });

  it("кидает InvalidResetTokenError на невалидный формат токена", async () => {
    const { resetPassword } = await setupWithIssuedToken();

    await expect(
      resetPassword.execute(
        new ResetPasswordCommand("ololo", "NewPassword456"),
      ),
    ).rejects.toThrow(InvalidResetTokenError);
  });

  it("кидает InvalidResetTokenError, если токен не найден в БД", async () => {
    const { resetPassword } = await setupWithIssuedToken();
    const unknownToken = "f".repeat(64);

    await expect(
      resetPassword.execute(
        new ResetPasswordCommand(unknownToken, "NewPassword456"),
      ),
    ).rejects.toThrow(InvalidResetTokenError);
  });

  it("кидает ResetTokenAlreadyUsedError при повторном использовании", async () => {
    const { resetPassword, rawToken } = await setupWithIssuedToken();

    await resetPassword.execute(
      new ResetPasswordCommand(rawToken, "NewPassword456"),
    );

    await expect(
      resetPassword.execute(
        new ResetPasswordCommand(rawToken, "AnotherPass789"),
      ),
    ).rejects.toThrow(ResetTokenAlreadyUsedError);
  });

  it("кидает ResetTokenExpiredError, если токен просрочен", async () => {
    const { resetPassword, tokenRepository, rawToken } =
      await setupWithIssuedToken();

    tokenRepository.tokens[0] = {
      ...tokenRepository.tokens[0],
      expiresAt: new Date(Date.now() - 1000),
    };

    await expect(
      resetPassword.execute(
        new ResetPasswordCommand(rawToken, "NewPassword456"),
      ),
    ).rejects.toThrow(ResetTokenExpiredError);
  });
});

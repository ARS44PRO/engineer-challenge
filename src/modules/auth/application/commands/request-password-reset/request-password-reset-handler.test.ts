import { RequestPasswordResetHandler } from "./request-password-reset-handler";
import { RequestPasswordResetCommand } from "./request-password-reset-command";
import { RegisterUserHandler } from "../register-user/register-handler";
import { RegisterUserCommand } from "../register-user/register-command";
import {
  InMemoryUserRepository,
  InMemoryPasswordResetTokenRepository,
  StubPasswordHasher,
  StubTokenIssuer,
  StubEmailSender,
} from "../../../test-support";

const buildHandlers = () => {
  const userRepository = new InMemoryUserRepository();
  const tokenRepository = new InMemoryPasswordResetTokenRepository();
  const emailSender = new StubEmailSender();

  const register = new RegisterUserHandler(
    userRepository,
    new StubPasswordHasher(),
    new StubTokenIssuer(),
  );
  const handler = new RequestPasswordResetHandler(
    userRepository,
    tokenRepository,
    emailSender,
  );
  return { handler, register, tokenRepository, emailSender };
};

describe("RequestPasswordResetHandler", () => {
  it("выпускает токен и возвращает dev-ссылку для существующего юзера", async () => {
    const { handler, register, tokenRepository, emailSender } =
      buildHandlers();
    await register.execute(
      new RegisterUserCommand("alice@example.com", "Password123"),
    );

    const result = await handler.execute(
      new RequestPasswordResetCommand("alice@example.com"),
    );

    expect(result.exposedResetLink).not.toBeNull();
    expect(result.exposedResetLink).toContain("token=");
    expect(tokenRepository.tokens.length).toBe(1);
    expect(emailSender.calls.length).toBe(1);
    expect(emailSender.calls[0].to.value).toBe("alice@example.com");
  });

  it("возвращает null для несуществующего email (anti-enumeration)", async () => {
    const { handler, tokenRepository, emailSender } = buildHandlers();

    const result = await handler.execute(
      new RequestPasswordResetCommand("ghost@example.com"),
    );

    expect(result.exposedResetLink).toBeNull();
    expect(tokenRepository.tokens.length).toBe(0);
    expect(emailSender.calls.length).toBe(0);
  });

  it("молча выходит после 3 запросов в час (rate limit)", async () => {
    const { handler, register, tokenRepository, emailSender } =
      buildHandlers();
    await register.execute(
      new RegisterUserCommand("alice@example.com", "Password123"),
    );

    for (let i = 0; i < 3; i++) {
      const r = await handler.execute(
        new RequestPasswordResetCommand("alice@example.com"),
      );
      expect(r.exposedResetLink).not.toBeNull();
    }

    const fourth = await handler.execute(
      new RequestPasswordResetCommand("alice@example.com"),
    );

    expect(fourth.exposedResetLink).toBeNull();
    expect(tokenRepository.tokens.length).toBe(3);
    expect(emailSender.calls.length).toBe(3);
  });
});

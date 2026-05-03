import { LoginUserHandler } from "./login-handler";
import { LoginUserCommand } from "./login-command";
import { RegisterUserHandler } from "../register-user/register-handler";
import { RegisterUserCommand } from "../register-user/register-command";
import { InvalidCredentialsError } from "../../../domain/errors";
import {
  InMemoryUserRepository,
  StubPasswordHasher,
  StubTokenIssuer,
} from "../../../test-support";

const buildHandlers = () => {
  const userRepository = new InMemoryUserRepository();
  const passwordHasher = new StubPasswordHasher();
  const tokenIssuer = new StubTokenIssuer();
  const login = new LoginUserHandler(
    userRepository,
    passwordHasher,
    tokenIssuer,
  );
  const register = new RegisterUserHandler(
    userRepository,
    passwordHasher,
    tokenIssuer,
  );
  return { login, register, userRepository };
};

describe("LoginUserHandler", () => {
  it("логинит пользователя и выдаёт токен", async () => {
    const { login, register } = buildHandlers();
    const reg = await register.execute(
      new RegisterUserCommand("alice@example.com", "Password123"),
    );

    const result = await login.execute(
      new LoginUserCommand("alice@example.com", "Password123"),
    );

    expect(result.user.id).toBe(reg.user.id);
    expect(result.user.email).toBe("alice@example.com");
    expect(result.accessToken).toBe(`token-for-${reg.user.id}`);
  });

  it("принимает email с другим регистром", async () => {
    const { login, register } = buildHandlers();
    await register.execute(
      new RegisterUserCommand("alice@example.com", "Password123"),
    );

    const result = await login.execute(
      new LoginUserCommand("ALICE@EXAMPLE.COM", "Password123"),
    );

    expect(result.user.email).toBe("alice@example.com");
  });

  it("кидает InvalidCredentialsError на несуществующий email", async () => {
    const { login } = buildHandlers();
    await expect(
      login.execute(new LoginUserCommand("ghost@example.com", "Password123")),
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it("кидает InvalidCredentialsError на неверный пароль", async () => {
    const { login, register } = buildHandlers();
    await register.execute(
      new RegisterUserCommand("alice@example.com", "Password123"),
    );

    await expect(
      login.execute(new LoginUserCommand("alice@example.com", "WrongPass1")),
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it("оба сценария — нет юзера и неверный пароль — кидают одну и ту же ошибку (anti-enumeration)", async () => {
    const { login, register } = buildHandlers();
    await register.execute(
      new RegisterUserCommand("alice@example.com", "Password123"),
    );

    const noUser = await login
      .execute(new LoginUserCommand("ghost@example.com", "Password123"))
      .catch((e) => e);
    const wrongPass = await login
      .execute(new LoginUserCommand("alice@example.com", "WrongPass1"))
      .catch((e) => e);

    expect(noUser).toBeInstanceOf(InvalidCredentialsError);
    expect(wrongPass).toBeInstanceOf(InvalidCredentialsError);
    expect(noUser.message).toBe(wrongPass.message);
  });
});

import { RegisterUserHandler } from "./register-handler";
import { RegisterUserCommand } from "./register-command";
import {
  EmailAlreadyTakenError,
  InvalidEmailError,
  WeakPasswordError,
} from "../../../domain/errors";
import {
  InMemoryUserRepository,
  StubPasswordHasher,
  StubTokenIssuer,
} from "../../../test-support";

const buildHandler = () => {
  const userRepository = new InMemoryUserRepository();
  const passwordHasher = new StubPasswordHasher();
  const tokenIssuer = new StubTokenIssuer();
  const handler = new RegisterUserHandler(
    userRepository,
    passwordHasher,
    tokenIssuer,
  );
  return { handler, userRepository, passwordHasher, tokenIssuer };
};

describe("RegisterUserHandler", () => {
  it("регистрирует нового пользователя и выдаёт токен", async () => {
    const { handler, userRepository } = buildHandler();

    const result = await handler.execute(
      new RegisterUserCommand("Alice@Example.com", "Password123"),
    );

    expect(result.user.email).toBe("alice@example.com");
    expect(result.user.id).toBeDefined();
    expect(result.accessToken).toBe(`token-for-${result.user.id}`);

    const persisted = await userRepository.findById(result.user.id);
    expect(persisted).not.toBeNull();
    expect(persisted!.email.value).toBe("alice@example.com");
    expect(persisted!.passwordHash.value).toBe("hashed:Password123");
  });

  it("кидает EmailAlreadyTakenError, если email уже зарегистрирован", async () => {
    const { handler } = buildHandler();
    await handler.execute(
      new RegisterUserCommand("alice@example.com", "Password123"),
    );

    await expect(
      handler.execute(
        new RegisterUserCommand("alice@example.com", "Password123"),
      ),
    ).rejects.toThrow(EmailAlreadyTakenError);
  });

  it("кидает InvalidEmailError на невалидный формат email", async () => {
    const { handler } = buildHandler();
    await expect(
      handler.execute(new RegisterUserCommand("not-an-email", "Password123")),
    ).rejects.toThrow(InvalidEmailError);
  });

  it("кидает WeakPasswordError на слабый пароль", async () => {
    const { handler } = buildHandler();
    await expect(
      handler.execute(new RegisterUserCommand("alice@example.com", "weak")),
    ).rejects.toThrow(WeakPasswordError);
  });

  it("не сохраняет юзера, если упала валидация пароля", async () => {
    const { handler, userRepository } = buildHandler();
    await expect(
      handler.execute(new RegisterUserCommand("alice@example.com", "weak")),
    ).rejects.toThrow();

    expect(
      await userRepository.findByEmail({ value: "alice@example.com" } as any),
    ).toBeNull();
  });
});

import { User } from "./user";
import { Email } from "../value-objects/email";
import { PasswordHash } from "../value-objects/password-hash";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe("User entity", () => {
  describe("register()", () => {
    it("создаёт пользователя с валидным id, email, hash, createdAt", () => {
      const email = Email.create("user@example.com");
      const hash = new PasswordHash("hashed:secret");
      const before = Date.now();

      const user = User.register(email, hash);

      expect(user.id).toMatch(UUID);
      expect(user.email).toBe(email);
      expect(user.passwordHash).toBe(hash);
      expect(user.createdAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(user.createdAt.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it("два register дают разные id", () => {
      const email = Email.create("user@example.com");
      const hash = new PasswordHash("hashed:secret");
      const a = User.register(email, hash);
      const b = User.register(email, hash);
      expect(a.id).not.toBe(b.id);
    });
  });

  describe("restore()", () => {
    it("воссоздаёт сущность из props без модификаций", () => {
      const email = Email.create("user@example.com");
      const hash = new PasswordHash("hashed:secret");
      const props = {
        id: "00000000-0000-0000-0000-000000000001",
        email,
        passwordHash: hash,
        createdAt: new Date("2026-01-01T00:00:00Z"),
      };

      const user = User.restore(props);

      expect(user.id).toBe(props.id);
      expect(user.email).toBe(email);
      expect(user.passwordHash).toBe(hash);
      expect(user.createdAt).toEqual(props.createdAt);
    });
  });
});

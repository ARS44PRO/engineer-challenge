import { Password } from "./password";
import { WeakPasswordError } from "../errors";

describe("Password value object", () => {
  describe("принимает валидный пароль", () => {
    it("оборачивает значение, если все правила соблюдены", () => {
      const password = Password.create("Password123");
      expect(password.value).toBe("Password123");
    });

    it("принимает пароль на границе минимальной длины (8)", () => {
      const password = Password.create("Aa1aaaaa");
      expect(password.value).toBe("Aa1aaaaa");
    });

    it("принимает пароль на границе максимальной длины (128)", () => {
      const long = "Aa1" + "a".repeat(125);
      expect(long.length).toBe(128);
      expect(Password.create(long).value).toBe(long);
    });
  });

  describe("отвергает нарушение политики", () => {
    it("кидает WeakPasswordError, если короче 8 символов", () => {
      expect(() => Password.create("Aa1aaaa")).toThrow(WeakPasswordError);
    });

    it("кидает WeakPasswordError, если длиннее 128 символов", () => {
      const tooLong = "Aa1" + "a".repeat(126);
      expect(tooLong.length).toBe(129);
      expect(() => Password.create(tooLong)).toThrow(WeakPasswordError);
    });

    it("кидает WeakPasswordError без заглавной буквы", () => {
      expect(() => Password.create("password123")).toThrow(WeakPasswordError);
    });

    it("кидает WeakPasswordError без строчной буквы", () => {
      expect(() => Password.create("PASSWORD123")).toThrow(WeakPasswordError);
    });

    it("кидает WeakPasswordError без цифры", () => {
      expect(() => Password.create("Passwordaaa")).toThrow(WeakPasswordError);
    });
  });
});

import { Email } from "./email";
import { InvalidEmailError } from "../errors";

describe("Email value object", () => {
  describe("принимает валидный формат", () => {
    it("оборачивает корректный email", () => {
      const email = Email.create("user@example.com");
      expect(email.value).toBe("user@example.com");
    });

    it("приводит к lowercase", () => {
      const email = Email.create("User@Example.COM");
      expect(email.value).toBe("user@example.com");
    });

    it("обрезает пробелы по краям", () => {
      const email = Email.create("  user@example.com  ");
      expect(email.value).toBe("user@example.com");
    });
  });

  describe("отвергает невалидный формат", () => {
    it.each([
      ["пустая строка", ""],
      ["без @", "userexample.com"],
      ["без локальной части", "@example.com"],
      ["без домена", "user@"],
      ["без TLD", "user@example"],
      ["мусор", "ololo"],
      ["с пробелом внутри", "user @example.com"],
    ])("кидает InvalidEmailError на %s", (_label, raw) => {
      expect(() => Email.create(raw)).toThrow(InvalidEmailError);
    });
  });
});

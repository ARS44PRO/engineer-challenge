import { ResetToken } from "./reset-token";
import { InvalidResetTokenError } from "../errors";

const HEX_64 = /^[a-f0-9]{64}$/;

describe("ResetToken value object", () => {
  describe("generate()", () => {
    it("создаёт 64-символьный hex", () => {
      const token = ResetToken.generate();
      expect(token.value).toMatch(HEX_64);
    });

    it("каждый вызов даёт уникальное значение", () => {
      const a = ResetToken.generate();
      const b = ResetToken.generate();
      expect(a.value).not.toBe(b.value);
    });
  });

  describe("fromRaw()", () => {
    it("оборачивает валидный 64-hex токен", () => {
      const raw = "a".repeat(64);
      const token = ResetToken.fromRaw(raw);
      expect(token.value).toBe(raw);
    });

    it.each([
      ["пустая строка", ""],
      ["слишком короткий", "abc"],
      ["небитный hex (заглавные)", "A".repeat(64)],
      ["не-hex символы", "z".repeat(64)],
      ["длиннее 64", "a".repeat(65)],
    ])("кидает InvalidResetTokenError на %s", (_label, raw) => {
      expect(() => ResetToken.fromRaw(raw)).toThrow(InvalidResetTokenError);
    });
  });

  describe("hash()", () => {
    it("даёт детерминированный 64-hex хеш", () => {
      const raw = ResetToken.generate();
      const h1 = raw.hash();
      const h2 = raw.hash();
      expect(h1.value).toMatch(HEX_64);
      expect(h1.value).toBe(h2.value);
    });

    it("разные токены дают разные хеши", () => {
      const a = ResetToken.generate();
      const b = ResetToken.generate();
      expect(a.hash().value).not.toBe(b.hash().value);
    });

    it("сам токен не равен своему хешу", () => {
      const raw = ResetToken.generate();
      expect(raw.value).not.toBe(raw.hash().value);
    });
  });
});

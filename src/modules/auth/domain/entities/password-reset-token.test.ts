import { PasswordResetToken } from "./password-reset-token";
import {
  ResetTokenAlreadyUsedError,
  ResetTokenExpiredError,
} from "../errors";

const FIFTEEN_MIN_MS = 15 * 60 * 1000;

describe("PasswordResetToken entity", () => {
  describe("issue()", () => {
    it("возвращает entity и raw-токен", () => {
      const { entity, rawToken } = PasswordResetToken.issue("user-1");
      expect(entity).toBeDefined();
      expect(rawToken).toBeDefined();
    });

    it("entity связан с переданным userId, usedAt = null", () => {
      const { entity } = PasswordResetToken.issue("user-1");
      expect(entity.userId).toBe("user-1");
      expect(entity.usedAt).toBeNull();
    });

    it("tokenHash в entity = hash от raw-токена", () => {
      const { entity, rawToken } = PasswordResetToken.issue("user-1");
      expect(entity.tokenHash.value).toBe(rawToken.hash().value);
    });

    it("expiresAt = createdAt + 15 минут", () => {
      const { entity } = PasswordResetToken.issue("user-1");
      const diff = entity.expiresAt.getTime() - entity.createdAt.getTime();
      expect(diff).toBe(FIFTEEN_MIN_MS);
    });

    it("два issue дают разные id и разные токены", () => {
      const a = PasswordResetToken.issue("user-1");
      const b = PasswordResetToken.issue("user-1");
      expect(a.entity.id).not.toBe(b.entity.id);
      expect(a.rawToken.value).not.toBe(b.rawToken.value);
    });
  });

  describe("ensureUsable()", () => {
    it("не кидает на свежий неиспользованный токен", () => {
      const { entity } = PasswordResetToken.issue("user-1");
      const token = PasswordResetToken.restore(entity);
      expect(() => token.ensureUsable(new Date())).not.toThrow();
    });

    it("кидает ResetTokenExpiredError, если now >= expiresAt", () => {
      const { entity } = PasswordResetToken.issue("user-1");
      const token = PasswordResetToken.restore(entity);
      const future = new Date(entity.expiresAt.getTime() + 1);
      expect(() => token.ensureUsable(future)).toThrow(ResetTokenExpiredError);
    });

    it("кидает ResetTokenAlreadyUsedError, если usedAt установлен", () => {
      const { entity } = PasswordResetToken.issue("user-1");
      const token = PasswordResetToken.restore({
        ...entity,
        usedAt: new Date(),
      });
      expect(() => token.ensureUsable(new Date())).toThrow(
        ResetTokenAlreadyUsedError,
      );
    });

    it("если токен И использован И просрочен — приоритет AlreadyUsed", () => {
      const { entity } = PasswordResetToken.issue("user-1");
      const token = PasswordResetToken.restore({
        ...entity,
        usedAt: new Date(),
      });
      const future = new Date(entity.expiresAt.getTime() + 1);
      expect(() => token.ensureUsable(future)).toThrow(
        ResetTokenAlreadyUsedError,
      );
    });
  });
});

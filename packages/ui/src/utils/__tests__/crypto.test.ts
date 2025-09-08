import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { decrypt, encrypt } from "../crypto";
import {
  getEncryptedSessionStorage,
  removeEncryptedSessionStorage,
  setEncryptedSessionStorage,
} from "../storage";

// Mock sessionStorage for testing
const mockSessionStorage = {
  store: new Map<string, string>(),
  getItem: vi.fn((key: string) => mockSessionStorage.store.get(key) || null),
  setItem: vi.fn((key: string, value: string) => {
    mockSessionStorage.store.set(key, value);
  }),
  removeItem: vi.fn((key: string) => {
    mockSessionStorage.store.delete(key);
  }),
  clear: vi.fn(() => {
    mockSessionStorage.store.clear();
  }),
};

// Mock global objects
Object.defineProperty(global, "sessionStorage", {
  value: mockSessionStorage,
  writable: true,
});

Object.defineProperty(global, "window", {
  value: { sessionStorage: mockSessionStorage },
  writable: true,
});

describe("Crypto Utils", () => {
  beforeEach(() => {
    mockSessionStorage.store.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockSessionStorage.store.clear();
  });

  describe("encrypt/decrypt", () => {
    const testData = [
      "sk-1234567890abcdef",
      "test-api-key-12345",
      "hello-world",
      "한글테스트123",
      "sk-proj-1234567890abcdefghijklmnop",
      "special-chars!@#$%^&*()",
      "🚀✨🔐💎", // Emoji test
      "multi\nline\ntext",
      "tab\tseparated\tvalues",
    ];

    test.each(testData)(
      'should encrypt and decrypt "%s" correctly',
      (original) => {
        const encrypted = encrypt(original);
        const decrypted = decrypt(encrypted);

        expect(decrypted).toBe(original);
        expect(encrypted).not.toBe(original); // Should be different from original
        expect(encrypted.length).toBeGreaterThan(0); // Should not be empty
      },
    );

    test("should handle empty string", () => {
      const original = "";
      const encrypted = encrypt(original);
      const decrypted = decrypt(encrypted);

      expect(encrypted).toBe("");
      expect(decrypted).toBe("");
    });

    test("should produce different encrypted values for same input (salt)", () => {
      const original = "sk-test123";
      const encrypted1 = encrypt(original);
      const encrypted2 = encrypt(original);

      expect(encrypted1).not.toBe(encrypted2); // Should be different due to salt
      expect(decrypt(encrypted1)).toBe(original);
      expect(decrypt(encrypted2)).toBe(original);
    });

    test("should handle encryption errors gracefully", () => {
      // Mock btoa to throw an error
      const originalBtoa = global.btoa;
      global.btoa = vi.fn(() => {
        throw new Error("Base64 encoding failed");
      });

      // Should throw error with meaningful message
      expect(() => {
        encrypt("test");
      }).toThrow("Encryption failed: Base64 encoding failed");

      global.btoa = originalBtoa; // Restore original
    });

    test("should handle decryption errors gracefully", () => {
      // Should throw error on invalid data
      expect(() => {
        decrypt("invalid-base64-data");
      }).toThrow("Decryption failed:");
    });

    test("should handle malformed encrypted data", () => {
      const invalidData = "VGVzdA=="; // Valid base64 but wrong format
      // Should throw error on wrong format
      expect(() => {
        decrypt(invalidData);
      }).toThrow("Invalid encrypted format: expected salt:data format");
    });
  });

  describe("sessionStorage encryption", () => {
    test("should store and retrieve encrypted data", () => {
      const key = "test_encrypted_key";
      const value = "sk-test123456789";

      setEncryptedSessionStorage(key, value);
      const retrieved = getEncryptedSessionStorage(key);

      expect(retrieved).toBe(value);
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        key,
        expect.any(String),
      );
      expect(mockSessionStorage.getItem).toHaveBeenCalledWith(key);
    });

    test("should store encrypted value, not plain text", () => {
      const key = "test_key";
      const value = "secret-api-key";

      setEncryptedSessionStorage(key, value);
      const storedValue = mockSessionStorage.store.get(key);

      expect(storedValue).not.toBe(value); // Should not store plain text
      expect(storedValue).toBeTruthy(); // Should store something
      expect(storedValue!.length).toBeGreaterThan(value.length); // Encrypted should be longer
    });

    test("should handle empty values", () => {
      const key = "test_empty";
      const value = "";

      setEncryptedSessionStorage(key, value);
      const retrieved = getEncryptedSessionStorage(key);

      expect(retrieved).toBe("");
    });

    test("should handle non-existent keys", () => {
      const result = getEncryptedSessionStorage("non_existent_key");
      expect(result).toBe("");
    });

    test("should remove encrypted data", () => {
      const key = "test_remove";
      const value = "test-value";

      setEncryptedSessionStorage(key, value);
      expect(getEncryptedSessionStorage(key)).toBe(value);

      removeEncryptedSessionStorage(key);
      expect(getEncryptedSessionStorage(key)).toBe("");
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(key);
    });

    test("should handle storage errors gracefully", () => {
      const originalSetItem = mockSessionStorage.setItem;
      mockSessionStorage.setItem = vi.fn(() => {
        throw new Error("Storage quota exceeded");
      });

      // Should throw error with meaningful message
      expect(() => {
        setEncryptedSessionStorage("test", "value");
      }).toThrow(
        'Failed to store encrypted data for key "test": Storage quota exceeded',
      );

      mockSessionStorage.setItem = originalSetItem; // Restore
    });
  });

  describe("Unicode and special characters", () => {
    const unicodeTestCases = [
      "안녕하세요", // Korean
      "こんにちは", // Japanese
      "你好", // Chinese
      "🚀🔐💎✨", // Emojis
      "Café naïve résumé", // Accented characters
      "𝕳𝖊𝖑𝖑𝖔", // Mathematical symbols
      "‰‱‽⁇⁉", // Special punctuation
      "\u0000\u001F\u007F", // Control characters
    ];

    test.each(unicodeTestCases)(
      'should handle Unicode text "%s" correctly',
      (original) => {
        const encrypted = encrypt(original);
        const decrypted = decrypt(encrypted);

        expect(decrypted).toBe(original);
        expect(encrypted).not.toBe(original);
      },
    );
  });

  describe("Large data handling", () => {
    test("should handle long strings", () => {
      const longString = "a".repeat(10000); // 10KB string
      const encrypted = encrypt(longString);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(longString);
      expect(encrypted.length).toBeGreaterThan(longString.length);
    });

    test("should handle API key formats", () => {
      const apiKeyFormats = [
        "fdsfgdsfgdsfgsfgdasdfasfdasfdasdfs",
        "sk-asfdsadfasdfasdfasdfasfdasfdasasdfasdfas",
        "afdssadfsafd-1234567890123-abcdefghijklmnopqrstuvwx",
        "afdasfdasfdfdasdfsqwrewq55e4r65gh4g65hj4g32h4ty",
      ];

      apiKeyFormats.forEach((apiKey) => {
        const encrypted = encrypt(apiKey);
        const decrypted = decrypt(encrypted);

        expect(decrypted).toBe(apiKey);
        expect(encrypted).not.toContain(apiKey.substring(10, 30)); // Should not contain readable parts
      });
    });
  });

  describe("Security features", () => {
    test("should use different salts for same input", () => {
      const input = "sk-test123";
      const encrypted1 = encrypt(input);
      const encrypted2 = encrypt(input);

      expect(encrypted1).not.toBe(encrypted2);

      // Both should decrypt to same original
      expect(decrypt(encrypted1)).toBe(input);
      expect(decrypt(encrypted2)).toBe(input);
    });

    test("should produce base64-safe output", () => {
      const testInputs = ["test", "sk-123", "한글", "🚀"];

      testInputs.forEach((input) => {
        const encrypted = encrypt(input);
        // Should be valid base64 (only contains valid base64 characters)
        expect(encrypted).toMatch(/^[A-Za-z0-9+/]*={0,2}$/);
      });
    });

    test("encrypted data should not contain original text patterns", () => {
      const sensitiveData = [
        "sk-1234567890abcdef",
        "password123",
        "secret-api-key",
      ];

      sensitiveData.forEach((data) => {
        const encrypted = encrypt(data);

        // Encrypted should not contain recognizable patterns from original
        expect(encrypted.toLowerCase()).not.toContain(
          data.substring(3, 10).toLowerCase(),
        );
        expect(encrypted).not.toContain(data.substring(0, 5));
      });
    });
  });
});

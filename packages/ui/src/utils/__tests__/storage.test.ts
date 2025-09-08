import { beforeEach, describe, expect, test, vi } from "vitest";

import {
  clearEncryptedSessionStorage,
  getEncryptedSessionStorage,
  hasEncryptedSessionStorage,
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

// Mock global sessionStorage
Object.defineProperty(global, "sessionStorage", {
  value: mockSessionStorage,
  writable: true,
});

Object.defineProperty(global, "window", {
  value: { sessionStorage: mockSessionStorage },
  writable: true,
});

describe("Storage Utils", () => {
  beforeEach(() => {
    mockSessionStorage.store.clear();
    vi.clearAllMocks();
  });

  describe("encrypted sessionStorage operations", () => {
    test("should store and retrieve encrypted data", () => {
      const key = "test_key";
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
      const key = "test_encrypted";
      const value = "secret-api-key";

      setEncryptedSessionStorage(key, value);
      const storedValue = mockSessionStorage.store.get(key);

      expect(storedValue).not.toBe(value); // Should not store plain text
      expect(storedValue).toBeTruthy(); // Should store something
      expect(storedValue!.length).toBeGreaterThan(0); // Should have content
    });

    test("should handle empty values correctly", () => {
      const key = "empty_test";
      const value = "";

      setEncryptedSessionStorage(key, value);
      const retrieved = getEncryptedSessionStorage(key);

      expect(retrieved).toBe("");
    });

    test("should return empty string for non-existent keys", () => {
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

    test("should check if encrypted data exists", () => {
      const key = "existence_test";
      const value = "test-value";

      // Initially should not exist
      expect(hasEncryptedSessionStorage(key)).toBe(false);

      // After storing should exist
      setEncryptedSessionStorage(key, value);
      expect(hasEncryptedSessionStorage(key)).toBe(true);

      // After removing should not exist
      removeEncryptedSessionStorage(key);
      expect(hasEncryptedSessionStorage(key)).toBe(false);
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

    test("should clear all sessionStorage data", () => {
      // Mock setItem to not throw for this test
      const originalSetItem = mockSessionStorage.setItem;
      mockSessionStorage.setItem = vi.fn((key: string, value: string) => {
        mockSessionStorage.store.set(key, value);
      });

      // Store some test data
      setEncryptedSessionStorage("key1", "value1");
      setEncryptedSessionStorage("key2", "value2");

      expect(hasEncryptedSessionStorage("key1")).toBe(true);
      expect(hasEncryptedSessionStorage("key2")).toBe(true);

      // Clear all
      clearEncryptedSessionStorage();

      expect(hasEncryptedSessionStorage("key1")).toBe(false);
      expect(hasEncryptedSessionStorage("key2")).toBe(false);
      expect(mockSessionStorage.clear).toHaveBeenCalled();

      mockSessionStorage.setItem = originalSetItem; // Restore
    });
  });

  describe("Unicode and special data", () => {
    const testCases = [
      { key: "korean", value: "안녕하세요" },
      { key: "emoji", value: "🚀🔐💎✨" },
      { key: "mixed", value: "Hello 안녕 🚀 World!" },
      { key: "api_key", value: "sk-proj-1234567890abcdefghijklmnop" },
      { key: "json", value: '{"name":"test","value":123}' },
      { key: "multiline", value: "line1\nline2\nline3" },
    ];

    test.each(testCases)(
      "should handle $key: $value correctly",
      ({ key, value }) => {
        // Mock setItem to not throw for unicode tests
        const originalSetItem = mockSessionStorage.setItem;
        mockSessionStorage.setItem = vi.fn((key: string, value: string) => {
          mockSessionStorage.store.set(key, value);
        });

        setEncryptedSessionStorage(key, value);
        const retrieved = getEncryptedSessionStorage(key);

        expect(retrieved).toBe(value);
        expect(hasEncryptedSessionStorage(key)).toBe(true);

        // Verify it's actually encrypted in storage
        const rawStored = mockSessionStorage.store.get(key);
        expect(rawStored).not.toBe(value);
        expect(rawStored).toBeTruthy();

        mockSessionStorage.setItem = originalSetItem; // Restore
      },
    );
  });

  describe("Edge cases", () => {
    test("should handle null/undefined gracefully", () => {
      // These should not throw
      expect(() => getEncryptedSessionStorage("")).not.toThrow();
      expect(() => hasEncryptedSessionStorage("")).not.toThrow();
      expect(() => removeEncryptedSessionStorage("")).not.toThrow();
    });

    test("should handle SSR environment (no window)", () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;

      // Should not throw and return safe defaults
      expect(() => {
        setEncryptedSessionStorage("test", "value");
        const result = getEncryptedSessionStorage("test");
        expect(result).toBe("");
        const exists = hasEncryptedSessionStorage("test");
        expect(exists).toBe(false);
        removeEncryptedSessionStorage("test");
        clearEncryptedSessionStorage();
      }).not.toThrow();

      global.window = originalWindow; // Restore
    });

    test("should handle corrupted storage data", () => {
      const key = "corrupted_test";

      // Manually put invalid encrypted data
      mockSessionStorage.store.set(key, "invalid-base64-data!");

      // Should throw error on corrupted data
      expect(() => {
        getEncryptedSessionStorage(key);
      }).toThrow('Failed to retrieve encrypted data for key "corrupted_test"');
    });
  });
});

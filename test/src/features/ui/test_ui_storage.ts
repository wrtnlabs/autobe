import assert from "node:assert/strict";

import {
  clearEncryptedSessionStorage,
  getEncryptedSessionStorage,
  hasEncryptedSessionStorage,
  removeEncryptedSessionStorage,
  setEncryptedSessionStorage,
} from "../../../../packages/ui/src/utils";
import {
  MockSessionStorage,
  installBase64Mocks,
  installBrowserStorageMocks,
} from "./internal/MockSessionStorage";

const assertThrowsMessage = (
  label: string,
  task: () => void,
  pattern: RegExp,
): void => {
  let thrown: unknown;
  try {
    task();
  } catch (error) {
    thrown = error;
  }
  assert(thrown instanceof Error, `${label}: expected an error`);
  assert.match(thrown.message, pattern, label);
};

export const test_ui_storage = (): void => {
  installBase64Mocks();
  const storage = new MockSessionStorage();
  installBrowserStorageMocks(storage);

  storage.reset();
  setEncryptedSessionStorage("test_key", "sk-test123456789");
  assert.equal(getEncryptedSessionStorage("test_key"), "sk-test123456789");
  assert.equal(storage.calls.setItem.length, 1);
  assert.equal(storage.calls.setItem[0][0], "test_key");
  assert.equal(storage.calls.getItem.at(-1), "test_key");

  storage.reset();
  setEncryptedSessionStorage("test_encrypted", "secret-api-key");
  const storedValue: string | undefined = storage.store.get("test_encrypted");
  assert(storedValue !== undefined);
  assert.notEqual(storedValue, "secret-api-key");
  assert(storedValue.length > 0);

  storage.reset();
  setEncryptedSessionStorage("empty_test", "");
  assert.equal(getEncryptedSessionStorage("empty_test"), "");
  assert.equal(getEncryptedSessionStorage("non_existent_key"), "");

  storage.reset();
  setEncryptedSessionStorage("test_remove", "test-value");
  assert.equal(getEncryptedSessionStorage("test_remove"), "test-value");
  removeEncryptedSessionStorage("test_remove");
  assert.equal(getEncryptedSessionStorage("test_remove"), "");
  assert.deepEqual(storage.calls.removeItem, ["test_remove"]);

  storage.reset();
  assert.equal(hasEncryptedSessionStorage("existence_test"), false);
  setEncryptedSessionStorage("existence_test", "test-value");
  assert.equal(hasEncryptedSessionStorage("existence_test"), true);
  removeEncryptedSessionStorage("existence_test");
  assert.equal(hasEncryptedSessionStorage("existence_test"), false);

  storage.reset();
  storage.setItemError = new Error("Storage quota exceeded");
  assertThrowsMessage(
    "storage write error",
    () => setEncryptedSessionStorage("test", "value"),
    /Failed to store encrypted data for key "test": Storage quota exceeded/,
  );

  storage.reset();
  setEncryptedSessionStorage("key1", "value1");
  setEncryptedSessionStorage("key2", "value2");
  assert.equal(hasEncryptedSessionStorage("key1"), true);
  assert.equal(hasEncryptedSessionStorage("key2"), true);
  clearEncryptedSessionStorage();
  assert.equal(hasEncryptedSessionStorage("key1"), false);
  assert.equal(hasEncryptedSessionStorage("key2"), false);
  assert.equal(storage.calls.clear, 1);

  for (const { key, value } of [
    { key: "korean", value: "\uC548\uB155\uD558\uC138\uC694" },
    { key: "emoji", value: "\u{1F600}\u{1F680}\u{1F4BB}" },
    { key: "mixed", value: "Hello \uC548\uB155 \u{1F44B} World!" },
    { key: "api_key", value: "sk-proj-1234567890abcdefghijklmnop" },
    { key: "json", value: '{"name":"test","value":123}' },
    { key: "multiline", value: "line1\nline2\nline3" },
  ]) {
    storage.reset();
    setEncryptedSessionStorage(key, value);
    assert.equal(getEncryptedSessionStorage(key), value);
    assert.equal(hasEncryptedSessionStorage(key), true);
    assert.notEqual(storage.store.get(key), value);
  }

  assert.doesNotThrow(() => getEncryptedSessionStorage(""));
  assert.doesNotThrow(() => hasEncryptedSessionStorage(""));
  assert.doesNotThrow(() => removeEncryptedSessionStorage(""));

  const originalWindow = (globalThis as { window?: unknown }).window;
  Reflect.deleteProperty(globalThis, "window");
  assert.doesNotThrow(() => {
    setEncryptedSessionStorage("ssr", "value");
    assert.equal(getEncryptedSessionStorage("ssr"), "");
    assert.equal(hasEncryptedSessionStorage("ssr"), false);
    removeEncryptedSessionStorage("ssr");
    clearEncryptedSessionStorage();
  });
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    writable: true,
    value: originalWindow,
  });

  storage.reset();
  storage.store.set("corrupted_test", "invalid-base64-data!");
  assertThrowsMessage(
    "corrupted storage data",
    () => getEncryptedSessionStorage("corrupted_test"),
    /Failed to retrieve encrypted data for key "corrupted_test"/,
  );
};

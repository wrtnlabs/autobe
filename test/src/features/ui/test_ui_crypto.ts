import assert from "node:assert/strict";

import { decrypt, encrypt } from "../../../../packages/ui/src/utils";
import { installBase64Mocks } from "./internal/MockSessionStorage";

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

export const test_ui_crypto = (): void => {
  installBase64Mocks();

  const samples: string[] = [
    "sk-1234567890abcdef",
    "test-api-key-12345",
    "hello-world",
    "\uC548\uB155\uD558\uC138\uC694123",
    "sk-proj-1234567890abcdefghijklmnop",
    "special-chars!@#$%^&*()",
    "\u{1F600}\u{1F680}\u{1F4BB}",
    "multi\nline\ntext",
    "tab\tseparated\tvalues",
    "Cafe naive resume",
    "\u0000\u001F\u007F",
  ];

  for (const original of samples) {
    const encrypted: string = encrypt(original);
    assert.equal(decrypt(encrypted), original, `round trip: ${original}`);
    assert.notEqual(encrypted, original, `encrypted text differs: ${original}`);
    assert(encrypted.length > 0, `encrypted output is not empty: ${original}`);
    assert.match(encrypted, /^[A-Za-z0-9+/]*={0,2}$/, "base64-safe output");
  }

  assert.equal(encrypt(""), "");
  assert.equal(decrypt(""), "");

  const saltedInput = "sk-test123";
  const first = encrypt(saltedInput);
  const second = encrypt(saltedInput);
  assert.notEqual(first, second, "encryption uses a salt");
  assert.equal(decrypt(first), saltedInput);
  assert.equal(decrypt(second), saltedInput);

  const large = "a".repeat(10_000);
  const largeEncrypted = encrypt(large);
  assert.equal(decrypt(largeEncrypted), large);
  assert(largeEncrypted.length > large.length, "large encrypted output grows");

  for (const value of [
    "fdsfgdsfgdsfgsfgdasdfasfdasfdasdfs",
    "sk-asfdsadfasdfasdfasdfasfdasfdasasdfasdfas",
    "afdssadfsafd-1234567890123-abcdefghijklmnopqrstuvwx",
    "afdasfdasfdfdasdfsqwrewq55e4r65gh4g65hj4g32h4ty",
  ]) {
    const encrypted: string = encrypt(value);
    assert.equal(decrypt(encrypted), value);
    assert(!encrypted.includes(value.substring(10, 30)));
  }

  for (const sensitive of [
    "sk-1234567890abcdef",
    "password123",
    "secret-api-key",
  ]) {
    const encrypted: string = encrypt(sensitive);
    assert(!encrypted.toLowerCase().includes(sensitive.substring(3, 10)));
    assert(!encrypted.includes(sensitive.substring(0, 5)));
  }

  const originalBtoa: typeof btoa = btoa;
  Object.defineProperty(globalThis, "btoa", {
    configurable: true,
    writable: true,
    value: (): string => {
      throw new Error("Base64 encoding failed");
    },
  });
  assertThrowsMessage(
    "encrypt error",
    () => encrypt("test"),
    /Encryption failed: Base64 encoding failed/,
  );
  Object.defineProperty(globalThis, "btoa", {
    configurable: true,
    writable: true,
    value: originalBtoa,
  });

  assertThrowsMessage(
    "invalid base64",
    () => decrypt("invalid-base64-data"),
    /Decryption failed:/,
  );
  assertThrowsMessage(
    "malformed encrypted data",
    () => decrypt("VGVzdA=="),
    /Invalid encrypted format: expected salt:data format/,
  );
};

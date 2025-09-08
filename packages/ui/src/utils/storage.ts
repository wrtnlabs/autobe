/**
 * Encrypted sessionStorage utilities Provides secure storage functions using
 * encryption
 */
import { decrypt, encrypt } from "./crypto";

/**
 * Safely store encrypted data in sessionStorage
 *
 * @param key - Storage key
 * @param value - Plain text value to encrypt and store
 */
export const setEncryptedSessionStorage = (
  key: string,
  value: string,
): void => {
  if (typeof window === "undefined") return;

  try {
    const encrypted = encrypt(value);
    sessionStorage.setItem(key, encrypted);
  } catch (error) {
    throw new Error(
      `Failed to store encrypted data for key "${key}": ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};

/**
 * Safely retrieve and decrypt data from sessionStorage
 *
 * @param key - Storage key
 * @returns Decrypted plain text value
 */
export const getEncryptedSessionStorage = (key: string): string => {
  if (typeof window === "undefined") return "";

  try {
    const encrypted = sessionStorage.getItem(key);
    if (!encrypted) return "";
    return decrypt(encrypted);
  } catch (error) {
    throw new Error(
      `Failed to retrieve encrypted data for key "${key}": ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};

/**
 * Remove encrypted data from sessionStorage
 *
 * @param key - Storage key
 */
export const removeEncryptedSessionStorage = (key: string): void => {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.removeItem(key);
  } catch (error) {
    throw new Error(
      `Failed to remove encrypted data for key "${key}": ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};

/**
 * Check if encrypted data exists in sessionStorage
 *
 * @param key - Storage key
 * @returns Whether the key exists and has a value
 */
export const hasEncryptedSessionStorage = (key: string): boolean => {
  if (typeof window === "undefined") return false;

  try {
    const value = sessionStorage.getItem(key);
    return value !== null && value !== "";
  } catch (error) {
    throw new Error(
      `Failed to check encrypted data for key "${key}": ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};

/** Clear all sessionStorage data (use with caution) */
export const clearEncryptedSessionStorage = (): void => {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.clear();
  } catch (error) {
    throw new Error(
      `Failed to clear sessionStorage: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};

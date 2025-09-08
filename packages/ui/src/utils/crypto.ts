/**
 * Simple and reliable encryption utilities using browser built-in functions
 * Uses TextEncoder/TextDecoder for proper Unicode support + XOR + Base64
 */

const ENCRYPTION_KEY = "AutoBE_Secret_2024_v3.0_Unicode"; // Unicode-safe key

/**
 * Simple encrypt using TextEncoder for Unicode safety
 *
 * @param text - Text to encrypt
 * @returns Encrypted base64 string
 */
export const encrypt = (text: string): string => {
  if (!text) return "";

  try {
    // Use TextEncoder for proper Unicode → UTF-8 bytes conversion
    const encoder = new TextEncoder();
    const textBytes = encoder.encode(text);

    // Generate simple salt
    const salt = Math.random().toString(36).substring(2, 10);
    const keyBytes = encoder.encode(ENCRYPTION_KEY + salt);

    // XOR encryption on bytes level
    const encryptedBytes = new Uint8Array(textBytes.length);
    for (let i = 0; i < textBytes.length; i++) {
      encryptedBytes[i] = textBytes[i] ^ keyBytes[i % keyBytes.length];
    }

    // Convert to hex string for safe concatenation
    const encryptedHex = Array.from(encryptedBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Combine salt + encrypted hex
    const combined = salt + ":" + encryptedHex;

    // Base64 encode the final result (handle Unicode properly)
    const result = btoa(unescape(encodeURIComponent(combined)));
    return result;
  } catch (error) {
    throw new Error(
      `Encryption failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};

/**
 * Simple decrypt using TextDecoder for Unicode safety
 *
 * @param encryptedText - Base64 encrypted string
 * @returns Decrypted plain text
 */
export const decrypt = (encryptedText: string): string => {
  if (!encryptedText) return "";

  try {
    // Base64 decode (handle Unicode properly)
    const combined = decodeURIComponent(escape(atob(encryptedText)));
    const parts = combined.split(":");

    if (parts.length !== 2) {
      throw new Error("Invalid encrypted format: expected salt:data format");
    }

    const salt = parts[0];
    const encryptedHex = parts[1];

    // Convert hex back to bytes
    const encryptedBytes = new Uint8Array(
      encryptedHex.match(/.{2}/g)?.map((hex) => parseInt(hex, 16)) || [],
    );

    // Recreate key
    const encoder = new TextEncoder();
    const keyBytes = encoder.encode(ENCRYPTION_KEY + salt);

    // XOR decryption
    const decryptedBytes = new Uint8Array(encryptedBytes.length);
    for (let i = 0; i < encryptedBytes.length; i++) {
      decryptedBytes[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length];
    }

    // Use TextDecoder for proper UTF-8 → Unicode conversion
    const decoder = new TextDecoder();
    const result = decoder.decode(decryptedBytes);
    return result;
  } catch (error) {
    throw new Error(
      `Decryption failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};

import crypto from "crypto";

export namespace PasswordUtil {
  /**
   * Common password utilities for consistent authentication Uses native crypto
   * module for password hashing
   */
  // Fixed salt for password hashing (consistent across all operations)
  export const FIXED_SALT: "autobe-fixed-salt-2024" = "autobe-fixed-salt-2024";

  /**
   * Hash a plain password using crypto.pbkdf2 All authentication operations
   * (join, login) MUST use this method
   *
   * @param plainPassword - The plain text password to hash
   * @returns The hashed password as hex string
   */
  export async function hash(plainPassword: string): Promise<string> {
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(
        plainPassword,
        PasswordUtil.FIXED_SALT,
        10000,
        64,
        "sha512",
        (err: Error | null, derivedKey: Buffer) => {
          if (err) reject(err);
          else resolve(derivedKey.toString("hex"));
        },
      );
    });
  }

  /**
   * Verify a plain password against a hashed password Login operations MUST use
   * this method for password verification
   *
   * @param plainPassword - The plain text password to verify
   * @param hashedPassword - The hashed password from database
   * @returns True if passwords match, false otherwise
   */
  export async function verify(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    const hash = await PasswordUtil.hash(plainPassword);
    return hash === hashedPassword;
  }
}

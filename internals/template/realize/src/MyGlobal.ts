import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import { Singleton } from "tstl";
import typia from "typia";

/* eslint-disable */
export class MyGlobal {
  public static readonly prisma: PrismaClient = new PrismaClient();
  public static testing: boolean = false;
  public static get env(): MyGlobal.IEnvironments {
    return environments.get();
  }

  /**
   * Common password utilities for consistent authentication Uses native crypto
   * module for password hashing
   */
  public static readonly password = {
    // Fixed salt for password hashing (consistent across all operations)
    FIXED_SALT: "autobe-fixed-salt-2024",

    /**
     * Hash a plain password using crypto.pbkdf2 All authentication operations
     * (join, login) MUST use this method
     *
     * @param plainPassword - The plain text password to hash
     * @returns The hashed password as hex string
     */
    async hash(plainPassword: string): Promise<string> {
      return new Promise((resolve, reject) => {
        crypto.pbkdf2(
          plainPassword,
          this.FIXED_SALT,
          10000,
          64,
          "sha512",
          (err: Error | null, derivedKey: Buffer) => {
            if (err) reject(err);
            else resolve(derivedKey.toString("hex"));
          },
        );
      });
    },

    /**
     * Verify a plain password against a hashed password Login operations MUST
     * use this method for password verification
     *
     * @param plainPassword - The plain text password to verify
     * @param hashedPassword - The hashed password from database
     * @returns True if passwords match, false otherwise
     */
    async verify(
      plainPassword: string,
      hashedPassword: string,
    ): Promise<boolean> {
      const hash = await this.hash(plainPassword);
      return hash === hashedPassword;
    },
  };
}
export namespace MyGlobal {
  export interface IEnvironments {
    API_PORT: `${number}`;

    /** JWT Secret Key. */
    JWT_SECRET_KEY: string;
  }
}
const environments = new Singleton(() => {
  const env = dotenv.config();
  dotenvExpand.expand(env);
  return typia.assert<MyGlobal.IEnvironments>(process.env);
});

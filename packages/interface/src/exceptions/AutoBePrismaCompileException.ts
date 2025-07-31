import { IAutoBePrismaCompileResult } from "../compiler";
import { AutoBeExceptionBase } from "./AutoBeExceptionBase";

/**
 * Exception interface for errors occurring during Prisma schema compilation.
 * This exception is thrown when the Prisma compiler fails to validate the
 * generated database schema (prisma.schema file).
 */
export interface AutoBePrismaCompileException
  extends AutoBeExceptionBase<"prismaCompile"> {
  /**
   * Detailed compilation result containing specific error information. Includes
   * error messages, line numbers, and other diagnostic information from the
   * Prisma compiler to help identify and fix schema issues.
   */
  result: IAutoBePrismaCompileResult.IException;
}

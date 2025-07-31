import { IAutoBeTypeScriptCompileResult } from "../compiler";
import { AutoBeExceptionBase } from "./AutoBeExceptionBase";

/**
 * Exception interface for errors occurring during TypeScript compilation. This
 * exception is thrown when the TypeScript compiler fails to validate the
 * generated code during any phase of the AutoBE process.
 */
export interface AutoBeTypescriptCompileException
  extends AutoBeExceptionBase<"typescriptCompile"> {
  /**
   * Detailed compilation result containing specific TypeScript error
   * information. Includes error messages, file paths, line numbers, error
   * codes, and other diagnostic information from the TypeScript compiler.
   */
  result: IAutoBeTypeScriptCompileResult.IException;
}

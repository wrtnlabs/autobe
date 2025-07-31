import { AutoBeAgenticaException } from "./AutoBeAgenticaException";
import { AutoBePrismaCompileException } from "./AutoBePrismaCompileException";
import { AutoBeTypescriptCompileException } from "./AutoBeTypescriptCompileException";

/**
 * Union type representing all possible exceptions in the AutoBE system. This
 * type combines all specific exception types that can occur during the AutoBE
 * waterfall development process.
 */
export type AutoBeException =
  | AutoBeAgenticaException
  | AutoBeTypescriptCompileException
  | AutoBePrismaCompileException;

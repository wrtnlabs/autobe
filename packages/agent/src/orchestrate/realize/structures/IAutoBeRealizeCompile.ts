import {
  AutoBeOpenApi,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { tags } from "typia";

import { FAILED } from "./IAutoBeRealizeFailedSymbol";

export namespace IAutoBeRealizeCompile {
  type IBase<T extends "success" | "failed"> = {
    type: T;
  };

  interface IOperation {
    /**
     * Operation: An object containing the function specification including the
     * endpoint
     */
    op: AutoBeOpenApi.IOperation;
  }

  interface SuccessResult {
    /** The name of the file where the implementation will be written */
    filename: string;
    /** The generated implementation code for the function */
    implementationCode: string;
    /** Function name */
    name: string;
  }

  export interface Success extends IBase<"success">, IOperation {
    result: SuccessResult;
  }

  export interface Fail extends IBase<"failed">, IOperation {
    result: FAILED;
  }

  export interface FileContentMapEntry {
    result: "failed" | "success";
    content: string;
    role?: (string & tags.MinLength<1>) | null;
    endpoint?: AutoBeOpenApi.IEndpoint;
    location?: string;
    name?: string;
  }

  export type FileContentMap = Record<string, FileContentMapEntry>;

  export interface CompileDiagnostics {
    /**
     * Array containing all errors including previous attempts. Includes errors
     * that have already been resolved. Used to preserve error context and
     * identify recurring error patterns.
     */
    total: IAutoBeTypeScriptCompileResult.IDiagnostic[];
    /**
     * Array containing errors from the most recent code compilation. These are
     * the errors that need to be resolved in the current iteration.
     */
    current: IAutoBeTypeScriptCompileResult.IDiagnostic[];
  }
}

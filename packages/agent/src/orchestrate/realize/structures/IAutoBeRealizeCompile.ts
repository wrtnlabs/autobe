import {
  AutoBeOpenApi,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { tags } from "typia";

import { IAutoBeRealizeCoderApplication } from "./IAutoBeRealizeCoderApplication";
import { FAILED } from "./IAutoBeRealizeFailedSymbol";

export namespace IAutoBeRealizeCompile {
  export type Result =
    | IAutoBeRealizeCompile.Success
    | IAutoBeRealizeCompile.Fail;

  type IBase<T extends "success" | "failed"> = {
    /**
     * Indicates whether code generation was attempted. "success" means code was
     * generated, but compilation may still fail. "failed" means code generation
     * was not possible (e.g., invalid input).
     */
    type: T;
  };

  export interface Success extends IBase<"success"> {
    /**
     * Operation: An object containing the function specification including the
     * endpoint
     */
    operation: AutoBeOpenApi.IOperation;

    /** Result */
    result: IAutoBeRealizeCoderApplication.RealizeCoderOutput;
  }

  export interface Fail extends IBase<"failed"> {
    /**
     * Operation: An object containing the function specification including the
     * endpoint
     */
    operation: AutoBeOpenApi.IOperation;

    /** Result */
    result: FAILED;
  }

  export interface CodeArtifact {
    result: "failed" | "success";
    content: string;
    role?: (string & tags.MinLength<1>) | null;
    endpoint?: AutoBeOpenApi.IEndpoint;
    location: string;
    name?: string;
  }

  export type FileContentMap = Record<string, CodeArtifact>;

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

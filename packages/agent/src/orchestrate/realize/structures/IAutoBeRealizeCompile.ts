import {
  AutoBeOpenApi,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { tags } from "typia";

import { IAutoBeRealizeCoderApplication } from "./IAutoBeRealizeCoderApplication";
import { FAILED } from "./IAutoBeRealizeFailedSymbol";

export namespace IAutoBeRealizeCompile {
  export interface Success {
    type: "success";
    op: AutoBeOpenApi.IOperation;
    result: Pick<
      IAutoBeRealizeCoderApplication.RealizeCoderOutput,
      "filename" | "implementationCode"
    > & {
      /** Function name */
      name: string;
    };
  }

  export interface Fail {
    type: "failed";
    op: AutoBeOpenApi.IOperation;
    result: FAILED;
  }

  export type FileContentMap = Record<
    string,
    {
      result: "failed" | "success";
      content: string;
      role?: (string & tags.MinLength<1>) | null;
      endpoint?: AutoBeOpenApi.IEndpoint;
      location?: string;
      name?: string;
    }
  >;

  export interface CompileDiagnostics {
    total: IAutoBeTypeScriptCompileResult.IDiagnostic[];
    current: IAutoBeTypeScriptCompileResult.IDiagnostic[];
  }
}

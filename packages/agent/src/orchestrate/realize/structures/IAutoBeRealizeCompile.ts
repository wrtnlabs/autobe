import {
  AutoBeOpenApi,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";

import { IAutoBeRealizeCoderApplication } from "./IAutoBeRealizeCoderApplication";
import { FAILED } from "./IAutoBeRealizeFailedSymbol";

export namespace IAutoBeRealizeCompile {
  export interface Success {
    type: "success";
    op: AutoBeOpenApi.IOperation;
    result: Pick<
      IAutoBeRealizeCoderApplication.RealizeCoderOutput,
      "filename" | "implementationCode"
    >;
  }

  export interface Fail {
    type: "failed";
    op: AutoBeOpenApi.IOperation;
    result: FAILED;
  }

  export type FileContentMap = Record<
    string,
    { content: string; result: "failed" | "success" }
  >;

  export interface CompileDiagnostics {
    total: IAutoBeTypeScriptCompileResult.IDiagnostic[];
    current: IAutoBeTypeScriptCompileResult.IDiagnostic[];
  }
}

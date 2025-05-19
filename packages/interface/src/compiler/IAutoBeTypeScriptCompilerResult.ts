export type IAutoBeTypeScriptCompilerResult =
  | IAutoBeTypeScriptCompilerResult.ISuccess
  | IAutoBeTypeScriptCompilerResult.IFailure
  | IAutoBeTypeScriptCompilerResult.IException;
export namespace IAutoBeTypeScriptCompilerResult {
  export interface ISuccess {
    type: "success";
    javascript: Record<string, string>;
  }
  export interface IFailure {
    type: "failure";
    diagnostics: IDiagnostic[];
    javascript: Record<string, string>;
  }
  export interface IException {
    type: "exception";
    error: unknown;
  }

  export interface IDiagnostic {
    file: string | null;
    category: DiagnosticCategory;
    code: number | string;
    start: number | undefined;
    length: number | undefined;
    messageText: string;
  }

  export type DiagnosticCategory =
    | "warning"
    | "error"
    | "suggestion"
    | "message";
}

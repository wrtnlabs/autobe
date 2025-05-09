export type IAutoBeTypeScriptCompilerResult =
  | IAutoBeTypeScriptCompilerResult.ISuccess
  | IAutoBeTypeScriptCompilerResult.IError
  | IAutoBeTypeScriptCompilerResult.IFailure;
export namespace IAutoBeTypeScriptCompilerResult {
  export interface ISuccess {
    type: "success";
    javascript: Record<string, string>;
  }
  export interface IError {
    type: "error";
    error: unknown;
  }
  export interface IFailure {
    type: "failure";
    diagnostics: IDiagnostic[];
    javascript: Record<string, string>;
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

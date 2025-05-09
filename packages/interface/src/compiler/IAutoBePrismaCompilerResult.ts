export type IAutoBePrismaCompilerResult =
  | IAutoBePrismaCompilerResult.ISuccess
  | IAutoBePrismaCompilerResult.IFailure
  | IAutoBePrismaCompilerResult.IError;
export namespace IAutoBePrismaCompilerResult {
  export interface ISuccess {
    type: "success";
    files: Record<string, string>;
  }
  export interface IFailure {
    type: "failure";
    reason: string;
  }
  export interface IError {
    type: "error";
    error: unknown;
  }
}

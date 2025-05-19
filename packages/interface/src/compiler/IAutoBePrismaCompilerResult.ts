export type IAutoBePrismaCompilerResult =
  | IAutoBePrismaCompilerResult.ISuccess
  | IAutoBePrismaCompilerResult.IFailure
  | IAutoBePrismaCompilerResult.IException;
export namespace IAutoBePrismaCompilerResult {
  export interface ISuccess {
    type: "success";
    document: string;
    diagrams: Record<string, string>;
    schemas: Record<string, string>;
    nodeModules: Record<string, string>;
  }
  export interface IFailure {
    type: "failure";
    reason: string;
  }
  export interface IException {
    type: "exception";
    error: unknown;
  }
}

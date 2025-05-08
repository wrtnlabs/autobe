export type IAutoBePrismaResult =
  | IAutoBePrismaResult.ISuccess
  | IAutoBePrismaResult.IFailure
  | IAutoBePrismaResult.IError;
export namespace IAutoBePrismaResult {
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

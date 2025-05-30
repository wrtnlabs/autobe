import { AutoBePrismaSyntax } from "./AutoBePrismaSyntax";

export type IAutoBePrismaValidation =
  | IAutoBePrismaValidation.ISuccess
  | IAutoBePrismaValidation.IFailure;
export namespace IAutoBePrismaValidation {
  export interface ISuccess {
    success: true;
    application: AutoBePrismaSyntax.IApplication;
  }
  export interface IFailure {
    success: false;
    application: AutoBePrismaSyntax.IApplication;
    errors: IError[];
  }
  export interface IError {
    path: string;
    table: string;
    column: string | null;
    message: string;
  }
}

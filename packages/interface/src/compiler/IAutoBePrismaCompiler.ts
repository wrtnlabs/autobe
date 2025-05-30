import { AutoBePrismaSyntax } from "../prisma/AutoBePrismaSyntax";
import { IAutoBePrismaValidation } from "../prisma/IAutoBePrismaValidation";
import { IAutoBePrismaCompilerProps } from "./IAutoBePrismaCompilerProps";
import { IAutoBePrismaCompilerResult } from "./IAutoBePrismaCompilerResult";

export interface IAutoBePrismaCompiler {
  compile(
    props: IAutoBePrismaCompilerProps,
  ): Promise<IAutoBePrismaCompilerResult>;

  validate(
    app: AutoBePrismaSyntax.IApplication,
  ): Promise<IAutoBePrismaValidation>;

  write(app: AutoBePrismaSyntax.IApplication): Promise<Record<string, string>>;
}

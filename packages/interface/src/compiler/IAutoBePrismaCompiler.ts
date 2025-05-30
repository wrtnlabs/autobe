import { AutoBePrisma } from "../prisma/AutoBePrisma";
import { IAutoBePrismaValidation } from "../prisma/IAutoBePrismaValidation";
import { IAutoBePrismaCompilerProps } from "./IAutoBePrismaCompilerProps";
import { IAutoBePrismaCompilerResult } from "./IAutoBePrismaCompilerResult";

export interface IAutoBePrismaCompiler {
  compile(
    props: IAutoBePrismaCompilerProps,
  ): Promise<IAutoBePrismaCompilerResult>;

  validate(app: AutoBePrisma.IApplication): Promise<IAutoBePrismaValidation>;

  write(app: AutoBePrisma.IApplication): Promise<Record<string, string>>;
}

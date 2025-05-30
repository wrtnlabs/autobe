import {
  AutoBePrismaSyntax,
  IAutoBePrismaCompiler,
  IAutoBePrismaCompilerProps,
  IAutoBePrismaCompilerResult,
  IAutoBePrismaValidation,
} from "@autobe/interface";
import { EmbedPrisma } from "embed-prisma";

import { validatePrismaApplication } from "./prisma/validatePrismaApplication";
import { writePrismaApplication } from "./prisma/writePrismaApplication";

export class AutoBePrismaCompiler implements IAutoBePrismaCompiler {
  public async compile(
    props: IAutoBePrismaCompilerProps,
  ): Promise<IAutoBePrismaCompilerResult> {
    const compiler: EmbedPrisma = new EmbedPrisma();
    return compiler.compile(props.files);
  }

  public validate(
    app: AutoBePrismaSyntax.IApplication,
  ): IAutoBePrismaValidation {
    return validatePrismaApplication(app);
  }

  public write(app: AutoBePrismaSyntax.IApplication): Record<string, string> {
    return writePrismaApplication(app);
  }
}

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

  public async validate(
    app: AutoBePrismaSyntax.IApplication,
  ): Promise<IAutoBePrismaValidation> {
    return validatePrismaApplication(app);
  }

  public async write(
    app: AutoBePrismaSyntax.IApplication,
  ): Promise<Record<string, string>> {
    return writePrismaApplication(app);
  }
}

import {
  AutoBePrisma,
  IAutoBePrismaCompileResult,
  IAutoBePrismaCompiler,
  IAutoBePrismaCompilerProps,
  IAutoBePrismaValidation,
} from "@autobe/interface";
import { EmbedPrisma } from "embed-prisma";

import { validatePrismaApplication } from "./validatePrismaApplication";
import { writePrismaApplication } from "./writePrismaApplication";

export class AutoBePrismaCompiler implements IAutoBePrismaCompiler {
  public async compile(
    props: IAutoBePrismaCompilerProps,
  ): Promise<IAutoBePrismaCompileResult> {
    const compiler: EmbedPrisma = new EmbedPrisma();
    return compiler.compile(props.files);
  }

  public async validate(
    application: AutoBePrisma.IApplication,
  ): Promise<IAutoBePrismaValidation> {
    return validatePrismaApplication(application);
  }

  public async write(
    application: AutoBePrisma.IApplication,
    dbms: "postgres" | "sqlite" = "postgres",
  ): Promise<Record<string, string>> {
    return writePrismaApplication({
      application,
      dbms,
    });
  }
}

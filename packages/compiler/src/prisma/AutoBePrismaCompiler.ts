import {
  AutoBePrisma,
  IAutoBePrismaCompileResult,
  IAutoBePrismaCompiler,
  IAutoBePrismaCompilerProps,
  IAutoBePrismaValidation,
} from "@autobe/interface";
import { writePrismaApplication } from "@autobe/utils";
import { EmbedPrisma } from "embed-prisma";

import { validatePrismaApplication } from "./validatePrismaApplication";

export class AutoBePrismaCompiler implements IAutoBePrismaCompiler {
  public async compile(
    props: IAutoBePrismaCompilerProps,
  ): Promise<IAutoBePrismaCompileResult> {
    const compiler: EmbedPrisma = new EmbedPrisma();
    const result: IAutoBePrismaCompileResult = await compiler.compile(
      props.files,
    );
    if (result.type !== "success") return result;
    return {
      ...result,
      client: Object.fromEntries(
        Object.entries(result.client).map(([key, value]) => [
          `src/prisma/${key}`,
          value,
        ]),
      ),
    };
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

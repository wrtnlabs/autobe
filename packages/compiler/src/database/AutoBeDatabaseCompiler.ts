import {
  AutoBeDatabase,
  IAutoBeDatabaseCompiler,
  IAutoBeDatabaseValidation,
  IAutoBePrismaCompileResult,
  IAutoBePrismaCompilerProps,
} from "@autobe/interface";
import { writePrismaApplication } from "@autobe/utils";
import { EmbedPrisma } from "embed-prisma";

import { validateDatabaseApplication } from "./validateDatabaseApplication";

export class AutoBeDatabaseCompiler implements IAutoBeDatabaseCompiler {
  public async compilePrismaSchemas(
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

  public async writePrismaSchemas(
    application: AutoBeDatabase.IApplication,
    dbms: "postgres" | "sqlite" = "postgres",
  ): Promise<Record<string, string>> {
    return writePrismaApplication({
      application,
      dbms,
    });
  }

  public async validate(
    application: AutoBeDatabase.IApplication,
  ): Promise<IAutoBeDatabaseValidation> {
    return validateDatabaseApplication(application);
  }
}

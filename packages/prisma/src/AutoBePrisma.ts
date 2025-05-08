import {
  IAutoBePrisma,
  IAutoBePrismaProps,
  IAutoBePrismaResult,
} from "@autobe/interface";
import { generateClient } from "@prisma/client-generator-js";
import { DMMF } from "@prisma/generator-helper";
import {
  ConfigMetaFormat,
  MultipleSchemas,
  formatSchema,
  getConfig,
  getDMMF,
  getSchemaWithPath,
  mergeSchemas,
} from "@prisma/internals";
import fs from "fs";

export class AutoBePrisma implements IAutoBePrisma {
  public async build(props: IAutoBePrismaProps): Promise<IAutoBePrismaResult> {
    // PREPARE DIDRECTORIES
    const directory: string = await fs.promises.mkdtemp("autobe-prisma-");
    const clear = async () => {
      try {
        // await fs.promises.rm(directory, { recursive: true });
      } catch {}
    };
    const out = async (result: IAutoBePrismaResult) => {
      await clear();
      return result;
    };
    await fs.promises.mkdir(`${directory}/schemas`);
    await fs.promises.mkdir(`${directory}/output`);

    try {
      // PARSE SCHEMA FILES
      const schemas: MultipleSchemas = await formatSchema({
        schemas: Object.entries(props.schemas),
      });
      const merged: string = mergeSchemas({ schemas });
      const document: DMMF.Document = await getDMMF({ datamodel: schemas });
      const config: ConfigMetaFormat = await getConfig({
        datamodel: schemas,
        ignoreEnvVarErrors: true,
      });

      // GENERATE TEMPORARY SCHEMA FILES
      await Promise.all(
        Object.entries(props.schemas).map(([key, value]) =>
          fs.promises.writeFile(`${directory}/schemas/${key}`, value, "utf-8"),
        ),
      );

      // GENERATE CLIENT
      console.log(config.generators[0]);
      await generateClient({
        // locations
        binaryPaths: {},
        schemaPath: `${directory}/schemas`,
        outputDir: `${directory}/output`,
        runtimeSourcePath: require.resolve("@prisma/client/runtime/library.js"),
        generator: {
          ...config.generators[0]!,
          output: {
            fromEnvVar: null,
            value: `${directory}/output`,
          },
        },
        // models
        datamodel: merged,
        dmmf: document,
        datasources: config.datasources,
        activeProvider: config.datasources[0]!.activeProvider,
        // configurations
        testMode: true,
        copyRuntime: false,
        clientVersion: "local",
        engineVersion: "local",
      });
      return {
        type: "success",
        files: {},
      };
    } catch (error) {
      return out(this.catch(error));
    } finally {
      await clear();
    }
  }

  private async validate(
    props: IAutoBePrismaProps,
  ): Promise<IAutoBePrismaResult> {
    try {
      return {
        type: "success",
        files: {},
      };
    } catch (error) {
      return this.catch(error);
    }
  }

  private catch(
    error: unknown,
  ): IAutoBePrismaResult.IFailure | IAutoBePrismaResult.IError {
    if (error instanceof Error && error.name === "GetDmmfError")
      return {
        type: "failure",
        reason: error.message,
      };
    return {
      type: "error",
      error:
        error instanceof Error
          ? {
              ...error,
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : error,
    };
  }
}

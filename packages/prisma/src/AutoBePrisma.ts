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
  mergeSchemas,
} from "@prisma/internals";
import fs from "fs";
import path from "path";

export class AutoBePrisma implements IAutoBePrisma {
  public async build(props: IAutoBePrismaProps): Promise<IAutoBePrismaResult> {
    // PREPARE DIRECTORIES
    const directory: string = await fs.promises.mkdtemp("autobe-prisma-");
    const clear = async () => {
      try {
        await fs.promises.rm(directory, { recursive: true });
      } catch {}
    };
    const out = async (result: IAutoBePrismaResult) => {
      await clear();
      return result;
    };
    await fs.promises.mkdir(`${directory}/schemas`);
    // await fs.promises.mkdir(`${directory}/output`);

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

      // STORE SCHEMA FILES
      await Promise.all(
        Object.entries(props.schemas).map(([key, value]) =>
          fs.promises.writeFile(`${directory}/schemas/${key}`, value, "utf-8"),
        ),
      );

      // GENERATE CLIENT
      await generateClient({
        // locations
        binaryPaths: {},
        schemaPath: `${directory}/schemas`,
        outputDir: `${directory}/output`,
        runtimeSourcePath: require
          .resolve("@prisma/client/runtime/library.js")
          .split(path.sep)
          .slice(0, -1)
          .join(path.sep),
        generator: {
          ...config.generators.find((g) => g.name === "client")!,
          isCustomOutput: true,
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
        files: await this.collect(`${directory}/output`),
      };
    } catch (error) {
      return out(this.catch(error));
    } finally {
      await clear();
    }
  }

  private catch(
    error: unknown,
  ): IAutoBePrismaResult.IFailure | IAutoBePrismaResult.IError {
    if (
      error instanceof Error &&
      (error.name === "GetDmmfError" || error.name === "MergeSchemasError")
    )
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

  private async collect(root: string): Promise<Record<string, string>> {
    const output: Record<string, string> = {};
    const iterate = async (location: string) => {
      const directory: string[] = await fs.promises.readdir(location);
      for (const file of directory) {
        const next: string = `${location}/${file}`;
        const stat: fs.Stats = await fs.promises.stat(next);
        if (stat.isDirectory()) await iterate(next);
        else if (file.endsWith(".d.ts"))
          output[next.substring(root.length + 1)] = await fs.promises.readFile(
            next,
            "utf-8",
          );
      }
    };
    await iterate(root);
    return output;
  }
}

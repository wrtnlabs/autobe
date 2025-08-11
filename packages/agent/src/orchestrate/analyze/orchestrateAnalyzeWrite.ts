import { IAgenticaController, MicroAgentica } from "@agentica/core";
import { AutoBeAnalyzeRole } from "@autobe/interface";
import { AutoBeAnalyzeFile } from "@autobe/interface/src/histories/contents/AutoBeAnalyzeFile";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import {
  AutoBeAnalyzeFileSystem,
  IAutoBeAnalyzeFileSystem,
} from "./AutoBeAnalyzeFileSystem";
import { AutoBEAnalyzeFileMap } from "./AutoBeAnalyzePointer";
import { transformAnalyzeWriteHistories } from "./transformAnalyzeWriteHistories";

export const orchestrateAnalyzeWrite = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  input: {
    /** Total file names */
    totalFiles: Pick<AutoBeAnalyzeFile, "filename" | "reason">[];
    file: AutoBeAnalyzeFile;
    roles: AutoBeAnalyzeRole[];
    review: string | null;
    language?: string;
  },
): Promise<string> => {
  const pointer: IPointer<Record<string, string> | null> = { value: null };
  const agentica: MicroAgentica<Model> = ctx.createAgent({
    source: "analyzeWrite",
    controller: createController<Model>({
      model: ctx.model,
      execute: new AutoBeAnalyzeFileSystem({
        [input.file.filename]: input.file.content,
      }),
      build: (next: AutoBEAnalyzeFileMap) => (pointer.value = next),
    }),
    histories: transformAnalyzeWriteHistories(ctx, input),
    enforceFunctionCall: true,
  });
  await agentica.conversate("Write Document.").finally(() => {
    const tokenUsage = agentica.getTokenUsage().aggregate;
    ctx.usage().record(tokenUsage, ["analyze"]);
  });

  if (pointer.value === null) {
    throw new Error("The Analyze Agent failed to create the document.");
  }

  input.file.content = pointer.value[input.file.filename];
  return input.file.content;
};

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  execute: AutoBeAnalyzeFileSystem;
  build: (v: AutoBEAnalyzeFileMap) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);
  const application: ILlmApplication<Model> = collection[
    props.model
  ] satisfies ILlmApplication<any> as unknown as ILlmApplication<Model>;
  return {
    protocol: "class",
    name: "Planning",
    application,
    execute: {
      createOrUpdateFiles: async (input) => {
        const fileMap = await props.execute.createOrUpdateFiles(input);
        props.build(fileMap);
        return fileMap;
      },
    } satisfies IAutoBeAnalyzeFileSystem,
  };
}

const claude = typia.llm.application<AutoBeAnalyzeFileSystem, "claude">();
const collection = {
  chatgpt: typia.llm.application<AutoBeAnalyzeFileSystem, "chatgpt">(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
};

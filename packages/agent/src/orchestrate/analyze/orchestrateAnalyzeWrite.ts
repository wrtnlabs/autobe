import { IAgenticaController, MicroAgentica } from "@agentica/core";
import { AutoBeAnalyzeRole } from "@autobe/interface";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { enforceToolCall } from "../../utils/enforceToolCall";
import {
  AutoBeAnalyzeFileSystem,
  IAutoBeAnalyzeFileSystem,
} from "./AutoBeAnalyzeFileSystem";
import { AutoBEAnalyzeFileMap } from "./AutoBeAnalyzePointer";
import { AutoBeAnalyzeFile } from "./structures/AutoBeAnalyzeFile";
import { transformAnalyzeWriteHistories } from "./transformAnalyzeWriteHistories";

export const orchestrateAnalyzeWrite = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  input: {
    /** Total file names */
    totalFiles: Pick<AutoBeAnalyzeFile, "filename" | "reason">[];
    file: Omit<AutoBeAnalyzeFile, "markdown">;
    roles: AutoBeAnalyzeRole[];
    review: string | null;
    setDocument: (v: AutoBEAnalyzeFileMap) => void;
    language?: string;
  },
): Promise<void> => {
  const controller = createController<Model>({
    model: ctx.model,
    execute: new AutoBeAnalyzeFileSystem({
      [input.file.filename]: "" as const,
    }),
    setDocument: input.setDocument,
  });

  const agentica = new MicroAgentica({
    controllers: [controller],
    model: ctx.model,
    vendor: ctx.vendor,
    config: {
      ...ctx.config,
      executor: {
        describe: null,
      },
    },
    histories: transformAnalyzeWriteHistories(ctx, input),
  });
  enforceToolCall(agentica);

  await agentica.conversate("Write Document.").finally(() => {
    const tokenUsage = agentica.getTokenUsage().aggregate;
    ctx.usage().record(tokenUsage, ["analyze"]);
  });
};

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  execute: AutoBeAnalyzeFileSystem;
  setDocument: (v: AutoBEAnalyzeFileMap) => void;
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
        props.setDocument(fileMap);
        return fileMap;
      },
    } satisfies IAutoBeAnalyzeFileSystem,
  };
}

const claude = typia.llm.application<
  AutoBeAnalyzeFileSystem,
  "claude",
  { reference: true }
>();
const collection = {
  chatgpt: typia.llm.application<
    AutoBeAnalyzeFileSystem,
    "chatgpt",
    { reference: true }
  >(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
};

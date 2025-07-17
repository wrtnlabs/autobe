import { IAgenticaController, MicroAgentica } from "@agentica/core";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { randomBackoffStrategy } from "../../utils/backoffRetry";
import { enforceToolCall } from "../../utils/enforceToolCall";
import {
  AutoBeAnalyzeFileSystem,
  IAutoBeAnalyzeFileSystem,
  IFile,
} from "./AutoBeAnalyzeFileSystem";
import {
  AutoBEAnalyzeFileMap,
  AutoBeAnalyzePointer,
} from "./AutoBeAnalyzePointer";
import { AutoBeAnalyzeRole } from "./AutoBeAnalyzeRole";
import { transformAnalyzeWriteHistories } from "./transformAnalyzeWriteHistories";

export const orchestrateAnalyzeWrite = <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  input: {
    /** Total file names */
    totalFiles: Pick<IFile, "filename" | "reason">[];
    targetFile: string;
    roles: AutoBeAnalyzeRole[];
    review: string | null;
  },
  pointer: AutoBeAnalyzePointer,
  isAborted: IPointer<boolean>,
): MicroAgentica<Model> => {
  const controller = createController<Model>({
    model: ctx.model,
    execute: new AutoBeAnalyzeFileSystem({ [input.targetFile]: "" as const }),
    build: async (files: AutoBEAnalyzeFileMap) => {
      pointer.value ??= { files: {} };
      Object.assign(pointer.value.files, files);
    },
    abort: () => (isAborted.value = true),
  });

  const agent = new MicroAgentica({
    controllers: [controller],
    model: ctx.model,
    vendor: ctx.vendor,
    config: {
      locale: ctx.config?.locale,
      backoffStrategy: randomBackoffStrategy,
      executor: {
        describe: null,
      },
    },
    histories: [...transformAnalyzeWriteHistories(ctx, input)],
  });
  enforceToolCall(agent);
  return agent;
};

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  execute: AutoBeAnalyzeFileSystem;
  build: (input: AutoBEAnalyzeFileMap) => void;
  abort: () => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);
  const application: ILlmApplication<Model> = collection[
    props.model
  ] as unknown as ILlmApplication<Model>;
  return {
    protocol: "class",
    name: "Planning",
    application,
    execute: {
      abort: (input) => {
        const response = props.execute.abort(input);
        props.abort();

        return response;
      },
      createOrUpdateFiles: async (input) => {
        const fileMap = await props.execute.createOrUpdateFiles(input);
        props.build(fileMap);
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

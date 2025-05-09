import { IAgenticaController } from "@agentica/core";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import typia from "typia";

import { AutoBeContext } from "../context/AutoBeContext";
import { IAutoBeApplication } from "../context/IAutoBeApplication";
import { orchestrateAnalyze } from "../orchestrate/orchestrateAnalyze";
import { orchestrateInterface } from "../orchestrate/orchestrateInterface";
import { orchestratePrisma } from "../orchestrate/orchestratePrisma";
import { orchestrateRealize } from "../orchestrate/orchestrateRealize";
import { orchestrateTest } from "../orchestrate/orchestrateTest";

export const createAutoBeController = <Model extends ILlmSchema.Model>(props: {
  model: Model;
  context: AutoBeContext<Model>;
}): IAgenticaController.IClass<Model> => ({
  protocol: "class",
  name: "autobe",
  application: (schemas[props.model as "chatgpt"] ??
    schemas.claude) as any as ILlmApplication<Model>,
  execute: {
    analyze: orchestrateAnalyze(props.context),
    prisma: orchestratePrisma(props.context),
    interface: orchestrateInterface(props.context),
    test: orchestrateTest(props.context),
    realize: orchestrateRealize(props.context),
  },
});

const schemas = {
  chatgpt: typia.llm.application<
    IAutoBeApplication,
    "chatgpt",
    { reference: true }
  >(),
  claude: typia.llm.application<IAutoBeApplication, "claude">(),
  gemini: typia.llm.application<IAutoBeApplication, "gemini">(),
};

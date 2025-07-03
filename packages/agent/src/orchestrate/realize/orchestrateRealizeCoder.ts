import { IAgenticaController, MicroAgentica } from "@agentica/core";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { enforceToolCall } from "../../utils/enforceToolCall";
import { FAILED } from "./orchestrateRealize";
import { RealizePlannerOutput } from "./orchestrateRealizePlanner";
import { IAutoBeRealizeCorderApplication } from "./structures/IAutoBeRealizeCorderApplication";
import { transformRealizeCoderHistories } from "./transformRealizeCoderHistories";

/**
 * Generates a TypeScript function implementation based on the given plan.
 *
 * This function transforms the plan (function name, input/output schema,
 * constraints, and scenarios) into a complete TypeScript function as a string.
 * It is responsible only for producing the code logic, and does not handle
 * imports, exports, or formatting.
 *
 * Import statements are handled separately and will be injected automatically.
 * Any unused imports will be removed by tooling (e.g. eslint).
 *
 * Type annotations should be omitted whenever possible to favor TypeScript's
 * type inference, unless explicit types are critical to correctness.
 *
 * @param ctx - AutoBE execution context
 * @param props - Planning result describing what function to generate
 * @returns The generated function name and TypeScript code
 */
export const orchestrateRealizeCoder = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: RealizePlannerOutput,
): Promise<IAutoBeRealizeCorderApplication.RealizeCoderOutput | FAILED> => {
  ctx;

  const pointer: IPointer<Pick<
    IAutoBeRealizeCorderApplication.RealizeCoderOutput,
    "implementationCode"
  > | null> = {
    value: null,
  };

  const controller = createApplication({
    model: ctx.model,
    build: (props) => {
      pointer.value = props.result;
    },
  });

  const agent = new MicroAgentica({
    controllers: [controller],
    model: ctx.model,
    vendor: ctx.vendor,
    config: {
      ...ctx.config,
      executor: {
        describe: null,
      },
    },
    histories: transformRealizeCoderHistories(ctx.state(), props),
  });
  enforceToolCall(agent);

  await agent.conversate("Write code.");

  if (pointer.value === null) {
    return FAILED;
  }

  return { ...pointer.value, functionName: props.functionName };
};

function createApplication<Model extends ILlmSchema.Model>(props: {
  model: Model;
  build: (next: IAutoBeRealizeCorderApplication.IProps) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const application: ILlmApplication<Model> = collection[
    props.model
  ] as unknown as ILlmApplication<Model>;

  return {
    protocol: "class",
    name: "Write code",
    application,
    execute: {
      programing: (next) => {
        props.build(next);
      },
    } satisfies IAutoBeRealizeCorderApplication,
  };
}

const claude = typia.llm.application<
  IAutoBeRealizeCorderApplication,
  "claude",
  {
    reference: true;
  }
>();
const collection = {
  chatgpt: typia.llm.application<
    IAutoBeRealizeCorderApplication,
    "chatgpt",
    { reference: true }
  >(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
};

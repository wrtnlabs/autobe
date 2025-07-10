import { IAgenticaController, MicroAgentica } from "@agentica/core";
import { AutoBeOpenApi } from "@autobe/interface";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { enforceToolCall } from "../../utils/enforceToolCall";
import { getTestScenarioArtifacts } from "../test/compile/getTestScenarioArtifacts";
import { IAutoBeTestScenarioArtifacts } from "../test/structures/IAutoBeTestScenarioArtifacts";
import { FAILED } from "./orchestrateRealize";
import { RealizePlannerOutput } from "./orchestrateRealizePlanner";
import { IAutoBeRealizeCoderApplication } from "./structures/IAutoBeRealizeCoderApplication";
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
  operation: AutoBeOpenApi.IOperation,
  props: RealizePlannerOutput,
): Promise<IAutoBeRealizeCoderApplication.RealizeCoderOutput | FAILED> => {
  const artifacts: IAutoBeTestScenarioArtifacts =
    await getTestScenarioArtifacts(ctx, {
      endpoint: {
        method: operation.method,
        path: operation.path,
      },
      dependencies: [],
    });

  const pointer: IPointer<Pick<
    IAutoBeRealizeCoderApplication.RealizeCoderOutput,
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
    histories: transformRealizeCoderHistories(ctx.state(), props, artifacts),
  });
  enforceToolCall(agent);

  await agent.conversate("Write code.");
  const tokenUsage = agent.getTokenUsage();
  ctx.usage().record(tokenUsage, ["realize"]);

  if (pointer.value === null) {
    return FAILED;
  }

  pointer.value.implementationCode = await ctx.compiler.typescript.beautify(
    pointer.value.implementationCode,
  );
  pointer.value.implementationCode = pointer.value.implementationCode
    .replaceAll('import { MyGlobal } from "../MyGlobal";', "")
    .replaceAll('import typia, { tags } from "typia";', "")
    .replaceAll('import { Prisma } from "@prisma/client";', "")
    .replaceAll('import { jwtDecode } from "./jwtDecode"', "");
  pointer.value.implementationCode = [
    'import { MyGlobal } from "../MyGlobal";',
    'import typia, { tags } from "typia";',
    'import { Prisma } from "@prisma/client";',
    'import { jwtDecode } from "./jwtDecode"',
    "",
    pointer.value.implementationCode,
  ].join("\n");

  return { ...pointer.value, functionName: props.functionName };
};

function createApplication<Model extends ILlmSchema.Model>(props: {
  model: Model;
  build: (next: IAutoBeRealizeCoderApplication.IProps) => void;
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
    } satisfies IAutoBeRealizeCoderApplication,
  };
}

const claude = typia.llm.application<
  IAutoBeRealizeCoderApplication,
  "claude",
  {
    reference: true;
  }
>();
const collection = {
  chatgpt: typia.llm.application<
    IAutoBeRealizeCoderApplication,
    "chatgpt",
    { reference: true }
  >(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
};

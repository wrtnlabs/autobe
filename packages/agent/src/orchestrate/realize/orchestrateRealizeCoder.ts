import { IAgenticaController, MicroAgentica } from "@agentica/core";
import {
  AutoBeOpenApi,
  AutoBeRealizeAuthorization,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { randomBackoffRetry } from "../../utils/backoffRetry";
import { enforceToolCall } from "../../utils/enforceToolCall";
import { getTestScenarioArtifacts } from "../test/compile/getTestScenarioArtifacts";
import { IAutoBeTestScenarioArtifacts } from "../test/structures/IAutoBeTestScenarioArtifacts";
import { RealizePlannerOutput } from "./orchestrateRealizePlanner";
import { IAutoBeRealizeCoderApplication } from "./structures/IAutoBeRealizeCoderApplication";
import { IAutoBeRealizeCompile } from "./structures/IAutoBeRealizeCompile";
import { FAILED } from "./structures/IAutoBeRealizeFailedSymbol";
import { transformRealizeCoderHistories } from "./transformRealizeCoderHistories";
import { RealizeFileSystem } from "./utils/ProviderFileSystem";
import { replaceImportStatements } from "./utils/replaceImportStatements";

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
  previousCodes: IAutoBeRealizeCompile.Success[],
  props: RealizePlannerOutput,
  previous: string | null,
  total: IAutoBeTypeScriptCompileResult.IDiagnostic[],
  diagnostics: IAutoBeTypeScriptCompileResult.IDiagnostic[],
  authorization?: AutoBeRealizeAuthorization,
): Promise<IAutoBeRealizeCoderApplication.RealizeCoderOutput | FAILED> => {
  total;

  const artifacts: IAutoBeTestScenarioArtifacts =
    await getTestScenarioArtifacts(ctx, {
      endpoint: {
        method: operation.method,
        path: operation.path,
      },
      dependencies: [],
    });

  const pointer: IPointer<Omit<
    IAutoBeRealizeCoderApplication.RealizeCoderOutput,
    "filename"
  > | null> = {
    value: null,
  };

  const controller = createApplication({
    model: ctx.model,
    build: (props) => {
      pointer.value = props.output;
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
    histories: transformRealizeCoderHistories(
      ctx.state(),
      previousCodes,
      props,
      artifacts,
      previous,
      diagnostics,
      authorization,
    ),
  });
  enforceToolCall(agent);

  await randomBackoffRetry(() =>
    agent.conversate(
      [
        `Write complete, production-ready TypeScript code that strictly follows these rules:`,
        "",
        `1. Do **not** use the native \`Date\` type anywhere.`,
        `2. All date or datetime values must be written as \`string & tags.Format<'date-time'>\`.`,
        `3. UUIDs must be generated using \`v4()\` and typed as \`string & tags.Format<'uuid'>\`.`,
        `4. Do not use \`as\` for type assertions — resolve types properly.`,
        `5. All functions must be fully typed with clear parameter and return types.`,
        `6. Do not skip validations or default values where necessary.`,
        `7. Follow functional, immutable, and consistent code structure.`,
        "",
        `Use \`@nestia/e2e\` test structure if relevant.`,
      ].join("\n"),
    ),
  ).finally(() => {
    const tokenUsage = agent.getTokenUsage().aggregate;
    ctx.usage().record(tokenUsage, ["realize"]);
  });

  if (pointer.value === null) {
    return FAILED;
  }

  pointer.value.implementationCode = await replaceImportStatements(ctx)(
    artifacts,
    pointer.value.implementationCode,
    props.decoratorEvent?.payload.name,
  );

  pointer.value.implementationCode =
    pointer.value.implementationCode.replaceAll(
      "typia.tags.assert",
      "typia.assert",
    );

  return {
    ...pointer.value,
    filename: RealizeFileSystem.providerPath(props.functionName),
  };
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
      programming: (next) => {
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

import {
  AutoBeProgressEventBase,
  AutoBeRealizeAuthorization,
  AutoBeRealizeWriteEvent,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { ILlmApplication, ILlmController, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { getTestScenarioArtifacts } from "../test/compile/getTestScenarioArtifacts";
import { IAutoBeTestScenarioArtifacts } from "../test/structures/IAutoBeTestScenarioArtifacts";
import { transformRealizeWriteHistories } from "./histories/transformRealizeWriteHistories";
import { IAutoBeRealizeScenarioApplication } from "./structures/IAutoBeRealizeScenarioApplication";
import { IAutoBeRealizeWriteApplication } from "./structures/IAutoBeRealizeWriteApplication";
import { replaceImportStatements } from "./utils/replaceImportStatements";

export async function orchestrateRealizeWrite<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    totalAuthorizations: AutoBeRealizeAuthorization[];
    authorization: AutoBeRealizeAuthorization | null;
    scenario: IAutoBeRealizeScenarioApplication.IProps;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
  },
): Promise<AutoBeRealizeWriteEvent> {
  const artifacts: IAutoBeTestScenarioArtifacts =
    await getTestScenarioArtifacts(ctx, {
      endpoint: props.scenario.operation,
      dependencies: [],
    });
  const pointer: IPointer<IAutoBeRealizeWriteApplication.IProps | null> = {
    value: null,
  };
  const { tokenUsage } = await ctx.conversate({
    source: "realizeWrite",
    histories: transformRealizeWriteHistories({
      state: ctx.state(),
      scenario: props.scenario,
      artifacts,
      authorization: props.authorization,
      totalAuthorizations: props.totalAuthorizations,
    }),
    controller: createController({
      model: ctx.model,
      build: (next) => {
        pointer.value = next;
      },
    }),
    enforceFunctionCall: true,
    promptCacheKey: props.promptCacheKey,
    message: StringUtil.trim`
      Write complete, production-ready TypeScript code that strictly follows these rules:

      DO NOT:
      - Use the native \`Date\` type anywhere
      - Use \`as\` for type assertions

      DO:
      - Write all date/datetime values as \`string & tags.Format<'date-time'>\`
      - Generate UUIDs using \`v4()\` and type as \`string & tags.Format<'uuid'>\`
      - Resolve types properly without assertions
      - Type all functions with clear parameter and return types
      6. Do not skip validations or default values where necessary.
      7. Follow functional, immutable, and consistent code structure.

      Use \`@nestia/e2e\` test structure if relevant.
    `,
  });
  if (pointer.value === null) throw new Error("Failed to write code.");

  pointer.value.implementationCode = await replaceImportStatements(ctx)(
    artifacts,
    pointer.value.implementationCode,
    props.authorization?.payload.name,
  );

  const event: AutoBeRealizeWriteEvent = {
    type: "realizeWrite",
    id: v7(),
    location: props.scenario.location,
    content: pointer.value.implementationCode,
    tokenUsage,
    completed: ++props.progress.completed,
    total: props.progress.total,
    step: ctx.state().analyze?.step ?? 0,
    created_at: new Date().toISOString(),
  };
  ctx.dispatch(event);
  return event;
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  build: (next: IAutoBeRealizeWriteApplication.IProps) => void;
}): ILlmController<Model> {
  assertSchemaModel(props.model);

  const application: ILlmApplication<Model> = collection[
    props.model
  ] satisfies ILlmApplication<any> as unknown as ILlmApplication<Model>;

  return {
    protocol: "class",
    name: "Write code",
    application,
    execute: {
      coding: (next) => {
        props.build(next);
      },
    } satisfies IAutoBeRealizeWriteApplication,
  };
}

const claude = typia.llm.application<
  IAutoBeRealizeWriteApplication,
  "claude"
>();
const collection = {
  chatgpt: typia.llm.application<IAutoBeRealizeWriteApplication, "chatgpt">(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
};

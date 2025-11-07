import {
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeRealizeAuthorization,
  AutoBeRealizeWriteEvent,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import {
  ILlmApplication,
  ILlmController,
  ILlmSchema,
  IValidation,
} from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { validateEmptyCode } from "../../utils/validateEmptyCode";
import { transformRealizeWriteHistories } from "./histories/transformRealizeWriteHistories";
import { IAutoBeRealizeScenarioResult } from "./structures/IAutoBeRealizeScenarioResult";
import { IAutoBeRealizeWriteApplication } from "./structures/IAutoBeRealizeWriteApplication";
import { getRealizeWriteDto } from "./utils/getRealizeWriteDto";
import { replaceImportStatements } from "./utils/replaceImportStatements";

export async function orchestrateRealizeWrite<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    document: AutoBeOpenApi.IDocument;
    totalAuthorizations: AutoBeRealizeAuthorization[];
    authorization: AutoBeRealizeAuthorization | null;
    scenario: IAutoBeRealizeScenarioResult;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
  },
): Promise<AutoBeRealizeWriteEvent> {
  const pointer: IPointer<IAutoBeRealizeWriteApplication.IProps | null> = {
    value: null,
  };

  const dto = await getRealizeWriteDto(ctx, props.scenario.operation);
  const { metric, tokenUsage } = await ctx.conversate({
    source: "realizeWrite",
    histories: transformRealizeWriteHistories({
      state: ctx.state(),
      scenario: props.scenario,
      authorization: props.authorization,
      totalAuthorizations: props.totalAuthorizations,
      dto,
    }),
    controller: createController({
      model: ctx.model,
      functionName: props.scenario.functionName,
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

  pointer.value.draft = await replaceImportStatements(ctx, {
    operation: props.scenario.operation,
    schemas: props.document.components.schemas,
    code: pointer.value.draft,
    decoratorType: props.authorization?.payload.name,
  });
  if (pointer.value.revise.final)
    pointer.value.revise.final = await replaceImportStatements(ctx, {
      operation: props.scenario.operation,
      schemas: props.document.components.schemas,
      code: pointer.value.revise.final,
      decoratorType: props.authorization?.payload.name,
    });

  const event: AutoBeRealizeWriteEvent = {
    type: "realizeWrite",
    id: v7(),
    location: props.scenario.location,
    content: pointer.value.revise.final ?? pointer.value.draft,
    metric,
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
  functionName: string;
  build: (next: IAutoBeRealizeWriteApplication.IProps) => void;
}): ILlmController<Model> {
  assertSchemaModel(props.model);

  const validate: Validator = (input) => {
    const result: IValidation<IAutoBeRealizeWriteApplication.IProps> =
      typia.validate<IAutoBeRealizeWriteApplication.IProps>(input);
    if (result.success === false) return result;
    const errors: IValidation.IError[] = validateEmptyCode({
      functionName: props.functionName,
      draft: result.data.draft,
      revise: result.data.revise,
    });
    return errors.length
      ? {
          success: false,
          errors,
          data: result.data,
        }
      : result;
  };
  const application: ILlmApplication<Model> = collection[
    props.model === "chatgpt"
      ? "chatgpt"
      : props.model === "gemini"
        ? "gemini"
        : "claude"
  ](
    validate,
  ) satisfies ILlmApplication<any> as unknown as ILlmApplication<Model>;

  return {
    protocol: "class",
    name: "Write code",
    application,
    execute: {
      write: (next) => {
        props.build(next);
      },
    } satisfies IAutoBeRealizeWriteApplication,
  };
}

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<IAutoBeRealizeWriteApplication, "chatgpt">({
      validate: {
        write: validate,
      },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<IAutoBeRealizeWriteApplication, "claude">({
      validate: {
        write: validate,
      },
    }),
  gemini: (validate: Validator) =>
    typia.llm.application<IAutoBeRealizeWriteApplication, "gemini">({
      validate: {
        write: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeRealizeWriteApplication.IProps>;

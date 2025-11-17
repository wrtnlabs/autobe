import {
  AutoBeEventSource,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeRealizeAuthorization,
  AutoBeRealizeWriteEvent,
} from "@autobe/interface";
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
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
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
  const preliminary: AutoBePreliminaryController<"prismaSchemas"> =
    new AutoBePreliminaryController({
      source: SOURCE,
      application: typia.json.application<IAutoBeRealizeWriteApplication>(),
      kinds: ["prismaSchemas"],
      state: ctx.state(),
    });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeRealizeWriteApplication.IComplete | null> = {
      value: null,
    };
    const dto: Record<string, string> = await getRealizeWriteDto(
      ctx,
      props.scenario.operation,
    );
    const result: AutoBeContext.IResult<Model> = await ctx.conversate({
      source: "realizeWrite",
      controller: createController({
        model: ctx.model,
        functionName: props.scenario.functionName,
        build: (next) => {
          pointer.value = next;
        },
        preliminary,
      }),
      enforceFunctionCall: true,
      promptCacheKey: props.promptCacheKey,
      ...transformRealizeWriteHistories({
        state: ctx.state(),
        scenario: props.scenario,
        authorization: props.authorization,
        totalAuthorizations: props.totalAuthorizations,
        dto,
        preliminary,
      }),
    });
    if (pointer.value !== null) {
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
        metric: result.metric,
        tokenUsage: result.tokenUsage,
        completed: ++props.progress.completed,
        total: props.progress.total,
        step: ctx.state().analyze?.step ?? 0,
        created_at: new Date().toISOString(),
      };
      ctx.dispatch(event);
      return out(result)(event);
    }
    return out(result)(null);
  });
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  functionName: string;
  build: (next: IAutoBeRealizeWriteApplication.IComplete) => void;
  preliminary: AutoBePreliminaryController<"prismaSchemas">;
}): ILlmController<Model> {
  assertSchemaModel(props.model);

  const validate: Validator = (input) => {
    const result: IValidation<IAutoBeRealizeWriteApplication.IProps> =
      typia.validate<IAutoBeRealizeWriteApplication.IProps>(input);
    if (result.success === false) return result;
    else if (result.data.request.type !== "complete") {
      return result;
    }
    const errors: IValidation.IError[] = validateEmptyCode({
      functionName: props.functionName,
      draft: result.data.request.draft,
      revise: result.data.request.revise,
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
    name: SOURCE,
    application,
    execute: {
      process: (next) => {
        if (next.request.type === "complete") props.build(next.request);
      },
    } satisfies IAutoBeRealizeWriteApplication,
  };
}

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<IAutoBeRealizeWriteApplication, "chatgpt">({
      validate: {
        process: validate,
      },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<IAutoBeRealizeWriteApplication, "claude">({
      validate: {
        process: validate,
      },
    }),
  gemini: (validate: Validator) =>
    typia.llm.application<IAutoBeRealizeWriteApplication, "gemini">({
      validate: {
        process: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeRealizeWriteApplication.IProps>;

const SOURCE = "realizeWrite" satisfies AutoBeEventSource;

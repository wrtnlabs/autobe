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
import { transformRealizeWriteHistory } from "./histories/transformRealizeWriteHistory";
import { IAutoBeRealizeOperationWriteApplication } from "./structures/IAutoBeRealizeOperationWriteApplication";
import { IAutoBeRealizeScenarioResult } from "./structures/IAutoBeRealizeScenarioResult";
import { getRealizeWriteDto } from "./utils/getRealizeWriteDto";
import { replaceImportStatements } from "./utils/replaceImportStatements";

export async function orchestrateRealizeOperationWrite<
  Model extends ILlmSchema.Model,
>(
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
  const preliminary: AutoBePreliminaryController<
    "prismaSchemas" | "realizeCollectors" | "realizeTransformers"
  > = new AutoBePreliminaryController({
    source: SOURCE,
    application:
      typia.json.application<IAutoBeRealizeOperationWriteApplication>(),
    kinds: ["prismaSchemas", "realizeCollectors", "realizeTransformers"],
    state: ctx.state(),
  });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeRealizeOperationWriteApplication.IComplete | null> =
      {
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
      ...transformRealizeWriteHistory({
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
        id: v7(),
        type: "realizeWrite",
        function: {
          kind: "operation",
          endpoint: {
            method: props.scenario.operation.method,
            path: props.scenario.operation.path,
          },
          location: props.scenario.location,
          name: props.scenario.functionName,
          content: pointer.value.revise.final ?? pointer.value.draft,
        },
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
  build: (next: IAutoBeRealizeOperationWriteApplication.IComplete) => void;
  preliminary: AutoBePreliminaryController<
    "prismaSchemas" | "realizeCollectors" | "realizeTransformers"
  >;
}): ILlmController<Model> {
  assertSchemaModel(props.model);

  const validate: Validator = (input) => {
    const result: IValidation<IAutoBeRealizeOperationWriteApplication.IProps> =
      typia.validate<IAutoBeRealizeOperationWriteApplication.IProps>(input);
    if (result.success === false) return result;
    else if (result.data.request.type !== "complete")
      return props.preliminary.validate({
        thinking: result.data.thinking,
        request: result.data.request,
      });

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
    } satisfies IAutoBeRealizeOperationWriteApplication,
  };
}

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<IAutoBeRealizeOperationWriteApplication, "chatgpt">({
      validate: {
        process: validate,
      },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<IAutoBeRealizeOperationWriteApplication, "claude">({
      validate: {
        process: validate,
      },
    }),
  gemini: (validate: Validator) =>
    typia.llm.application<IAutoBeRealizeOperationWriteApplication, "gemini">({
      validate: {
        process: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeRealizeOperationWriteApplication.IProps>;

const SOURCE = "realizeWrite" satisfies AutoBeEventSource;

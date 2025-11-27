import {
  AutoBeEventSource,
  AutoBeInterfaceHistory,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeRealizeTransformerPlan,
} from "@autobe/interface";
import {
  ILlmApplication,
  ILlmController,
  ILlmSchema,
  IValidation,
} from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";

import { AutoBeConfigConstant } from "../../constants/AutoBeConfigConstant";
import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { divideArray } from "../../utils/divideArray";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformRealizeTransformerPlanHistories } from "./histories/transformRealizeTransformerPlanHistories";
import { AutoBeRealizeTransformerProgrammer } from "./programmers/AutoBeRealizeTransformerProgrammer";
import { IAutoBeRealizeTransformerPlanApplication } from "./structures/IAutoBeRealizeTransformerPlanApplication";

export async function orchestrateRealizeTransformerPlan<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  props: {
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeRealizeTransformerPlan[]> {
  const history: AutoBeInterfaceHistory | null = ctx.state().interface;
  if (history === null)
    throw new Error("Cannot realize transformer write without interface.");

  const document: AutoBeOpenApi.IDocument = history.document;
  const dtoTypeNames: string[] = Object.keys(
    document.components.schemas,
  ).filter(AutoBeRealizeTransformerProgrammer.filter);
  props.progress.total += dtoTypeNames.length;

  const matrix: string[][] = divideArray({
    array: Array.from(dtoTypeNames),
    capacity: AutoBeConfigConstant.INTERFACE_CAPACITY * 4,
  });
  const result: AutoBeRealizeTransformerPlan[][] = await executeCachedBatch(
    ctx,
    matrix.map(
      (it) => (promptCacheKey) =>
        process(ctx, {
          document,
          dtoTypeNames: it,
          promptCacheKey,
          progress: props.progress,
        }),
    ),
  );
  return result.flat();
}

async function process<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    document: AutoBeOpenApi.IDocument;
    dtoTypeNames: string[];
    promptCacheKey: string;
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeRealizeTransformerPlan[]> {
  const preliminary: AutoBePreliminaryController<
    "prismaSchemas" | "interfaceSchemas"
  > = new AutoBePreliminaryController({
    state: ctx.state(),
    source: SOURCE,
    application:
      typia.json.application<IAutoBeRealizeTransformerPlanApplication>(),
    kinds: ["prismaSchemas", "interfaceSchemas"],
    local: {
      interfaceSchemas: Object.fromEntries(
        Object.entries(props.document.components.schemas).filter(([key]) =>
          props.dtoTypeNames.includes(key),
        ),
      ),
    },
  });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeRealizeTransformerPlanApplication.IComplete | null> =
      {
        value: null,
      };
    const result: AutoBeContext.IResult<Model> = await ctx.conversate({
      source: "realizePlan",
      controller: createController({
        model: ctx.model,
        schemas: props.document.components.schemas,
        build: (next) => {
          pointer.value = next;
        },
        preliminary,
      }),
      enforceFunctionCall: true,
      promptCacheKey: "transformer-plan",
      ...transformRealizeTransformerPlanHistories({
        state: ctx.state(),
        preliminary,
      }),
    });

    if (pointer.value !== null) {
      const plans: AutoBeRealizeTransformerPlan[] = pointer.value.plans
        .filter((p) => p.prismaSchemaName !== null)
        .map((p) => ({
          kind: "transformer" as const,
          dtoTypeName: p.dtoTypeName,
          thinking: p.thinking,
          prismaSchemaName: p.prismaSchemaName!,
        }));
      return out(result)(plans);
    }
    return out(result)(null);
  });
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
  build: (next: IAutoBeRealizeTransformerPlanApplication.IComplete) => void;
  preliminary: AutoBePreliminaryController<
    "prismaSchemas" | "interfaceSchemas"
  >;
}): ILlmController<Model> {
  assertSchemaModel(props.model);

  const validate: Validator = (input) => {
    const result: IValidation<IAutoBeRealizeTransformerPlanApplication.IProps> =
      typia.validate<IAutoBeRealizeTransformerPlanApplication.IProps>(input);
    if (result.success === false) return result;
    else if (result.data.request.type !== "complete") return result;

    // Additional validation can be added here if needed
    return result;
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
    } satisfies IAutoBeRealizeTransformerPlanApplication,
  };
}

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<IAutoBeRealizeTransformerPlanApplication, "chatgpt">({
      validate: {
        process: validate,
      },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<IAutoBeRealizeTransformerPlanApplication, "claude">({
      validate: {
        process: validate,
      },
    }),
  gemini: (validate: Validator) =>
    typia.llm.application<IAutoBeRealizeTransformerPlanApplication, "gemini">({
      validate: {
        process: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeRealizeTransformerPlanApplication.IProps>;

const SOURCE = "realizePlan" satisfies AutoBeEventSource;

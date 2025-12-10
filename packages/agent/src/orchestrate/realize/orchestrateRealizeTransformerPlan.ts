import {
  AutoBeEventSource,
  AutoBeInterfaceHistory,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeRealizePlanEvent,
  AutoBeRealizeTransformerPlan,
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
import { v4 } from "uuid";

import { AutoBeConfigConstant } from "../../constants/AutoBeConfigConstant";
import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { divideArray } from "../../utils/divideArray";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformRealizeTransformerPlanHistory } from "./histories/transformRealizeTransformerPlanHistory";
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
  ).filter((key) =>
    AutoBeRealizeTransformerProgrammer.filter({
      schemas: document.components.schemas,
      key,
    }),
  );
  const prismaSchemaNames: Set<string> = new Set(
    ctx
      .state()
      .prisma!.result.data.files.map((f) => f.models)
      .flat()
      .map((m) => m.name),
  );

  const matrix: string[][] = divideArray({
    array: Array.from(dtoTypeNames),
    capacity: AutoBeConfigConstant.INTERFACE_CAPACITY * 2,
  });
  const result: AutoBeRealizeTransformerPlan[][] = await executeCachedBatch(
    ctx,
    matrix.map(
      (it) => (promptCacheKey) =>
        process(ctx, {
          document,
          dtoTypeNames: it,
          prismaSchemaNames,
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
    prismaSchemaNames: Set<string>;
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
        prismaSchemaNames: props.prismaSchemaNames,
        dtoTypeNames: props.dtoTypeNames,
        build: (next) => {
          pointer.value = next;
        },
        preliminary,
      }),
      enforceFunctionCall: true,
      promptCacheKey: props.promptCacheKey,
      ...transformRealizeTransformerPlanHistory({
        state: ctx.state(),
        preliminary,
      }),
    });
    if (pointer.value === null) return out(result)(null);

    const plans: AutoBeRealizeTransformerPlan[] = pointer.value.plans
      .filter((p) => p.prismaSchemaName !== null)
      .map((p) => ({
        type: "transformer",
        dtoTypeName: p.dtoTypeName,
        thinking: p.thinking,
        prismaSchemaName: p.prismaSchemaName!,
      }));
    const event: AutoBeRealizePlanEvent = {
      type: "realizePlan",
      id: v4(),
      plans,
      metric: result.metric,
      tokenUsage: result.tokenUsage,
      completed: (props.progress.completed += props.dtoTypeNames.length),
      total: props.progress.total,
      step: ctx.state().analyze?.step ?? 0,
      created_at: new Date().toISOString(),
    };
    ctx.dispatch(event);
    return out(result)(plans);
  });
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  prismaSchemaNames: Set<string>;
  dtoTypeNames: string[];
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
    else if (result.data.request.type !== "complete")
      return props.preliminary.validate({
        thinking: result.data.thinking,
        request: result.data.request,
      });

    const errors: IValidation.IError[] = [];
    result.data.request.plans.map((plan, i) => {
      if (props.dtoTypeNames.includes(plan.dtoTypeName) === false)
        errors.push({
          path: `$input.request.plans[${i}].dtoTypeName`,
          value: plan.dtoTypeName,
          expected: props.dtoTypeNames
            .map((s) => JSON.stringify(s))
            .join(" | "),
          description: StringUtil.trim`
            The DTO type name must be one of the available DTOs in the interface schema.

            ${props.dtoTypeNames.map((s) => `- ${s}`).join("\n")}
          `,
        });
      if (
        plan.prismaSchemaName !== null &&
        props.prismaSchemaNames.has(plan.prismaSchemaName) === false
      )
        errors.push({
          path: `$input.request.plans[${i}].prismaSchemaName`,
          value: plan.prismaSchemaName,
          expected: Array.from(props.prismaSchemaNames)
            .map((s) => JSON.stringify(s))
            .join(" | "),
          description: StringUtil.trim`
            The Prisma schema name must be one of the available Prisma schemas.

            ${Array.from(props.prismaSchemaNames)
              .map((s) => `- ${s}`)
              .join("\n")}
          `,
        });
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

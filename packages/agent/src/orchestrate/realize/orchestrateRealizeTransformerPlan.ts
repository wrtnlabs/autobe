import {
  AutoBeEventSource,
  AutoBeInterfaceHistory,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeRealizePlanEvent,
  AutoBeRealizeTransformerPlan,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { ILlmApplication, ILlmController, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v4 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformRealizeTransformerPlanHistory } from "./histories/transformRealizeTransformerPlanHistory";
import { AutoBeRealizeTransformerProgrammer } from "./programmers/AutoBeRealizeTransformerProgrammer";
import { IAutoBeRealizeTransformerPlanApplication } from "./structures/IAutoBeRealizeTransformerPlanApplication";

export async function orchestrateRealizeTransformerPlan(
  ctx: AutoBeContext,
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
      .database!.result.data.files.map((f) => f.models)
      .flat()
      .map((m) => m.name),
  );

  const result: AutoBeRealizeTransformerPlan[][] = await executeCachedBatch(
    ctx,
    Array.from(dtoTypeNames).map(
      (it) => (promptCacheKey) =>
        process(ctx, {
          document,
          dtoTypeName: it,
          prismaSchemaNames,
          promptCacheKey,
          progress: props.progress,
        }),
    ),
  );
  return result.flat();
}

async function process(
  ctx: AutoBeContext,
  props: {
    document: AutoBeOpenApi.IDocument;
    dtoTypeName: string;
    prismaSchemaNames: Set<string>;
    promptCacheKey: string;
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeRealizeTransformerPlan[]> {
  const preliminary: AutoBePreliminaryController<
    "databaseSchemas" | "interfaceSchemas"
  > = new AutoBePreliminaryController({
    state: ctx.state(),
    source: SOURCE,
    application:
      typia.json.application<IAutoBeRealizeTransformerPlanApplication>(),
    kinds: ["databaseSchemas", "interfaceSchemas"],
    local: {
      interfaceSchemas: Object.fromEntries(
        Object.entries(props.document.components.schemas).filter(
          ([key]) => key === props.dtoTypeName,
        ),
      ),
    },
  });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeRealizeTransformerPlanApplication.IComplete | null> =
      {
        value: null,
      };
    const result: AutoBeContext.IResult = await ctx.conversate({
      source: "realizePlan",
      controller: createController({
        prismaSchemaNames: props.prismaSchemaNames,
        dtoTypeName: props.dtoTypeName,
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
        dtoTypeName: props.dtoTypeName,
      }),
    });
    if (pointer.value === null) return out(result)(null);

    const plans: AutoBeRealizeTransformerPlan[] = pointer.value.plans
      .filter((p) => p.databaseSchemaName !== null)
      .map((p) => ({
        type: "transformer",
        dtoTypeName: p.dtoTypeName,
        thinking: p.thinking,
        databaseSchemaName: p.databaseSchemaName!,
      }));
    const event: AutoBeRealizePlanEvent = {
      type: "realizePlan",
      id: v4(),
      plans,
      metric: result.metric,
      tokenUsage: result.tokenUsage,
      completed: ++props.progress.completed,
      total: props.progress.total,
      step: ctx.state().analyze?.step ?? 0,
      created_at: new Date().toISOString(),
    };
    ctx.dispatch(event);
    return out(result)(plans);
  });
}

function createController(props: {
  prismaSchemaNames: Set<string>;
  dtoTypeName: string;
  build: (next: IAutoBeRealizeTransformerPlanApplication.IComplete) => void;
  preliminary: AutoBePreliminaryController<
    "databaseSchemas" | "interfaceSchemas"
  >;
}): ILlmController {
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
      if (plan.dtoTypeName !== props.dtoTypeName)
        errors.push({
          path: `$input.request.plans[${i}].dtoTypeName`,
          value: plan.dtoTypeName,
          expected: JSON.stringify(props.dtoTypeName),
          description: StringUtil.trim`
            The DTO type name must be ${JSON.stringify(props.dtoTypeName)}.

            If you have planned other DTO type's transformer, 
            please entirely remake the plan with ONLY the DTO type 
            ${JSON.stringify(props.dtoTypeName)}.
          `,
        });
      if (
        plan.databaseSchemaName !== null &&
        props.prismaSchemaNames.has(plan.databaseSchemaName) === false
      )
        errors.push({
          path: `$input.request.plans[${i}].databaseSchemaName`,
          value: plan.databaseSchemaName,
          expected: Array.from(props.prismaSchemaNames)
            .map((s) => JSON.stringify(s))
            .join(" | "),
          description: StringUtil.trim`
            The database schema name must be one of the available database schemas.

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

  const application: ILlmApplication =
    typia.llm.application<IAutoBeRealizeTransformerPlanApplication>({
      validate: {
        process: validate,
      },
    });
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

type Validator = (
  input: unknown,
) => IValidation<IAutoBeRealizeTransformerPlanApplication.IProps>;

const SOURCE = "realizePlan" satisfies AutoBeEventSource;

import {
  AutoBeEventSource,
  AutoBeInterfaceHistory,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeRealizeCollectorPlan,
  AutoBeRealizePlanEvent,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { ILlmApplication, ILlmController, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v4 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformRealizeCollectorPlanHistory } from "./histories/transformRealizeCollectorPlanHistory";
import { AutoBeRealizeCollectorProgrammer } from "./programmers/AutoBeRealizeCollectorProgrammer";
import { IAutoBeRealizeCollectorPlanApplication } from "./structures/IAutoBeRealizeCollectorPlanApplication";

export async function orchestrateRealizeCollectorPlan(
  ctx: AutoBeContext,
  props: {
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeRealizeCollectorPlan[]> {
  const history: AutoBeInterfaceHistory | null = ctx.state().interface;
  if (history === null)
    throw new Error("Cannot realize collector plan without interface.");

  const document: AutoBeOpenApi.IDocument = history.document;
  const dtoTypeNames: string[] = Object.keys(
    document.components.schemas,
  ).filter(AutoBeRealizeCollectorProgrammer.filter);
  const prismaSchemaNames: Set<string> = new Set(
    ctx
      .state()
      .database!.result.data.files.map((f) => f.models)
      .flat()
      .map((m) => m.name),
  );

  const result: AutoBeRealizeCollectorPlan[][] = await executeCachedBatch(
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
): Promise<AutoBeRealizeCollectorPlan[]> {
  const preliminary: AutoBePreliminaryController<
    "databaseSchemas" | "interfaceSchemas" | "interfaceOperations"
  > = new AutoBePreliminaryController({
    state: ctx.state(),
    source: SOURCE,
    application:
      typia.json.application<IAutoBeRealizeCollectorPlanApplication>(),
    kinds: ["databaseSchemas", "interfaceSchemas", "interfaceOperations"],
    local: {
      interfaceOperations: props.document.operations.filter(
        (op) => op.requestBody?.typeName === props.dtoTypeName,
      ),
      interfaceSchemas: Object.fromEntries(
        Object.entries(props.document.components.schemas).filter(
          ([key]) => key === props.dtoTypeName,
        ),
      ),
    },
  });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeRealizeCollectorPlanApplication.IComplete | null> =
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
      ...transformRealizeCollectorPlanHistory({
        state: ctx.state(),
        preliminary,
        dtoTypeName: props.dtoTypeName,
      }),
    });
    if (pointer.value === null) return out(result)(null);

    const plans: AutoBeRealizeCollectorPlan[] = pointer.value.plans
      .filter((p) => p.databaseSchemaName !== null)
      .map((p) => ({
        type: "collector",
        dtoTypeName: p.dtoTypeName,
        thinking: p.thinking,
        databaseSchemaName: p.databaseSchemaName!,
        references: p.references,
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
  build: (next: IAutoBeRealizeCollectorPlanApplication.IComplete) => void;
  preliminary: AutoBePreliminaryController<
    "databaseSchemas" | "interfaceSchemas" | "interfaceOperations"
  >;
}): ILlmController {
  const validate: Validator = (input) => {
    const result: IValidation<IAutoBeRealizeCollectorPlanApplication.IProps> =
      typia.validate<IAutoBeRealizeCollectorPlanApplication.IProps>(input);
    if (result.success === false) return result;
    else if (result.data.request.type !== "complete")
      return props.preliminary.validate({
        thinking: result.data.thinking,
        request: result.data.request,
      });

    const errors: IValidation.IError[] = [];
    result.data.request.plans.map((plan, i) => {
      if (props.dtoTypeName !== plan.dtoTypeName)
        errors.push({
          path: `$input.request.plans[${i}].dtoTypeName`,
          value: plan.dtoTypeName,
          expected: JSON.stringify(props.dtoTypeName),
          description: StringUtil.trim`
            The DTO type name must be ${JSON.stringify(props.dtoTypeName)}.

            If you have planned other DTO type's collector, 
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

  const application: ILlmApplication = props.preliminary.fixApplication(
    typia.llm.application<IAutoBeRealizeCollectorPlanApplication>({
      validate: {
        process: validate,
      },
    }),
  );

  return {
    protocol: "class",
    name: SOURCE,
    application,
    execute: {
      process: (next) => {
        if (next.request.type === "complete") props.build(next.request);
      },
    } satisfies IAutoBeRealizeCollectorPlanApplication,
  };
}

type Validator = (
  input: unknown,
) => IValidation<IAutoBeRealizeCollectorPlanApplication.IProps>;

const SOURCE = "realizePlan" satisfies AutoBeEventSource;

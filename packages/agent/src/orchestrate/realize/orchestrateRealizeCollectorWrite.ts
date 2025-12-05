import {
  AutoBeEventSource,
  AutoBeInterfaceHistory,
  AutoBeOpenApi,
  AutoBePrisma,
  AutoBeProgressEventBase,
  AutoBeRealizeCollectorFunction,
  AutoBeRealizeCollectorPlan,
  AutoBeRealizeWriteEvent,
} from "@autobe/interface";
import { AutoBeOpenApiTypeChecker } from "@autobe/utils";
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
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformRealizeCollectorWriteHistory } from "./histories/transformRealizeCollectorWriteHistory";
import { AutoBeRealizeCollectorProgrammer } from "./programmers/AutoBeRealizeCollectorProgrammer";
import { IAutoBeRealizeCollectorWriteApplication } from "./structures/IAutoBeRealizeCollectorWriteApplication";

export async function orchestrateRealizeCollectorWrite<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  props: {
    plans: AutoBeRealizeCollectorPlan[];
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeRealizeCollectorFunction[]> {
  const history: AutoBeInterfaceHistory | null = ctx.state().interface;
  if (history === null)
    throw new Error("Cannot realize collector write without interface.");

  const document: AutoBeOpenApi.IDocument = history.document;
  const getNeighbors = (
    plan: AutoBeRealizeCollectorPlan,
  ): AutoBeRealizeCollectorPlan[] => {
    const visited: Set<string> = new Set();
    AutoBeOpenApiTypeChecker.visit({
      components: document.components,
      schema: { $ref: `#/components/schemas/${plan.dtoTypeName}` },
      closure: (next) => {
        if (AutoBeOpenApiTypeChecker.isReference(next)) {
          const key: string = next.$ref.split("/").pop()!;
          visited.add(key);
        }
      },
    });
    return props.plans.filter(
      (p) => p.dtoTypeName !== plan.dtoTypeName && visited.has(p.dtoTypeName),
    );
  };

  props.progress.total += props.plans.length;
  const result: AutoBeRealizeCollectorFunction[] = await executeCachedBatch(
    ctx,
    props.plans.map(
      (x) => (promptCacheKey) =>
        process(ctx, {
          document: history.document,
          progress: props.progress,
          neighbors: getNeighbors(x),
          plan: x,
          promptCacheKey,
        }),
    ),
  );
  return result;
}

async function process<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    document: AutoBeOpenApi.IDocument;
    plan: AutoBeRealizeCollectorPlan;
    neighbors: AutoBeRealizeCollectorPlan[];
    promptCacheKey: string;
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeRealizeCollectorFunction> {
  const models: AutoBePrisma.IModel[] = ctx
    .state()
    .prisma!.result.data.files.map((f) => f.models)
    .flat();
  const dtoTypeName: string = props.plan.dtoTypeName;
  const location: string = `src/collectors/${AutoBeRealizeCollectorProgrammer.getName(dtoTypeName)}.ts`;
  const preliminary: AutoBePreliminaryController<"prismaSchemas"> =
    new AutoBePreliminaryController({
      state: ctx.state(),
      source: SOURCE,
      application:
        typia.json.application<IAutoBeRealizeCollectorWriteApplication>(),
      kinds: ["prismaSchemas"],
      local: {
        prismaSchemas: models.filter(
          (m) => m.name === props.plan.prismaSchemaName,
        ),
      },
    });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeRealizeCollectorWriteApplication.IComplete | null> =
      {
        value: null,
      };
    const result: AutoBeContext.IResult<Model> = await ctx.conversate({
      source: "realizeWrite",
      controller: createController(ctx, {
        model: ctx.model,
        plan: props.plan,
        neighbors: props.neighbors,
        build: (next) => {
          pointer.value = next;
        },
        preliminary,
      }),
      enforceFunctionCall: true,
      promptCacheKey: props.promptCacheKey,
      ...(await transformRealizeCollectorWriteHistory(ctx, {
        plan: props.plan,
        neighbors: props.neighbors,
        preliminary,
      })),
    });
    if (pointer.value === null) return out(result)(null);

    const content: string =
      await AutoBeRealizeCollectorProgrammer.replaceImportStatements(ctx, {
        dtoTypeName,
        schemas: props.document.components.schemas,
        code: pointer.value.revise.final ?? pointer.value.draft,
      });
    const functor: AutoBeRealizeCollectorFunction = {
      type: "collector",
      plan: props.plan,
      neighbors: AutoBeRealizeCollectorProgrammer.getNeighbors(content),
      location,
      content,
    };
    ctx.dispatch({
      id: v7(),
      type: "realizeWrite",
      function: functor,
      metric: result.metric,
      tokenUsage: result.tokenUsage,
      completed: ++props.progress.completed,
      total: props.progress.total,
      step: ctx.state().analyze?.step ?? 0,
      created_at: new Date().toISOString(),
    } satisfies AutoBeRealizeWriteEvent);
    return out(result)(functor);
  });
}

function createController<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    model: Model;
    plan: AutoBeRealizeCollectorPlan;
    neighbors: AutoBeRealizeCollectorPlan[];
    build: (next: IAutoBeRealizeCollectorWriteApplication.IComplete) => void;
    preliminary: AutoBePreliminaryController<"prismaSchemas">;
  },
): ILlmController<Model> {
  assertSchemaModel(props.model);

  const validate: Validator = (input) => {
    const result: IValidation<IAutoBeRealizeCollectorWriteApplication.IProps> =
      typia.validate<IAutoBeRealizeCollectorWriteApplication.IProps>(input);
    if (result.success === false) return result;
    else if (result.data.request.type !== "complete")
      return props.preliminary.validate({
        thinking: result.data.thinking,
        request: result.data.request,
      });

    const errors: IValidation.IError[] =
      AutoBeRealizeCollectorProgrammer.validate({
        application: ctx.state().prisma!.result.data,
        mappings: result.data.request.mappings,
        plan: props.plan,
        neighbors: props.neighbors,
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
    } satisfies IAutoBeRealizeCollectorWriteApplication,
  };
}

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<IAutoBeRealizeCollectorWriteApplication, "chatgpt">({
      validate: {
        process: validate,
      },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<IAutoBeRealizeCollectorWriteApplication, "claude">({
      validate: {
        process: validate,
      },
    }),
  gemini: (validate: Validator) =>
    typia.llm.application<IAutoBeRealizeCollectorWriteApplication, "gemini">({
      validate: {
        process: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeRealizeCollectorWriteApplication.IProps>;

const SOURCE = "realizeWrite" satisfies AutoBeEventSource;

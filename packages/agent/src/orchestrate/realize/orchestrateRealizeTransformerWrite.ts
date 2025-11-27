import {
  AutoBeEventSource,
  AutoBeInterfaceHistory,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
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
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformRealizeTransformerWriteHistories } from "./histories/transformRealizeTransformerWriteHistories";
import { AutoBeRealizeTransformerProgrammer } from "./programmers/AutoBeRealizeTransformerProgrammer";
import { IAutoBeRealizeTransformerWriteApplication } from "./structures/IAutoBeRealizeTransformerWriteApplication";

export async function orchestrateRealizeTransformerWrite<
  Model extends ILlmSchema.Model,
>(ctx: AutoBeContext<Model>): Promise<AutoBeRealizeWriteEvent[]> {
  const history: AutoBeInterfaceHistory | null = ctx.state().interface;
  if (history === null)
    throw new Error("Cannot realize transformer write without interface.");

  const document: AutoBeOpenApi.IDocument = history.document;
  const candidates: string[] = Object.keys(document.components.schemas).filter(
    (key) =>
      key !== "IAuthorizationToken" &&
      key.startsWith("IPage") === false &&
      key.endsWith(".IRequest") === false &&
      key.endsWith(".ICreate") === false &&
      key.endsWith(".IUpdate") === false &&
      key.endsWith(".ILogin") === false &&
      key.endsWith(".IJoin") === false &&
      key.endsWith(".IRefresh") === false &&
      key.endsWith(".IAuthorized") === false,
  );
  console.log(
    "candidates",
    Object.fromEntries(
      candidates.map((key) => [
        key,
        (document.components.schemas[key] as any)["x-autobe-prisma-schema"] ??
          null,
      ]),
    ),
  );

  const progress: AutoBeProgressEventBase = {
    total: candidates.length,
    completed: 0,
  };
  const result: Array<AutoBeRealizeWriteEvent | false> =
    await executeCachedBatch(
      ctx,
      candidates.map(
        (dtoTypeName) => (promptCacheKey) =>
          process(ctx, {
            dtoTypeName,
            promptCacheKey,
            progress,
          }),
      ),
    );
  return result.filter((r) => r !== false);
}

async function process<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    dtoTypeName: string;
    promptCacheKey: string;
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeRealizeWriteEvent | false> {
  const document: AutoBeOpenApi.IDocument = ctx.state().interface!.document;
  console.log(
    "progress",
    props.dtoTypeName,
    (document.components.schemas[props.dtoTypeName] as any)[
      "x-autobe-prisma-schema"
    ],
  );
  const preliminary: AutoBePreliminaryController<
    "prismaSchemas" | "interfaceSchemas"
  > = new AutoBePreliminaryController({
    state: ctx.state(),
    source: SOURCE,
    application:
      typia.json.application<IAutoBeRealizeTransformerWriteApplication>(),
    kinds: ["prismaSchemas", "interfaceSchemas"],
    local: {
      interfaceSchemas: {
        [props.dtoTypeName]: document.components.schemas[props.dtoTypeName],
      },
    },
  });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<
      | IAutoBeRealizeTransformerWriteApplication.IComplete
      | IAutoBeRealizeTransformerWriteApplication.IReject
      | null
    > = {
      value: null,
    };
    const result: AutoBeContext.IResult<Model> = await ctx.conversate({
      source: "realizeWrite",
      controller: createController({
        model: ctx.model,
        schemas: document.components.schemas,
        dtoTypeName: props.dtoTypeName,
        build: (next) => {
          pointer.value = next;
        },
        preliminary,
      }),
      enforceFunctionCall: true,
      promptCacheKey: props.promptCacheKey,
      ...transformRealizeTransformerWriteHistories({
        state: ctx.state(),
        dtoTypeName: props.dtoTypeName,
        preliminary,
      }),
    });
    if (pointer.value !== null) {
      if (pointer.value.type === "reject") return out(result)(false);
      const content: string =
        await AutoBeRealizeTransformerProgrammer.replaceImportStatements(ctx, {
          dtoTypeName: props.dtoTypeName,
          schemas: document.components.schemas,
          code: pointer.value.revise.final ?? pointer.value.draft,
        });
      const event: AutoBeRealizeWriteEvent = {
        id: v7(),
        type: "realizeWrite",
        function: {
          kind: "transformer",
          dtoTypeName: props.dtoTypeName,
          prismaSchemaName: pointer.value.prismaSchemaName,
          location: `src/transformers/${AutoBeRealizeTransformerProgrammer.getName(
            props.dtoTypeName,
          )}.ts`,
          neighbors: AutoBeRealizeTransformerProgrammer.getNeighbors(content),
          content,
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
  schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
  dtoTypeName: string;
  build: (
    next:
      | IAutoBeRealizeTransformerWriteApplication.IComplete
      | IAutoBeRealizeTransformerWriteApplication.IReject,
  ) => void;
  preliminary: AutoBePreliminaryController<
    "prismaSchemas" | "interfaceSchemas"
  >;
}): ILlmController<Model> {
  assertSchemaModel(props.model);

  const validate: Validator = (input) => {
    const result: IValidation<IAutoBeRealizeTransformerWriteApplication.IProps> =
      typia.validate<IAutoBeRealizeTransformerWriteApplication.IProps>(input);
    if (result.success === false) return result;
    else if (result.data.request.type !== "complete") return result;

    const errors: IValidation.IError[] =
      AutoBeRealizeTransformerProgrammer.validate({
        schemas: props.schemas,
        dtoTypeName: props.dtoTypeName,
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
        if (next.request.type === "complete" || next.request.type === "reject")
          props.build(next.request);
      },
    } satisfies IAutoBeRealizeTransformerWriteApplication,
  };
}

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<IAutoBeRealizeTransformerWriteApplication, "chatgpt">(
      {
        validate: {
          process: validate,
        },
      },
    ),
  claude: (validate: Validator) =>
    typia.llm.application<IAutoBeRealizeTransformerWriteApplication, "claude">({
      validate: {
        process: validate,
      },
    }),
  gemini: (validate: Validator) =>
    typia.llm.application<IAutoBeRealizeTransformerWriteApplication, "gemini">({
      validate: {
        process: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeRealizeTransformerWriteApplication.IProps>;

const SOURCE = "realizeWrite" satisfies AutoBeEventSource;

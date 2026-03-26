import { IAgenticaController } from "@agentica/core";
import {
  AutoBeDatabase,
  AutoBeEventSource,
  AutoBeInterfaceHistory,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeRealizeTransformerFunction,
  AutoBeRealizeTransformerPlan,
  AutoBeRealizeWriteEvent,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { AutoBeOpenApiTypeChecker } from "@autobe/utils";
import { LlmTypeChecker } from "@typia/utils";
import { IPointer } from "tstl";
import typia, { ILlmApplication, ILlmSchema, IValidation } from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { forceRetry } from "../../utils/forceRetry";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { orchestratePreliminary } from "../common/orchestratePreliminary";
import { transformRealizeTransformerWriteHistory } from "./histories/transformRealizeTransformerWriteHistory";
import { AutoBeRealizeTransformerProgrammer } from "./programmers/AutoBeRealizeTransformerProgrammer";
import { compileRealizeFiles } from "./programmers/compileRealizeFiles";
import { IAutoBeRealizeTransformerWriteApplication } from "./structures/IAutoBeRealizeTransformerWriteApplication";

const MAX_WRITE_ATTEMPTS = 3;

export async function orchestrateRealizeTransformerWrite(
  ctx: AutoBeContext,
  props: {
    plans: AutoBeRealizeTransformerPlan[];
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeRealizeTransformerFunction[]> {
  const history: AutoBeInterfaceHistory | null = ctx.state().interface;
  if (history === null)
    throw new Error("Cannot realize transformer write without interface.");

  const document: AutoBeOpenApi.IDocument = history.document;
  const getNeighbors = (
    plan: AutoBeRealizeTransformerPlan,
  ): AutoBeRealizeTransformerPlan[] => {
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
  return await executeCachedBatch(
    ctx,
    props.plans.map(
      (x) => (promptCacheKey) =>
        forceRetry(() =>
          process(ctx, {
            progress: props.progress,
            neighbors: getNeighbors(x),
            plan: x,
            promptCacheKey,
          }),
        ),
    ),
  );
}

// ── Types ──

interface IWriteFailure {
  diagnostics: IAutoBeTypeScriptCompileResult.IDiagnostic[];
  iteration: number;
}

// ── Main loop ──

async function process(
  ctx: AutoBeContext,
  props: {
    plan: AutoBeRealizeTransformerPlan;
    neighbors: AutoBeRealizeTransformerPlan[];
    promptCacheKey: string;
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeRealizeTransformerFunction> {
  const models: AutoBeDatabase.IModel[] = ctx
    .state()
    .database!.result.data.files.map((f) => f.models)
    .flat();
  const document: AutoBeOpenApi.IDocument = ctx.state().interface!.document;
  const dtoTypeName: string = props.plan.dtoTypeName;
  const preliminary: AutoBePreliminaryController<"databaseSchemas"> =
    new AutoBePreliminaryController({
      state: ctx.state(),
      source: SOURCE,
      application:
        typia.json.application<IAutoBeRealizeTransformerWriteApplication>(),
      kinds: ["databaseSchemas"],
      local: {
        databaseSchemas: models.filter(
          (m) => m.name === props.plan.databaseSchemaName,
        ),
      },
    });

  // Write-validate-correct loop state
  let lastWrite: IAutoBeRealizeTransformerWriteApplication.IWrite | null = null;
  let writeSucceeded = false;
  const failures: IWriteFailure[] = [];
  const sourceId = v7();

  const maxIterations = MAX_WRITE_ATTEMPTS * 3; // preliminary + write + complete headroom

  for (let i = 0; i < maxIterations; i++) {
    const action: IPointer<
      | {
          type: "write";
          data: IAutoBeRealizeTransformerWriteApplication.IWrite;
        }
      | { type: "complete" }
      | null
    > = { value: null };

    const result: AutoBeContext.IResult = await ctx.conversate({
      source: SOURCE,
      controller: createController(ctx, {
        plan: props.plan,
        neighbors: props.neighbors,
        preliminary,
        writeSucceeded,
        action,
      }),
      enforceFunctionCall: true,
      promptCacheKey: props.promptCacheKey,
      ...(await buildHistories(ctx, {
        plan: props.plan,
        neighbors: props.neighbors,
        preliminary,
        failures,
        writeSucceeded,
      })),
    });

    // PRELIMINARY — delegate and continue
    if (action.value === null) {
      await orchestratePreliminary(ctx, {
        source_id: sourceId,
        source: SOURCE,
        preliminary,
        trial: i + 1,
        histories: result.histories,
      });
      continue;
    }

    // WRITE — compile and validate
    if (action.value.type === "write") {
      const writeData = action.value.data;
      const code: string =
        await AutoBeRealizeTransformerProgrammer.replaceImportStatements(ctx, {
          dtoTypeName,
          schemas: document.components.schemas,
          code: writeData.revise.final ?? writeData.draft,
        });

      const functor: AutoBeRealizeTransformerFunction = {
        type: "transformer",
        plan: props.plan,
        neighbors: AutoBeRealizeTransformerProgrammer.getNeighbors(code),
        location: `src/transformers/${AutoBeRealizeTransformerProgrammer.getName(dtoTypeName)}.ts`,
        content: code,
      };

      const compileResult = await compileRealizeFiles(ctx, {
        functions: [functor],
        additional: {},
        progress: () => props.progress,
      });

      const diagnostics: IAutoBeTypeScriptCompileResult.IDiagnostic[] =
        compileResult.result.type === "failure"
          ? compileResult.result.diagnostics.filter(
              (d) => d.file === functor.location,
            )
          : [];

      if (diagnostics.length === 0) {
        lastWrite = writeData;
        writeSucceeded = true;
      } else {
        failures.push({ diagnostics, iteration: i });
        if (failures.length >= MAX_WRITE_ATTEMPTS) {
          throw new Error(
            `realizeTransformerWrite: ${dtoTypeName} exhausted ${MAX_WRITE_ATTEMPTS} write attempts`,
          );
        }
      }
      continue;
    }

    // COMPLETE — finalize
    if (action.value.type === "complete" && lastWrite !== null) {
      const content: string =
        await AutoBeRealizeTransformerProgrammer.replaceImportStatements(ctx, {
          dtoTypeName,
          schemas: document.components.schemas,
          code: lastWrite.revise.final ?? lastWrite.draft,
        });
      const functor: AutoBeRealizeTransformerFunction = {
        type: "transformer",
        plan: props.plan,
        neighbors: AutoBeRealizeTransformerProgrammer.getNeighbors(content),
        location: `src/transformers/${AutoBeRealizeTransformerProgrammer.getName(dtoTypeName)}.ts`,
        content,
      };
      ctx.dispatch({
        id: v7(),
        type: "realizeWrite",
        function: functor,
        acquisition: preliminary.getAcquisition(),
        metric: result.metric,
        tokenUsage: result.tokenUsage,
        completed: ++props.progress.completed,
        total: props.progress.total,
        step: ctx.state().analyze?.step ?? 0,
        created_at: new Date().toISOString(),
      } satisfies AutoBeRealizeWriteEvent);
      return functor;
    }
  }

  // Exhausted iterations — use last successful write if available
  if (lastWrite !== null) {
    const content: string =
      await AutoBeRealizeTransformerProgrammer.replaceImportStatements(ctx, {
        dtoTypeName,
        schemas: document.components.schemas,
        code: lastWrite.revise.final ?? lastWrite.draft,
      });
    return {
      type: "transformer",
      plan: props.plan,
      neighbors: AutoBeRealizeTransformerProgrammer.getNeighbors(content),
      location: `src/transformers/${AutoBeRealizeTransformerProgrammer.getName(dtoTypeName)}.ts`,
      content,
    };
  }
  throw new Error(
    `realizeTransformerWrite: ${dtoTypeName} exhausted all iterations`,
  );
}

// ── Controller factory ──

function createController(
  ctx: AutoBeContext,
  props: {
    plan: AutoBeRealizeTransformerPlan;
    neighbors: AutoBeRealizeTransformerPlan[];
    preliminary: AutoBePreliminaryController<"databaseSchemas">;
    writeSucceeded: boolean;
    action: IPointer<
      | {
          type: "write";
          data: IAutoBeRealizeTransformerWriteApplication.IWrite;
        }
      | { type: "complete" }
      | null
    >;
  },
): IAgenticaController.IClass {
  const validate: Validator = (input) => {
    const result: IValidation<IAutoBeRealizeTransformerWriteApplication.IProps> =
      typia.validate<IAutoBeRealizeTransformerWriteApplication.IProps>(input);
    if (result.success === false) return result;
    const req = result.data.request;
    if (req.type !== "write" && req.type !== "complete")
      return props.preliminary.validate({
        thinking: result.data.thinking,
        request: req,
      });

    if (req.type === "write") {
      const errors: IValidation.IError[] =
        AutoBeRealizeTransformerProgrammer.validate({
          application: ctx.state().database!.result.data,
          document: ctx.state().interface!.document,
          plan: props.plan,
          neighbors: props.neighbors,
          transformMappings: req.transformMappings,
          selectMappings: req.selectMappings,
          draft: req.draft,
          revise: req.revise,
        });
      return errors.length
        ? { success: false, errors, data: result.data }
        : result;
    }
    return result;
  };

  let application: ILlmApplication = props.preliminary.fixApplication(
    typia.llm.application<IAutoBeRealizeTransformerWriteApplication>({
      validate: {
        process: validate,
      },
    }),
  );
  AutoBeRealizeTransformerProgrammer.fixApplication({
    definition: application,
    application: ctx.state().database!.result.data,
    document: ctx.state().interface!.document,
    plan: props.plan,
  });
  application = fixCompleteAvailability(application, props.writeSucceeded);

  return {
    protocol: "class",
    name: SOURCE,
    application,
    execute: {
      process: (input) => {
        if (input.request.type === "write")
          props.action.value = { type: "write", data: input.request };
        else if (input.request.type === "complete")
          props.action.value = { type: "complete" };
      },
    } satisfies IAutoBeRealizeTransformerWriteApplication,
  };
}

// ── Schema manipulation ──

/** Removes IComplete from the request union when no write has succeeded. */
function fixCompleteAvailability(
  application: ILlmApplication,
  writeSucceeded: boolean,
): ILlmApplication {
  if (writeSucceeded) return application;

  const func = application.functions.find((f) => f.name === "process");
  if (func === undefined) return application;

  const request: ILlmSchema | undefined = func.parameters.properties.request;
  if (request === undefined) return application;
  if (LlmTypeChecker.isAnyOf(request) === false) return application;

  // biome-ignore lint: type narrowing insufficient after isAnyOf guard
  const anyOfSchema = request as ILlmSchema.IAnyOf;
  const children = anyOfSchema.anyOf as ILlmSchema.IReference[];
  // biome-ignore lint: x-discriminator is a runtime extension property
  const mapping: Record<string, string> =
    (anyOfSchema as unknown as Record<string, unknown>)["x-discriminator"] !=
    null
      ? ((
          (anyOfSchema as unknown as Record<string, unknown>)[
            "x-discriminator"
          ] as Record<string, Record<string, string>>
        ).mapping ?? {})
      : {};

  const completeIdx = children.findIndex(
    (c) => c.$ref.endsWith("/IComplete") || c.$ref.endsWith(".IComplete"),
  );
  if (completeIdx !== -1) children.splice(completeIdx, 1);
  delete mapping["complete"];

  return application;
}

// ── History builder ──

async function buildHistories(
  ctx: AutoBeContext,
  props: {
    plan: AutoBeRealizeTransformerPlan;
    neighbors: AutoBeRealizeTransformerPlan[];
    preliminary: AutoBePreliminaryController<"databaseSchemas">;
    failures: IWriteFailure[];
    writeSucceeded: boolean;
  },
) {
  const base = await transformRealizeTransformerWriteHistory(ctx, {
    plan: props.plan,
    neighbors: props.neighbors,
    preliminary: props.preliminary,
  });

  if (props.failures.length === 0 && !props.writeSucceeded) return base;

  const failureEntries = props.failures.map((f) => ({
    id: v7(),
    type: "systemMessage" as const,
    text:
      `[Write attempt ${f.iteration + 1} FAILED] TypeScript compilation errors:\n` +
      f.diagnostics
        .map(
          (d) =>
            `  - ${d.file ?? "unknown"} ${d.category} TS${d.code}: ${d.messageText}`,
        )
        .join("\n"),
    created_at: new Date().toISOString(),
  }));

  const successEntries = props.writeSucceeded
    ? [
        {
          id: v7(),
          type: "systemMessage" as const,
          text:
            "Your last write attempt passed TypeScript compilation successfully. " +
            "You may now call complete(confirm: true) to finalize.",
          created_at: new Date().toISOString(),
        },
      ]
    : [];

  return {
    ...base,
    histories: [...base.histories, ...failureEntries, ...successEntries],
  };
}

type Validator = (
  input: unknown,
) => IValidation<IAutoBeRealizeTransformerWriteApplication.IProps>;

const SOURCE = "realizeWrite" satisfies AutoBeEventSource;

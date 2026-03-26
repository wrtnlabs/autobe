import { IAgenticaController } from "@agentica/core";
import {
  AutoBeDatabase,
  AutoBeEventSource,
  AutoBeInterfaceHistory,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeRealizeCollectorFunction,
  AutoBeRealizeCollectorPlan,
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
import { transformRealizeCollectorWriteHistory } from "./histories/transformRealizeCollectorWriteHistory";
import { AutoBeRealizeCollectorProgrammer } from "./programmers/AutoBeRealizeCollectorProgrammer";
import { compileRealizeFiles } from "./programmers/compileRealizeFiles";
import { IAutoBeRealizeCollectorWriteApplication } from "./structures/IAutoBeRealizeCollectorWriteApplication";

const MAX_WRITE_ATTEMPTS = 3;

export async function orchestrateRealizeCollectorWrite(
  ctx: AutoBeContext,
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
        forceRetry(() =>
          process(ctx, {
            document: history.document,
            progress: props.progress,
            neighbors: getNeighbors(x),
            plan: x,
            promptCacheKey,
          }),
        ),
    ),
  );
  return result;
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
    document: AutoBeOpenApi.IDocument;
    plan: AutoBeRealizeCollectorPlan;
    neighbors: AutoBeRealizeCollectorPlan[];
    promptCacheKey: string;
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeRealizeCollectorFunction> {
  const models: AutoBeDatabase.IModel[] = ctx
    .state()
    .database!.result.data.files.map((f) => f.models)
    .flat();
  const dtoTypeName: string = props.plan.dtoTypeName;
  const location: string = `src/collectors/${AutoBeRealizeCollectorProgrammer.getName(dtoTypeName)}.ts`;
  const preliminary: AutoBePreliminaryController<"databaseSchemas"> =
    new AutoBePreliminaryController({
      state: ctx.state(),
      source: SOURCE,
      application:
        typia.json.application<IAutoBeRealizeCollectorWriteApplication>(),
      kinds: ["databaseSchemas"],
      local: {
        databaseSchemas: models.filter(
          (m) => m.name === props.plan.databaseSchemaName,
        ),
      },
    });

  // Write-validate-correct loop state
  let lastWrite: IAutoBeRealizeCollectorWriteApplication.IWrite | null = null;
  let writeSucceeded = false;
  const failures: IWriteFailure[] = [];
  const sourceId = v7();

  const maxIterations = MAX_WRITE_ATTEMPTS * 3; // preliminary + write + complete headroom

  for (let i = 0; i < maxIterations; i++) {
    const action: IPointer<
      | { type: "write"; data: IAutoBeRealizeCollectorWriteApplication.IWrite }
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
        await AutoBeRealizeCollectorProgrammer.replaceImportStatements(ctx, {
          dtoTypeName,
          schemas: props.document.components.schemas,
          code: writeData.revise.final ?? writeData.draft,
        });

      const functor: AutoBeRealizeCollectorFunction = {
        type: "collector",
        plan: props.plan,
        neighbors: AutoBeRealizeCollectorProgrammer.getNeighbors(code),
        location,
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
            `realizeCollectorWrite: ${dtoTypeName} exhausted ${MAX_WRITE_ATTEMPTS} write attempts`,
          );
        }
      }
      continue;
    }

    // COMPLETE — finalize
    if (action.value.type === "complete" && lastWrite !== null) {
      const content: string =
        await AutoBeRealizeCollectorProgrammer.replaceImportStatements(ctx, {
          dtoTypeName,
          schemas: props.document.components.schemas,
          code: lastWrite.revise.final ?? lastWrite.draft,
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
      await AutoBeRealizeCollectorProgrammer.replaceImportStatements(ctx, {
        dtoTypeName,
        schemas: props.document.components.schemas,
        code: lastWrite.revise.final ?? lastWrite.draft,
      });
    return {
      type: "collector",
      plan: props.plan,
      neighbors: AutoBeRealizeCollectorProgrammer.getNeighbors(content),
      location,
      content,
    };
  }
  throw new Error(
    `realizeCollectorWrite: ${dtoTypeName} exhausted all iterations`,
  );
}

// ── Controller factory ──

function createController(
  ctx: AutoBeContext,
  props: {
    plan: AutoBeRealizeCollectorPlan;
    neighbors: AutoBeRealizeCollectorPlan[];
    preliminary: AutoBePreliminaryController<"databaseSchemas">;
    writeSucceeded: boolean;
    action: IPointer<
      | { type: "write"; data: IAutoBeRealizeCollectorWriteApplication.IWrite }
      | { type: "complete" }
      | null
    >;
  },
): IAgenticaController.IClass {
  const validate = (
    input: unknown,
  ): IValidation<IAutoBeRealizeCollectorWriteApplication.IProps> => {
    const result: IValidation<IAutoBeRealizeCollectorWriteApplication.IProps> =
      typia.validate<IAutoBeRealizeCollectorWriteApplication.IProps>(input);
    if (result.success === false) return result;
    const req = result.data.request;
    if (req.type !== "write" && req.type !== "complete")
      return props.preliminary.validate({
        thinking: result.data.thinking,
        request: req,
      });

    if (req.type === "write") {
      const errors: IValidation.IError[] =
        AutoBeRealizeCollectorProgrammer.validate({
          application: ctx.state().database!.result.data,
          mappings: req.mappings,
          plan: props.plan,
          neighbors: props.neighbors,
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
    typia.llm.application<IAutoBeRealizeCollectorWriteApplication>({
      validate: {
        process: validate,
      },
    }),
  );
  AutoBeRealizeCollectorProgrammer.fixApplication({
    definition: application,
    application: ctx.state().database!.result.data,
    model: ctx
      .state()
      .database!.result.data.files.map((f) => f.models)
      .flat()
      .find((m) => m.name === props.plan.databaseSchemaName)!,
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
    } satisfies IAutoBeRealizeCollectorWriteApplication,
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
    plan: AutoBeRealizeCollectorPlan;
    neighbors: AutoBeRealizeCollectorPlan[];
    preliminary: AutoBePreliminaryController<"databaseSchemas">;
    failures: IWriteFailure[];
    writeSucceeded: boolean;
  },
) {
  const base = await transformRealizeCollectorWriteHistory(ctx, {
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

const SOURCE = "realizeWrite" satisfies AutoBeEventSource;

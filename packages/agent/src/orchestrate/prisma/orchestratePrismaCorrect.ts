import {
  AutoBeDatabase,
  AutoBeDatabaseCorrectEvent,
  AutoBeEventSource,
  IAutoBeCompiler,
  IAutoBeDatabaseValidation,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { ILlmApplication, ILlmController, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeConfigConstant } from "../../constants/AutoBeConfigConstant";
import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../context/AutoBeContext";
import { IAutoBeOrchestrateHistory } from "../../structures/IAutoBeOrchestrateHistory";
import { AutoBeCyclinicExhaustedError } from "../../utils/AutoBeCyclinicExhaustedError";
import { AutoBeCyclinicController } from "../common/AutoBeCyclinicController";
import { AutoBeDatabaseModelProgrammer } from "./programmers/AutoBeDatabaseModelProgrammer";
import { IAutoBeDatabaseCorrectCyclinicApplication } from "./structures/IAutoBeDatabaseCorrectCyclinicApplication";

type PreliminaryKinds =
  | "analysisSections"
  | "databaseSchemas"
  | "previousAnalysisSections"
  | "previousDatabaseSchemas";

export async function orchestratePrismaCorrect(
  ctx: AutoBeContext,
  application: AutoBeDatabase.IApplication,
): Promise<IAutoBeDatabaseValidation> {
  // Dedup models
  const unique: Set<string> = new Set();
  for (const file of application.files)
    file.models = file.models.filter((model) => {
      if (unique.has(model.name)) return false;
      unique.add(model.name);
      return true;
    });
  application.files = application.files.filter((f) => f.models.length !== 0);

  // Initial validation
  const compiler: IAutoBeCompiler = await ctx.compiler();
  const initialResult: IAutoBeDatabaseValidation =
    await compiler.database.validate(application);
  if (initialResult.success) return initialResult;

  // Dispatch initial validation failure event
  const initialSchemas: Record<string, string> =
    await compiler.database.writePrismaSchemas(application, "postgres");
  ctx.dispatch({
    type: "databaseValidate",
    id: v7(),
    result: initialResult,
    schemas: initialSchemas,
    compiled: await compiler.database.compilePrismaSchemas({
      files: initialSchemas,
    }),
    step: ctx.state().analyze?.step ?? 0,
    created_at: new Date().toISOString(),
  });

  // ── Create cyclinic controller ──
  const cyclinic = new AutoBeCyclinicController<PreliminaryKinds>({
    source: SOURCE,
    application:
      typia.json.application<IAutoBeDatabaseCorrectCyclinicApplication>(),
    kinds: [
      "analysisSections",
      "previousAnalysisSections",
      "databaseSchemas",
      "previousDatabaseSchemas",
    ],
    state: ctx.state(),
    all: {
      databaseSchemas: application.files.map((f) => f.models).flat(),
    },
    local: {
      databaseSchemas: getErrorModels(application, initialResult),
    },
    config: {
      database: "ast",
    },
    maxIterations: AutoBeConfigConstant.DATABASE_CORRECT_RETRY,
  });

  // ── Closure state ──
  let currentApplication: AutoBeDatabase.IApplication = application;
  let currentFailure: IAutoBeDatabaseValidation.IFailure = initialResult;
  let lastResult: AutoBeContext.IResult | null = null;
  let lastValidation: IAutoBeDatabaseValidation = initialResult;

  // ── Run cyclinic correction loop ──
  try {
    return await cyclinic.orchestrate<
      IAutoBeDatabaseCorrectCyclinicApplication.IWrite,
      IAutoBeDatabaseValidation
    >(
      ctx,

      // ── PROCESS: one LLM iteration ──
      async (context) => {
        const actionPointer: IPointer<
          | {
              type: "write";
              data: IAutoBeDatabaseCorrectCyclinicApplication.IWrite;
            }
          | { type: "complete" }
          | null
        > = { value: null };

        // Use latest failure from cyclinic or initial failure
        const latestFailure: IAutoBeDatabaseValidation.IFailure =
          context.failures.length > 0
            ? (context.failures.at(-1)!
                .diagnostics as IAutoBeDatabaseValidation.IFailure)
            : currentFailure;

        const result: AutoBeContext.IResult = await ctx.conversate({
          source: SOURCE,
          controller: createController({
            onAction: (a) => {
              actionPointer.value = a;
            },
            cyclinic,
          }),
          enforceFunctionCall: true,
          ...buildHistories({
            cyclinic,
            failure: latestFailure,
          }),
        });
        lastResult = result;

        if (actionPointer.value === null) return { result, action: null };
        if (actionPointer.value.type === "write")
          return {
            result,
            action: { type: "write", data: actionPointer.value.data },
          };
        return { result, action: { type: "complete" } };
      },

      // ── VALIDATE: merge corrections and validate ──
      async (writeData) => {
        // Merge corrected models into application
        const correction: AutoBeDatabase.IApplication = {
          files: currentApplication.files.map((file) => ({
            filename: file.filename,
            namespace: file.namespace,
            models: file.models.map((model) => {
              AutoBeDatabaseModelProgrammer.emend(model);
              const newbie = writeData.models.find(
                (m) => m.name === model.name,
              );
              return newbie ?? model;
            }),
          })),
        };

        // Dispatch correction event
        ctx.dispatch({
          type: SOURCE,
          id: v7(),
          failure: currentFailure,
          planning: writeData.planning,
          correction,
          acquisition: cyclinic.getPreliminary().getAcquisition(),
          metric: lastResult!.metric,
          tokenUsage: lastResult!.tokenUsage,
          step: ctx.state().analyze?.step ?? 0,
          created_at: new Date().toISOString(),
        } satisfies AutoBeDatabaseCorrectEvent);

        // Validate corrected application
        const compiler: IAutoBeCompiler = await ctx.compiler();
        const result: IAutoBeDatabaseValidation =
          await compiler.database.validate(correction);
        lastValidation = result;

        if (result.success) {
          currentApplication = correction;
          return { success: true };
        }

        // Dispatch validation failure event
        const schemas: Record<string, string> =
          await compiler.database.writePrismaSchemas(correction, "postgres");
        ctx.dispatch({
          type: "databaseValidate",
          id: v7(),
          result,
          schemas,
          compiled: await compiler.database.compilePrismaSchemas({
            files: schemas,
          }),
          step: ctx.state().analyze?.step ?? 0,
          created_at: new Date().toISOString(),
        });

        // Update state for next iteration
        currentApplication = result.data;
        currentFailure = result;

        return {
          success: false,
          diagnostics: result,
        };
      },

      // ── FINALIZE: return successful validation ──
      (_lastWrite) => lastValidation,
    );
  } catch (error) {
    if (error instanceof AutoBeCyclinicExhaustedError) {
      // Return the last known validation (may still have errors)
      return lastValidation;
    }
    throw error;
  }
}

// ── Helpers ──

function getErrorModels(
  application: AutoBeDatabase.IApplication,
  failure: IAutoBeDatabaseValidation.IFailure,
): AutoBeDatabase.IModel[] {
  return Array.from(
    new Set(failure.errors.map((e) => e.table).filter((t) => t !== null)),
  )
    .map((table: string): AutoBeDatabase.IModel | undefined =>
      application.files
        .map((f) => f.models)
        .flat()
        .find((m) => m.name === table),
    )
    .filter((m) => m !== undefined);
}

function filterErrorsByCapacity(
  errors: IAutoBeDatabaseValidation.IError[],
  capacity: number = 8,
): IAutoBeDatabaseValidation.IError[] {
  const unique: Set<string | null> = new Set();
  const filtered: IAutoBeDatabaseValidation.IError[] = [];
  for (const err of errors) {
    unique.add(err.table ?? null);
    if (unique.size > capacity) break;
    filtered.push(err);
  }
  return filtered;
}

// ── Controller factory ──

function createController(props: {
  onAction: (
    action:
      | {
          type: "write";
          data: IAutoBeDatabaseCorrectCyclinicApplication.IWrite;
        }
      | { type: "complete" },
  ) => void;
  cyclinic: AutoBeCyclinicController<PreliminaryKinds>;
}): ILlmController {
  const validate: Validator = (input) => {
    const result =
      typia.validate<IAutoBeDatabaseCorrectCyclinicApplication.IProps>(input);
    if (result.success === false) return result;

    const request = result.data.request;

    // Preliminary request → delegate to preliminary validation
    if (request.type !== "write" && request.type !== "complete") {
      return props.cyclinic.getPreliminary().validate({
        thinking: result.data.thinking,
        request,
      });
    }

    // Write or Complete → accept as-is
    return result;
  };

  const application: ILlmApplication = props.cyclinic.fixCompleteAvailability(
    props.cyclinic.getPreliminary().fixApplication(
      typia.llm.application<IAutoBeDatabaseCorrectCyclinicApplication>({
        validate: { process: validate },
      }),
    ),
  );

  return {
    protocol: "class",
    name: SOURCE satisfies AutoBeEventSource,
    application,
    execute: {
      process: (next) => {
        if (next.request.type === "write")
          props.onAction({ type: "write", data: next.request });
        else if (next.request.type === "complete")
          props.onAction({ type: "complete" });
      },
    } satisfies IAutoBeDatabaseCorrectCyclinicApplication,
  };
}

// ── History builder ──

function buildHistories(props: {
  cyclinic: AutoBeCyclinicController<PreliminaryKinds>;
  failure: IAutoBeDatabaseValidation.IFailure;
}): IAutoBeOrchestrateHistory {
  // Filter errors to manageable capacity for the LLM
  const errors = filterErrorsByCapacity(props.failure.errors);

  return {
    histories: [
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: AutoBeSystemPromptConstant.DATABASE_CORRECT,
      },
      ...props.cyclinic.getPreliminary().getHistories(),
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "assistantMessage",
        text: StringUtil.trim`
          Below are the list of errors what you have to fix:

          \`\`\`json
          ${JSON.stringify(errors)}
          \`\`\`
        `,
      },
    ] as IAutoBeOrchestrateHistory["histories"],
    userMessage:
      "Resolve the compilation errors in the provided database schema files.",
  };
}

type Validator = (
  input: unknown,
) => IValidation<IAutoBeDatabaseCorrectCyclinicApplication.IProps>;

const SOURCE = "databaseCorrect" satisfies AutoBeEventSource;

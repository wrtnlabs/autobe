import {
  AutoBeDatabase,
  AutoBeDatabaseCorrectEvent,
  AutoBeEventSource,
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
import { IAutoBeDatabaseCorrectApplication } from "./structures/IAutoBeDatabaseCorrectApplication";

// ── Types ──

type PreliminaryKinds =
  | "analysisSections"
  | "databaseSchemas"
  | "previousAnalysisSections"
  | "previousDatabaseSchemas";

type ActionPointerValue =
  | { type: "write"; data: IAutoBeDatabaseCorrectApplication.IWrite }
  | { type: "complete" }
  | null;

type Validator = (
  input: unknown,
) => IValidation<IAutoBeDatabaseCorrectApplication.IProps>;

const SOURCE = "databaseCorrect" satisfies AutoBeEventSource;

// ── Entry point ──

export async function orchestratePrismaCorrect(
  ctx: AutoBeContext,
  application: AutoBeDatabase.IApplication,
): Promise<IAutoBeDatabaseValidation> {
  // Dedup models
  const seen = new Set<string>();
  for (const file of application.files)
    file.models = file.models.filter((model) => {
      if (seen.has(model.name)) return false;
      seen.add(model.name);
      return true;
    });
  application.files = application.files.filter((f) => f.models.length !== 0);

  // Initial validation
  const compiler = await ctx.compiler();
  const initialResult = await compiler.database.validate(application);
  if (initialResult.success) return initialResult;

  // Dispatch initial validation failure
  const initialSchemas = await compiler.database.writePrismaSchemas(
    application,
    "postgres",
  );
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

  // Create cyclinic controller
  const cyclinic = new AutoBeCyclinicController<PreliminaryKinds>({
    source: SOURCE,
    application:
      typia.json.application<IAutoBeDatabaseCorrectApplication>(),
    kinds: [
      "analysisSections",
      "previousAnalysisSections",
      "databaseSchemas",
      "previousDatabaseSchemas",
    ],
    state: ctx.state(),
    all: {
      databaseSchemas: application.files.flatMap((f) => f.models),
    },
    local: {
      databaseSchemas: getErrorModels(application, initialResult),
    },
    config: { database: "ast" },
    maxIterations: AutoBeConfigConstant.DATABASE_CORRECT_RETRY,
  });

  // Closure state
  let currentApplication = application;
  let currentFailure: IAutoBeDatabaseValidation.IFailure = initialResult;
  let lastResult: AutoBeContext.IResult | null = null;
  let lastValidation: IAutoBeDatabaseValidation = initialResult;

  // Run cyclinic correction loop
  try {
    return await cyclinic.orchestrate<
      IAutoBeDatabaseCorrectApplication.IWrite,
      IAutoBeDatabaseValidation
    >(
      ctx,

      // PROCESS
      async (context) => {
        const actionPointer: IPointer<ActionPointerValue> = { value: null };

        // Use latest failure from cyclinic or initial
        const latestFailure: IAutoBeDatabaseValidation.IFailure =
          context.failures.length > 0
            ? (context.failures.at(-1)!
                .diagnostics as IAutoBeDatabaseValidation.IFailure)
            : currentFailure;

        const result = await ctx.conversate({
          source: SOURCE,
          controller: createController({
            onAction: (a) => {
              actionPointer.value = a;
            },
            cyclinic,
          }),
          enforceFunctionCall: true,
          ...buildHistories({ cyclinic, failure: latestFailure }),
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

      // VALIDATE
      async (writeData) => {
        // Merge corrected models into application
        const correction: AutoBeDatabase.IApplication = {
          files: currentApplication.files.map((file) => ({
            filename: file.filename,
            namespace: file.namespace,
            models: file.models.map((model) => {
              AutoBeDatabaseModelProgrammer.emend(model);
              return (
                writeData.models.find((m) => m.name === model.name) ?? model
              );
            }),
          })),
        };

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

        const compiler = await ctx.compiler();
        const result = await compiler.database.validate(correction);
        lastValidation = result;

        if (result.success) {
          currentApplication = correction;
          return { success: true };
        }

        // Dispatch validation failure
        const schemas = await compiler.database.writePrismaSchemas(
          correction,
          "postgres",
        );
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

        currentApplication = result.data;
        currentFailure = result;

        return { success: false, diagnostics: result };
      },

      // FINALIZE
      () => lastValidation,
    );
  } catch (error) {
    // Graceful degradation: return last known validation even if exhausted
    if (error instanceof AutoBeCyclinicExhaustedError) return lastValidation;
    throw error;
  }
}

// ── Helpers ──

function getErrorModels(
  application: AutoBeDatabase.IApplication,
  failure: IAutoBeDatabaseValidation.IFailure,
): AutoBeDatabase.IModel[] {
  const allModels = application.files.flatMap((f) => f.models);
  const errorTables = new Set(
    failure.errors.map((e) => e.table).filter((t) => t !== null),
  );
  return [...errorTables]
    .map((table) => allModels.find((m) => m.name === table))
    .filter((m) => m !== undefined);
}

function filterErrorsByCapacity(
  errors: IAutoBeDatabaseValidation.IError[],
  capacity: number = 8,
): IAutoBeDatabaseValidation.IError[] {
  const tables = new Set<string | null>();
  const filtered: IAutoBeDatabaseValidation.IError[] = [];
  for (const err of errors) {
    tables.add(err.table ?? null);
    if (tables.size > capacity) break;
    filtered.push(err);
  }
  return filtered;
}

// ── Controller factory ──

function createController(props: {
  onAction: (action: Exclude<ActionPointerValue, null>) => void;
  cyclinic: AutoBeCyclinicController<PreliminaryKinds>;
}): ILlmController {
  const validate: Validator = (input) => {
    const result =
      typia.validate<IAutoBeDatabaseCorrectApplication.IProps>(input);
    if (result.success === false) return result;

    const request = result.data.request;

    if (request.type !== "write" && request.type !== "complete") {
      return props.cyclinic.getPreliminary().validate({
        thinking: result.data.thinking,
        request,
      });
    }

    return result;
  };

  const application: ILlmApplication = props.cyclinic.fixCompleteAvailability(
    props.cyclinic.getPreliminary().fixApplication(
      typia.llm.application<IAutoBeDatabaseCorrectApplication>({
        validate: { process: validate },
      }),
    ),
  );

  return {
    protocol: "class",
    name: SOURCE,
    application,
    execute: {
      process: (next) => {
        if (next.request.type === "write")
          props.onAction({ type: "write", data: next.request });
        else if (next.request.type === "complete")
          props.onAction({ type: "complete" });
      },
    } satisfies IAutoBeDatabaseCorrectApplication,
  };
}

// ── History builder ──

function buildHistories(props: {
  cyclinic: AutoBeCyclinicController<PreliminaryKinds>;
  failure: IAutoBeDatabaseValidation.IFailure;
}): IAutoBeOrchestrateHistory {
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

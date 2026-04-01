import { IAgenticaController } from "@agentica/core";
import {
  AutoBeDatabaseComponent,
  AutoBeDatabaseGroup,
  AutoBeEventSource,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { IPointer } from "tstl";
import typia, { ILlmApplication, IValidation } from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { buildAnalysisContextSections } from "../../utils/RAGRetrieval";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { getEmbedder } from "../../utils/getEmbedder";
import { AutoBeCyclinicController } from "../common/AutoBeCyclinicController";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { convertToSectionEntries } from "../common/internal/convertToSectionEntries";
import { IAnalysisSectionEntry } from "../common/structures/IAnalysisSectionEntry";
import { transformPrismaComponentsHistory } from "./histories/transformPrismaComponentsHistory";
import { AutoBeDatabaseComponentProgrammer } from "./programmers/AutoBeDatabaseComponentProgrammer";
import { IAutoBeDatabaseComponentApplication } from "./structures/IAutoBeDatabaseComponentApplication";

export async function orchestratePrismaComponent(
  ctx: AutoBeContext,
  props: {
    instruction: string;
    groups: AutoBeDatabaseGroup[];
  },
): Promise<AutoBeDatabaseComponent[]> {
  // Filter to only process domain groups - authorization groups are handled
  // by orchestratePrismaAuthorization separately
  const domainGroups = props.groups.filter((g) => g.kind === "domain");
  if (domainGroups.length === 0) return [];

  const prefix: string | null = ctx.state().analyze?.prefix ?? null;
  const progress: AutoBeProgressEventBase = {
    completed: 0,
    total: domainGroups.length,
  };

  const components: AutoBeDatabaseComponent[] = await executeCachedBatch(
    ctx,
    domainGroups.map((group) => async (promptCacheKey) => {
      const component: AutoBeDatabaseComponent = await process(ctx, {
        group,
        instruction: props.instruction,
        prefix,
        progress,
        promptCacheKey,
      });
      return component;
    }),
  );
  return AutoBeDatabaseComponentProgrammer.removeDuplicatedTable(components);
}

async function process(
  ctx: AutoBeContext,
  props: {
    group: AutoBeDatabaseGroup;
    instruction: string;
    prefix: string | null;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
  },
): Promise<AutoBeDatabaseComponent> {
  const allSections: IAnalysisSectionEntry[] = convertToSectionEntries(
    ctx.state().analyze?.files ?? [],
  );
  const queryText: string = [
    "prisma",
    "schema",
    "component",
    props.group.filename,
    props.group.namespace,
  ].join(" ");

  const ragSections: IAnalysisSectionEntry[] =
    await buildAnalysisContextSections(
      getEmbedder(),
      allSections,
      queryText,
      "TOPK",
      { log: false, logPrefix: "prismaComponent" },
    );

  const cyclinic = new AutoBeCyclinicController<
    "analysisSections" | "previousAnalysisSections" | "previousDatabaseSchemas"
  >({
    application: typia.json.application<IAutoBeDatabaseComponentApplication>(),
    source: SOURCE,
    kinds: [
      "analysisSections",
      "previousAnalysisSections",
      "previousDatabaseSchemas",
    ],
    state: ctx.state(),
    local: {
      analysisSections: ragSections,
    },
  });

  return cyclinic.orchestrate<
    IAutoBeDatabaseComponentApplication.IWrite,
    AutoBeDatabaseComponent
  >(
    ctx,
    // PROCESS: LLM conversation → action
    async (context) => {
      const action: IPointer<
        | {
            type: "write";
            data: IAutoBeDatabaseComponentApplication.IWrite;
          }
        | { type: "complete" }
        | null
      > = { value: null };

      const result: AutoBeContext.IResult = await ctx.conversate({
        source: SOURCE,
        controller: createController({
          cyclinic,
          action,
          prefix: props.prefix,
        }),
        enforceFunctionCall: true,
        promptCacheKey: props.promptCacheKey,
        ...transformPrismaComponentsHistory(ctx.state(), {
          instruction: props.instruction,
          prefix: props.prefix,
          preliminary: context.preliminary,
          group: props.group,
        }),
      });
      return { result, action: action.value };
    },
    // VALIDATE: run business logic validation
    async (writeData) => {
      const errors: IValidation.IError[] = [];
      AutoBeDatabaseComponentProgrammer.validate({
        errors,
        prefix: props.prefix,
        tables: writeData.tables,
        path: "$input.request.tables",
      });
      if (errors.length > 0)
        return { success: false, diagnostics: errors };
      return { success: true };
    },
    // FINALIZE: build result, dispatch event, return
    async (lastWrite, result) => {
      // Build complete component from group skeleton + tables
      const component: AutoBeDatabaseComponent = {
        ...props.group,
        tables: lastWrite.tables,
      };
      if (result !== null)
        ctx.dispatch({
          type: SOURCE,
          id: v7(),
          created_at: new Date().toISOString(),
          analysis: lastWrite.analysis,
          rationale: lastWrite.rationale,
          component,
          acquisition: cyclinic.getPreliminary().getAcquisition(),
          metric: result.metric,
          tokenUsage: result.tokenUsage,
          step: ctx.state().analyze?.step ?? 0,
          total: props.progress.total,
          completed: ++props.progress.completed,
        });
      return component;
    },
  );
}

function createController(props: {
  cyclinic: AutoBeCyclinicController<
    "analysisSections" | "previousAnalysisSections" | "previousDatabaseSchemas"
  >;
  action: IPointer<
    | {
        type: "write";
        data: IAutoBeDatabaseComponentApplication.IWrite;
      }
    | { type: "complete" }
    | null
  >;
  prefix: string | null;
}): IAgenticaController.IClass {
  const preliminary: AutoBePreliminaryController<
    "analysisSections" | "previousAnalysisSections" | "previousDatabaseSchemas"
  > = props.cyclinic.getPreliminary();

  const validate: Validator = (input) => {
    const result: IValidation<IAutoBeDatabaseComponentApplication.IProps> =
      typia.validate<IAutoBeDatabaseComponentApplication.IProps>(input);
    if (result.success === false) return result;
    const req = result.data.request;
    if (req.type === "write" || req.type === "complete") return result;
    return preliminary.validate({
      thinking: result.data.thinking,
      request: req,
    });
  };
  const application: ILlmApplication = props.cyclinic.fixCompleteAvailability(
    preliminary.fixApplication(
      typia.llm.application<IAutoBeDatabaseComponentApplication>({
        validate: {
          process: validate,
        },
      }),
    ),
  );
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
    } satisfies IAutoBeDatabaseComponentApplication,
  };
}

type Validator = (
  input: unknown,
) => IValidation<IAutoBeDatabaseComponentApplication.IProps>;

const SOURCE = "databaseComponent" satisfies AutoBeEventSource;

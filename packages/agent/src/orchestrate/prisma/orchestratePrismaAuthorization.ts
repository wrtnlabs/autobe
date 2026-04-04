import { IAgenticaController } from "@agentica/core";
import {
  AutoBeAnalyze,
  AutoBeDatabaseComponent,
  AutoBeDatabaseGroup,
  AutoBeEventSource,
} from "@autobe/interface";
import { IPointer } from "tstl";
import typia, { ILlmApplication, IValidation } from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformPrismaAuthorizationHistory } from "./histories/transformPrismaAuthorizationHistory";
import { AutoBeDatabaseAuthorizationProgrammer } from "./programmers/AutoBeDatabaseAuthorizationProgrammer";
import { AutoBeDatabaseComponentProgrammer } from "./programmers/AutoBeDatabaseComponentProgrammer";
import { IAutoBeDatabaseAuthorizationApplication } from "./structures/IAutoBeDatabaseAuthorizationApplication";

export async function orchestratePrismaAuthorization(
  ctx: AutoBeContext,
  props: {
    groups: AutoBeDatabaseGroup[];
    instruction: string;
  },
): Promise<AutoBeDatabaseComponent | null> {
  const authorizationGroup: AutoBeDatabaseGroup | undefined = props.groups
    .filter((g) => g.kind === "authorization")
    .at(0);
  if (authorizationGroup === undefined) return null;

  const actors: AutoBeAnalyze.IActor[] = ctx.state().analyze?.actors ?? [];
  if (actors.length === 0) return null;

  const prefix: string | null = ctx.state().analyze?.prefix ?? null;

  return await process(ctx, {
    actors,
    prefix,
    group: authorizationGroup,
    instruction: props.instruction,
  });
}

async function process(
  ctx: AutoBeContext,
  props: {
    actors: AutoBeAnalyze.IActor[];
    prefix: string | null;
    group: AutoBeDatabaseGroup;
    instruction: string;
  },
): Promise<AutoBeDatabaseComponent> {
  const preliminary: AutoBePreliminaryController<
    "analysisSections" | "previousAnalysisSections" | "previousDatabaseSchemas"
  > = new AutoBePreliminaryController({
    dispatch: (e) => ctx.dispatch(e),
    application:
      typia.json.application<IAutoBeDatabaseAuthorizationApplication>(),
    source: SOURCE,
    kinds: [
      "analysisSections",
      "previousAnalysisSections",
      "previousDatabaseSchemas",
    ],
    state: ctx.state(),
  });

  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeDatabaseAuthorizationApplication.IWrite | null> =
      {
        value: null,
      };
    const result: AutoBeContext.IResult = await ctx.conversate({
      source: SOURCE,
      controller: createController({
        pointer,
        preliminary,
        actors: props.actors,
        prefix: props.prefix,
      }),
      enforceFunctionCall: true,
      ...transformPrismaAuthorizationHistory({
        actors: props.actors,
        prefix: props.prefix,
        group: props.group,
        instruction: props.instruction,
        preliminary,
      }),
    });
    if (pointer.value === null) return out(result)(null);

    // Remove duplicated tables using shared utility
    const [component] = AutoBeDatabaseComponentProgrammer.removeDuplicatedTable(
      [
        {
          ...props.group,
          tables: pointer.value.tables,
        },
      ],
    );
    ctx.dispatch({
      type: SOURCE,
      id: v7(),
      created_at: new Date().toISOString(),
      analysis: pointer.value.analysis,
      rationale: pointer.value.rationale,
      component,
      acquisition: preliminary.getAcquisition(),
      metric: result.metric,
      tokenUsage: result.tokenUsage,
      step: ctx.state().analyze?.step ?? 0,
    });
    return out(result)(component);
  });
}

function createController(props: {
  pointer: IPointer<IAutoBeDatabaseAuthorizationApplication.IWrite | null>;
  preliminary: AutoBePreliminaryController<
    "analysisSections" | "previousAnalysisSections" | "previousDatabaseSchemas"
  >;
  actors: AutoBeAnalyze.IActor[];
  prefix: string | null;
}): IAgenticaController.IClass {
  const validate = (
    input: unknown,
  ): IValidation<IAutoBeDatabaseAuthorizationApplication.IProps> => {
    const result: IValidation<IAutoBeDatabaseAuthorizationApplication.IProps> =
      typia.validate<IAutoBeDatabaseAuthorizationApplication.IProps>(input);
    if (result.success === false) return result;
    else if (result.data.request.type !== "write")
      return props.preliminary.validate({
        thinking: result.data.thinking,
        request: result.data.request,
      });

    const errors: IValidation.IError[] = [];
    AutoBeDatabaseAuthorizationProgrammer.validate({
      errors,
      path: "$input.request.tables",
      actors: props.actors,
      prefix: props.prefix,
      tables: result.data.request.tables,
    });
    if (errors.length > 0)
      return {
        success: false,
        errors,
        data: result.data,
      };
    return result;
  };

  const application: ILlmApplication = props.preliminary.fixApplication(
    typia.llm.application<IAutoBeDatabaseAuthorizationApplication>({
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
      process: (input) => {
        if (input.request.type === "write") props.pointer.value = input.request;
      },
    } satisfies IAutoBeDatabaseAuthorizationApplication,
  };
}

const SOURCE = "databaseAuthorization" satisfies AutoBeEventSource;

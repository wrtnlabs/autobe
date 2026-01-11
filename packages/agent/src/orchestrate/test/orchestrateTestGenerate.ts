import {
  AutoBeEventSource,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeTestGenerateFunction,
  AutoBeTestPrepareFunction,
} from "@autobe/interface";
import { ILlmApplication, ILlmController, IValidation } from "@samchon/openapi";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { orchestrateTestCorrectCasting } from "./internal/orchestrateTestCorrectCasting";
import { orchestrateTestCorrectOverall } from "./internal/orchestrateTestCorrectOverall";
// import { orchestrateTestCorrectRequest } from "./internal/orchestrateTestCorrectRequest";
import { orchestrateTestGenerateWrite } from "./orchestrateTestGenerateWrite";
import { AutoBeTestGenerateProgrammer } from "./programmers/AutoBeTestGenerateProgrammer";
import { IAutoBeTestCorrectOverallApplication } from "./structures/IAutoBeTestCorrectOverallApplication";
import { IAutoBeTestGenerateProcedure } from "./structures/IAutoBeTestGenerateProcedure";

export async function orchestrateTestGenerate(
  ctx: AutoBeContext,
  props: {
    instruction: string;
    document: AutoBeOpenApi.IDocument;
    prepares: AutoBeTestPrepareFunction[];
    writeProgress: AutoBeProgressEventBase;
    correctProgress: AutoBeProgressEventBase;
  },
): Promise<AutoBeTestGenerateFunction[]> {
  const compile = async (procedure: IAutoBeTestGenerateProcedure) =>
    AutoBeTestGenerateProgrammer.compile({
      compiler: await ctx.compiler(),
      step: ctx.state().analyze?.step ?? 0,
      procedure,
    });
  const replaceImportStatements = async (
    procedure: IAutoBeTestGenerateProcedure,
  ) =>
    AutoBeTestGenerateProgrammer.replaceImportStatements({
      compiler: await ctx.compiler(),
      artifacts: procedure.artifacts,
      prepare: procedure.prepare,
      location: procedure.function.location,
      content: procedure.function.content,
    });

  let procedures: IAutoBeTestGenerateProcedure[] =
    await orchestrateTestGenerateWrite(ctx, {
      instruction: props.instruction,
      document: props.document,
      prepares: props.prepares,
      progress: props.writeProgress,
    });
  procedures = await orchestrateTestCorrectCasting(ctx, {
    programmer: {
      compile,
      replaceImportStatements,
      asynchronous: true,
    },
    procedures,
    progress: props.correctProgress,
  });
  // procedures = await orchestrateTestCorrectRequest(ctx, {
  //   programmer: {
  //     compile,
  //     replaceImportStatements,
  //   },
  //   instruction: props.instruction,
  //   progress: props.correctProgress,
  //   procedures,
  // });
  procedures = await orchestrateTestCorrectOverall(ctx, {
    programmer: {
      compile,
      replaceImportStatements,
      controller: (next) => createCorrectOverallController(next),
    },
    instruction: props.instruction,
    progress: props.correctProgress,
    procedures,
    discard: false,
  });
  return procedures.map((p) => p.function);
}

function createCorrectOverallController(props: {
  procedure: IAutoBeTestGenerateProcedure;
  build: (next: IAutoBeTestCorrectOverallApplication.IProps) => void;
}): ILlmController<IAutoBeTestCorrectOverallApplication> {
  const validate: Validator = (input) => {
    const result: IValidation<IAutoBeTestCorrectOverallApplication.IProps> =
      typia.validate<IAutoBeTestCorrectOverallApplication.IProps>(input);
    if (result.success === false) return result;
    const errors: IValidation.IError[] = AutoBeTestGenerateProgrammer.validate({
      procedure: props.procedure,
      draft: result.data.draft,
      revise: result.data.revise,
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
    typia.llm.application<IAutoBeTestCorrectOverallApplication>({
      validate: {
        rewrite: validate,
      },
    });
  return {
    protocol: "class",
    name: "testCorrect" satisfies AutoBeEventSource,
    application,
    execute: {
      rewrite: (v) => {
        props.build(v);
      },
    } satisfies IAutoBeTestCorrectOverallApplication,
  };
}

type Validator = (
  input: unknown,
) => IValidation<IAutoBeTestCorrectOverallApplication.IProps>;

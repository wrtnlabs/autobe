import {
  AutoBeEventSource,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeTestAuthorizeFunction,
  AutoBeTestGenerateFunction,
  AutoBeTestOperationFunction,
  AutoBeTestPrepareFunction,
  AutoBeTestScenario,
} from "@autobe/interface";
import { ILlmApplication, ILlmController, IValidation } from "@samchon/openapi";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { orchestrateTestCorrectCasting } from "./internal/orchestrateTestCorrectCasting";
import { orchestrateTestCorrectOverall } from "./internal/orchestrateTestCorrectOverall";
// import { orchestrateTestCorrectRequest } from "./internal/orchestrateTestCorrectRequest";
import { orchestrateTestOperationWrite } from "./orchestrateTestOperationWrite";
import { AutoBeTestOperationProgrammer } from "./programmers/AutoBeTestOperationProgrammer";
import { IAutoBeTestCorrectOverallApplication } from "./structures/IAutoBeTestCorrectOverallApplication";
import { IAutoBeTestOperationProcedure } from "./structures/IAutoBeTestOperationProcedure";

export async function orchestrateTestOperation(
  ctx: AutoBeContext,
  props: {
    instruction: string;
    document: AutoBeOpenApi.IDocument;
    scenarios: AutoBeTestScenario[];
    authorizes: AutoBeTestAuthorizeFunction[];
    prepares: AutoBeTestPrepareFunction[];
    generates: AutoBeTestGenerateFunction[];
    writeProgress: AutoBeProgressEventBase;
    correctProgress: AutoBeProgressEventBase;
  },
): Promise<AutoBeTestOperationFunction[]> {
  const compile = async (procedure: IAutoBeTestOperationProcedure) =>
    AutoBeTestOperationProgrammer.compile({
      compiler: await ctx.compiler(),
      document: props.document,
      procedure,
      step: ctx.state().analyze?.step ?? 0,
    });
  const replaceImportStatements = async (
    procedure: IAutoBeTestOperationProcedure,
  ) =>
    AutoBeTestOperationProgrammer.replaceImportStatements({
      compiler: await ctx.compiler(),
      artifacts: procedure.artifacts,
      prepares: procedure.prepares,
      generates: procedure.generates,
      authorizes: procedure.authorizes,
      location: procedure.function.location,
      content: procedure.function.content,
    });

  let procedures: IAutoBeTestOperationProcedure[] =
    await orchestrateTestOperationWrite(ctx, {
      instruction: props.instruction,
      document: props.document,
      scenarios: props.scenarios,
      authorizes: props.authorizes,
      prepares: props.prepares,
      generates: props.generates,
      progress: props.writeProgress,
    });
  procedures = await orchestrateTestCorrectCasting(ctx, {
    programmer: {
      compile,
      replaceImportStatements,
      asynchronous: true,
    },
    procedures,
    progress: props.writeProgress,
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
    procedures,
    instruction: props.instruction,
    progress: props.correctProgress,
  });
  return procedures.map((p) => p.function);
}

function createCorrectOverallController(props: {
  procedure: IAutoBeTestOperationProcedure;
  build: (next: IAutoBeTestCorrectOverallApplication.IProps) => void;
}): ILlmController<IAutoBeTestCorrectOverallApplication> {
  const validate = (
    input: unknown,
  ): IValidation<IAutoBeTestCorrectOverallApplication.IProps> => {
    const result: IValidation<IAutoBeTestCorrectOverallApplication.IProps> =
      typia.validate<IAutoBeTestCorrectOverallApplication.IProps>(input);
    if (result.success === false) return result;
    const errors: IValidation.IError[] = AutoBeTestOperationProgrammer.validate(
      {
        procedure: props.procedure,
        draft: result.data.draft,
        revise: result.data.revise,
      },
    );
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

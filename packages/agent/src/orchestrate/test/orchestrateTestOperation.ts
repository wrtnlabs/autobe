import {
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeTestAuthorizeFunction,
  AutoBeTestGenerateFunction,
  AutoBeTestOperationFunction,
  AutoBeTestPrepareFunction,
  AutoBeTestScenario,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";

import { AutoBeContext } from "../../context/AutoBeContext";
import { orchestrateTestCorrectCasting } from "./internal/orchestrateTestCorrectCasting";
import { orchestrateTestCorrectOverall } from "./internal/orchestrateTestCorrectOverall";
// import { orchestrateTestCorrectRequest } from "./internal/orchestrateTestCorrectRequest";
import { orchestrateTestOperationWrite } from "./orchestrateTestOperationWrite";
import { AutoBeTestOperationProgrammer } from "./programmers/AutoBeTestOperationProgrammer";
import { IAutoBeTestOperationProcedure } from "./structures/IAutoBeTestOperationProcedure";

export async function orchestrateTestOperation<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
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
      procedure,
      step: ctx.state().analyze?.step ?? 0,
    });
  const replaceImportStatements = async (
    procedure: IAutoBeTestOperationProcedure,
  ) =>
    AutoBeTestOperationProgrammer.replaceImportStatements({
      compiler: await ctx.compiler(),
      artifacts: procedure.artifacts,
      prepares: props.prepares,
      generates: props.generates,
      authorizes: props.authorizes,
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
    },
    procedures,
    instruction: props.instruction,
  });
  return procedures.map((p) => p.function);
}

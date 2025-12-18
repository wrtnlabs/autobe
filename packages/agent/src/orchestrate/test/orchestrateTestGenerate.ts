import {
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeTestGenerateFunction,
  AutoBeTestPrepareFunction,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";

import { AutoBeContext } from "../../context/AutoBeContext";
import { orchestrateTestCorrectCasting } from "./internal/orchestrateTestCorrectCasting";
import { orchestrateTestCorrectOverall } from "./internal/orchestrateTestCorrectOverall";
import { orchestrateTestCorrectRequest } from "./internal/orchestrateTestCorrectRequest";
import { orchestrateTestGenerateWrite } from "./orchestrateTestGenerateWrite";
import { AutoBeTestGenerateProgrammer } from "./programmers/AutoBeTestGenerateProgrammer";
import { IAutoBeTestGenerateProcedure } from "./structures/IAutoBeTestGenerateProcedure";

export async function orchestrateTestGenerate<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
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
    },
    procedures,
    progress: props.correctProgress,
  });
  procedures = await orchestrateTestCorrectRequest(ctx, {
    programmer: {
      compile,
      replaceImportStatements,
    },
    instruction: props.instruction,
    progress: props.correctProgress,
    procedures,
  });
  procedures = await orchestrateTestCorrectOverall(ctx, {
    programmer: {
      compile,
      replaceImportStatements,
    },
    instruction: props.instruction,
    pgoress: props.correctProgress,
    procedures,
  });
  return procedures.map((p) => p.function);
}

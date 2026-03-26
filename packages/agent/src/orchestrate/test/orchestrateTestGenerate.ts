import {
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeTestGenerateFunction,
  AutoBeTestPrepareFunction,
} from "@autobe/interface";

import { AutoBeContext } from "../../context/AutoBeContext";
import { orchestrateTestCorrectCasting } from "./internal/orchestrateTestCorrectCasting";
import { orchestrateTestGenerateWrite } from "./orchestrateTestGenerateWrite";
import { AutoBeTestGenerateProgrammer } from "./programmers/AutoBeTestGenerateProgrammer";
import { IAutoBeTestGenerateProcedure } from "./structures/IAutoBeTestGenerateProcedure";

export async function orchestrateTestGenerate(
  ctx: AutoBeContext,
  props: {
    instruction: string;
    document: AutoBeOpenApi.IDocument;
    prepares: AutoBeTestPrepareFunction[];
    writeProgress: AutoBeProgressEventBase;
    validateProgress: AutoBeProgressEventBase;
  },
): Promise<AutoBeTestGenerateFunction[]> {
  const compile = async (procedure: IAutoBeTestGenerateProcedure) =>
    AutoBeTestGenerateProgrammer.compile({
      compiler: await ctx.compiler(),
      step: ctx.state().analyze?.step ?? 0,
      progress: props.validateProgress,
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
  props.validateProgress.total += procedures.length;

  procedures = await orchestrateTestCorrectCasting(ctx, {
    programmer: {
      compile,
      replaceImportStatements,
      asynchronous: true,
    },
    procedures,
    progress: props.validateProgress,
  });
  return procedures.map((p) => p.function);
}

import {
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeTestPrepareFunction,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";

import { AutoBeContext } from "../../context/AutoBeContext";
import { orchestrateTestCorrectCasting } from "./internal/orchestrateTestCorrectCasting";
import { orchestrateTestCorrectOverall } from "./internal/orchestrateTestCorrectOverall";
import { orchestrateTestPrepareWrite } from "./orchestrateTestPrepareWrite";
import { AutoBeTestPrepareProgrammer } from "./programmers/AutoBeTestPrepareProgrammer";
import { IAutoBeTestPrepareProcedure } from "./structures/IAutoBeTestPrepareProcedure";

export async function orchestrateTestPrepare<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    instruction: string;
    document: AutoBeOpenApi.IDocument;
    writeProgress: AutoBeProgressEventBase;
    correctProgress: AutoBeProgressEventBase;
  },
): Promise<AutoBeTestPrepareFunction[]> {
  const compile = async (procedure: IAutoBeTestPrepareProcedure) =>
    AutoBeTestPrepareProgrammer.compile({
      compiler: await ctx.compiler(),
      document: props.document,
      procedure,
      step: ctx.state().analyze?.step ?? 0,
    });
  const replaceImportStatements = async (
    procedure: IAutoBeTestPrepareProcedure,
  ) =>
    AutoBeTestPrepareProgrammer.replaceImportStatements({
      compiler: await ctx.compiler(),
      typeName: procedure.typeName,
      schemas: props.document.components.schemas,
      content: procedure.function.content,
    });

  let procedures: IAutoBeTestPrepareProcedure[] =
    await orchestrateTestPrepareWrite(ctx, {
      instruction: props.instruction,
      document: props.document,
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
  procedures = await orchestrateTestCorrectOverall(ctx, {
    programmer: {
      compile,
      replaceImportStatements,
    },
    procedures,
    instruction: props.instruction,
    progress: props.correctProgress,
  });
  return procedures.map((p) => p.function);
}

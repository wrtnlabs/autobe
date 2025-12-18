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
  let procedures: IAutoBeTestGenerateProcedure[] =
    await orchestrateTestGenerateWrite(ctx, {
      instruction: props.instruction,
      document: props.document,
      prepares: props.prepares,
    });
  procedures = await orchestrateTestCorrectCasting(ctx, {
    programmer: {},
    procedures,
  });
  procedures = await orchestrateTestCorrectRequest(ctx, {
    programmer: {},
    instruction: props.instruction,
    progress: props.correctProgress,
    procedures,
  });
  procedures = await orchestrateTestCorrectOverall(ctx, {
    programmer: {},
    procedures,
    instruction: props.instruction,
  });
  return procedures.map((p) => p.function);
}

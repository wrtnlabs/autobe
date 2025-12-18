import {
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeTestGenerateFunction,
  AutoBeTestPrepareFunction,
  AutoBeTestValidateEvent,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";

import { AutoBeContext } from "../../context/AutoBeContext";
import { orchestrateTestCorrectCasting } from "./internal/orchestrateTestCorrectCasting";
import { orchestrateTestCorrectOverall } from "./internal/orchestrateTestCorrectOverall";
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
): Promise<AutoBeTestValidateEvent<AutoBeTestGenerateFunction>[]> {
  const procedures: IAutoBeTestGenerateProcedure[] =
    await orchestrateTestGenerateWrite(ctx, {
      instruction: props.instruction,
      document: props.document,
      prepares: props.prepares,
    });
  await orchestrateTestCorrectCasting(ctx, {
    programmer: {},
    procedures,
  });
  return await orchestrateTestCorrectOverall(ctx, {
    programmer: {},
    procedures,
    instruction: props.instruction,
  });
}

import {
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeTestAuthorizeFunction,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";

import { AutoBeContext } from "../../context/AutoBeContext";
import { orchestrateTestCorrectCasting } from "./internal/orchestrateTestCorrectCasting";
import { orchestrateTestCorrectOverall } from "./internal/orchestrateTestCorrectOverall";
import { orchestrateTestCorrectRequest } from "./internal/orchestrateTestCorrectRequest";
import { orchestrateTestAuthorizeWrite } from "./orchestrateTestAuthorizeWrite";
import { IAutoBeTestAuthorizeProcedure } from "./structures/IAutoBeTestAuthorizeWriteResult";

export async function orchestrateTestAuthorize<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    instruction: string;
    document: AutoBeOpenApi.IDocument;
    writeProgress: AutoBeProgressEventBase;
    correctProgress: AutoBeProgressEventBase;
  },
): Promise<AutoBeTestAuthorizeFunction[]> {
  let procedures: IAutoBeTestAuthorizeProcedure[] =
    await orchestrateTestAuthorizeWrite(ctx, {
      instruction: props.instruction,
      document: props.document,
      progress: props.writeProgress,
    });
  procedures = await orchestrateTestCorrectCasting(ctx, {
    programmer: {},
    procedures,
    progress: props.correctProgress,
  });
  procedures = await orchestrateTestCorrectRequest(ctx, {
    programmer: {},
    instruction: props.instruction,
    procedures,
    progress: props.correctProgress,
  });
  procedures = await orchestrateTestCorrectOverall(ctx, {
    programmer: {},
    instruction: props.instruction,
    procedures,
    progress: props.correctProgress,
  });
  return procedures.map((p) => p.function);
}

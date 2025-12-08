import {
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeRealizeTransformerFunction,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";

import { AutoBeContext } from "../../context/AutoBeContext";
import { orchestrateRealizeCorrectCasting } from "./internal/orchestrateRealizeCorrectCasting";
import { AutoBeRealizeTransformerProgrammer } from "./programmers/AutoBeRealizeTransformerProgrammer";

export const orchestrateRealizeTransformerCorrectCasting = <
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  props: {
    functions: AutoBeRealizeTransformerFunction[];
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeRealizeTransformerFunction[]> =>
  orchestrateRealizeCorrectCasting(ctx, {
    programmer: {
      template: (func) =>
        AutoBeRealizeTransformerProgrammer.writeTemplate({
          plan: func.plan,
          schema: ctx.state().interface!.document.components.schemas[
            func.plan.dtoTypeName
          ] as AutoBeOpenApi.IJsonSchemaDescriptive.IObject,
        }),
      replaceImportStatements: (next) =>
        AutoBeRealizeTransformerProgrammer.replaceImportStatements(ctx, {
          dtoTypeName: next.function.plan.dtoTypeName,
          schemas: ctx.state().interface!.document.components.schemas,
          code: next.code,
        }),
      additional: () => ({}),
      location: "src/transformers",
    },
    functions: props.functions,
    progress: props.progress,
  });

import {
  AutoBeProgressEventBase,
  AutoBeRealizeCollectorFunction,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";

import { AutoBeContext } from "../../context/AutoBeContext";
import { orchestrateRealizeCorrectCasting } from "./internal/orchestrateRealizeCorrectCasting";
import { AutoBeRealizeCollectorProgrammer } from "./programmers/AutoBeRealizeCollectorProgrammer";

export const orchestrateRealizeCollectorCorrectCasting = <
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  props: {
    functions: AutoBeRealizeCollectorFunction[];
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeRealizeCollectorFunction[]> =>
  orchestrateRealizeCorrectCasting(ctx, {
    programmer: {
      template: (func) =>
        AutoBeRealizeCollectorProgrammer.writeTemplate({
          plan: func.plan,
          body: ctx.state().interface!.document.components.schemas[
            func.plan.dtoTypeName
          ],
          model: ctx
            .state()
            .prisma!.result.data.files.map((f) => f.models)
            .flat()
            .find((m) => m.name === func.plan.prismaSchemaName)!,
          application: ctx.state().prisma!.result.data,
        }),
      replaceImportStatements: (next) =>
        AutoBeRealizeCollectorProgrammer.replaceImportStatements(ctx, {
          dtoTypeName: next.function.plan.dtoTypeName,
          schemas: ctx.state().interface!.document.components.schemas,
          code: next.code,
        }),
      additional: () => ({}),
      location: "src/collectors",
    },
    functions: props.functions,
    progress: props.progress,
  });

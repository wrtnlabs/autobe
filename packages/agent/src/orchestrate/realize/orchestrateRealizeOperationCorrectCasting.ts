import {
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeRealizeAuthorization,
  AutoBeRealizeCollectorFunction,
  AutoBeRealizeOperationFunction,
  AutoBeRealizeTransformerFunction,
} from "@autobe/interface";

import { AutoBeContext } from "../../context/AutoBeContext";
import { orchestrateRealizeCorrectCasting } from "./internal/orchestrateRealizeCorrectCasting";
import { AutoBeRealizeOperationProgrammer } from "./programmers/AutoBeRealizeOperationProgrammer";
import { IAutoBeRealizeScenarioResult } from "./structures/IAutoBeRealizeScenarioResult";

export const orchestrateRealizeOperationCorrectCasting = async (
  ctx: AutoBeContext,
  props: {
    authorizations: AutoBeRealizeAuthorization[];
    collectors: AutoBeRealizeCollectorFunction[];
    transformers: AutoBeRealizeTransformerFunction[];
    functions: AutoBeRealizeOperationFunction[];
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeRealizeOperationFunction[]> => {
  const document: AutoBeOpenApi.IDocument = ctx.state().interface!.document;
  return await orchestrateRealizeCorrectCasting(ctx, {
    programmer: {
      template: (func) =>
        AutoBeRealizeOperationProgrammer.writeTemplate({
          authorizations: props.authorizations,
          schemas: document.components.schemas,
          operation: document.operations.find(
            (o) =>
              o.method === func.endpoint.method &&
              o.path === func.endpoint.path,
          )!,
        }),
      replaceImportStatements: async (next) => {
        const scenario: IAutoBeRealizeScenarioResult =
          AutoBeRealizeOperationProgrammer.getScenario({
            authorizations: props.authorizations,
            operation: document.operations.find(
              (o) =>
                o.method === next.function.endpoint.method &&
                o.path === next.function.endpoint.path,
            )!,
          });
        return await AutoBeRealizeOperationProgrammer.replaceImportStatements(
          ctx,
          {
            operation: scenario.operation,
            schemas: document.components.schemas,
            code: next.code,
            payload: scenario.decoratorEvent?.payload.name,
          },
        );
      },
      additional: () =>
        AutoBeRealizeOperationProgrammer.getAdditional({
          authorizations: props.authorizations,
          collectors: props.collectors,
          transformers: props.transformers,
        }),
      location: "src/providers",
    },
    functions: props.functions,
    progress: props.progress,
  });
};

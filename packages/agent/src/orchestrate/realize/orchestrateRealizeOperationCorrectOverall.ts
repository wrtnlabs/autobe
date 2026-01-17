import {
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeRealizeAuthorization,
  AutoBeRealizeCollectorFunction,
  AutoBeRealizeOperationFunction,
  AutoBeRealizeTransformerFunction,
} from "@autobe/interface";
import { ILlmApplication, IValidation } from "@samchon/openapi";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { validateEmptyCode } from "../../utils/validateEmptyCode";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformRealizeOperationCorrectHistory } from "./histories/transformRealizeOperationCorrectHistory";
import { orchestrateRealizeCorrectOverall } from "./internal/orchestrateRealizeCorrectOverall";
import { AutoBeRealizeOperationProgrammer } from "./programmers/AutoBeRealizeOperationProgrammer";
import { IAutoBeRealizeOperationCorrectApplication } from "./structures/IAutoBeRealizeOperationCorrectApplication";
import { IAutoBeRealizeScenarioResult } from "./structures/IAutoBeRealizeScenarioResult";

export const orchestrateRealizeOperationCorrectOverall = async (
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
  return await orchestrateRealizeCorrectOverall(ctx, {
    programmer: {
      location: "src/providers",
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
      preliminary: (next) =>
        new AutoBePreliminaryController({
          source: next.source,
          application:
            typia.json.application<IAutoBeRealizeOperationCorrectApplication>(),
          kinds: [
            "databaseSchemas",
            "realizeCollectors",
            "realizeTransformers",
          ],
          state: ctx.state(),
          all: {
            realizeCollectors: props.collectors,
            realizeTransformers: props.transformers,
          },
        }),
      histories: async (next) => {
        const operation: AutoBeOpenApi.IOperation = document.operations.find(
          (o) =>
            o.method === next.function.endpoint.method &&
            o.path === next.function.endpoint.path,
        )!;
        const dto: Record<string, string> =
          await AutoBeRealizeOperationProgrammer.writeStructures(
            ctx,
            operation,
          );
        return transformRealizeOperationCorrectHistory({
          state: ctx.state(),
          authorizations: props.authorizations,
          function: next.function,
          preliminary: next.preliminary,
          dto,
          failures: next.failures,
        });
      },
      controller: (next) => {
        const validate: Validator = (input) => {
          const result: IValidation<IAutoBeRealizeOperationCorrectApplication.IProps> =
            typia.validate<IAutoBeRealizeOperationCorrectApplication.IProps>(
              input,
            );
          if (result.success === false) return result;
          else if (result.data.request.type !== "complete")
            return next.preliminary.validate({
              thinking: result.data.thinking,
              request: result.data.request,
            });
          const errors: IValidation.IError[] = validateEmptyCode({
            name: next.function.name,
            draft: result.data.request.draft,
            revise: result.data.request.revise,
            path: "$input.request",
            asynchronous: true,
          });
          return errors.length
            ? {
                success: false,
                errors,
                data: result.data,
              }
            : result;
        };

        const application: ILlmApplication = next.preliminary.fixApplication(
          typia.llm.application<IAutoBeRealizeOperationCorrectApplication>({
            validate: {
              process: validate,
            },
          }),
        );

        return {
          protocol: "class",
          name: next.source,
          application,
          execute: {
            process: (v) => {
              if (v.request.type === "complete") next.build(v.request);
            },
          } satisfies IAutoBeRealizeOperationCorrectApplication,
        };
      },
    },
    functions: props.functions,
    progress: props.progress,
  });
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeRealizeOperationCorrectApplication.IProps>;

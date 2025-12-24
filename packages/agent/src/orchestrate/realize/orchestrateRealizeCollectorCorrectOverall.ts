import {
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeRealizeCollectorFunction,
} from "@autobe/interface";
import { AutoBeOpenApiTypeChecker } from "@autobe/utils";
import { ILlmApplication, IValidation } from "@samchon/openapi";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformRealizeCollectorCorrectHistory } from "./histories/transformRealizeCollectorCorrectHistory";
import { orchestrateRealizeCorrectOverall } from "./internal/orchestrateRealizeCorrectOverall";
import { AutoBeRealizeCollectorProgrammer } from "./programmers/AutoBeRealizeCollectorProgrammer";
import { IAutoBeRealizeCollectorCorrectApplication } from "./structures/IAutoBeRealizeCollectorCorrectApplication";

export const orchestrateRealizeCollectorCorrectOverall = async (
  ctx: AutoBeContext,
  props: {
    functions: AutoBeRealizeCollectorFunction[];
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeRealizeCollectorFunction[]> => {
  const document: AutoBeOpenApi.IDocument = ctx.state().interface!.document;
  const getNeighbors = (
    func: AutoBeRealizeCollectorFunction,
  ): AutoBeRealizeCollectorFunction[] => {
    const visited: Set<string> = new Set();
    AutoBeOpenApiTypeChecker.visit({
      components: document.components,
      schema: { $ref: `#/components/schemas/${func.plan.dtoTypeName}` },
      closure: (next) => {
        if (AutoBeOpenApiTypeChecker.isReference(next)) {
          const key: string = next.$ref.split("/").pop()!;
          visited.add(key);
        }
      },
    });
    return props.functions.filter(
      (y) =>
        y.plan.dtoTypeName !== func.plan.dtoTypeName &&
        visited.has(y.plan.dtoTypeName),
    );
  };
  return await orchestrateRealizeCorrectOverall(ctx, {
    programmer: {
      location: "src/collectors",

      // Replace import statements using Collector-specific programmer
      replaceImportStatements: async (next) => {
        return await AutoBeRealizeCollectorProgrammer.replaceImportStatements(
          ctx,
          {
            dtoTypeName: next.function.plan.dtoTypeName,
            schemas: document.components.schemas,
            code: next.code,
          },
        );
      },

      // No additional files needed for collectors (unlike operations)
      additional: (_functions) => ({}),

      // Create preliminary controller with only prismaSchemas support
      preliminary: (next) =>
        new AutoBePreliminaryController<"prismaSchemas">({
          source: next.source,
          application:
            typia.json.application<IAutoBeRealizeCollectorCorrectApplication>(),
          kinds: ["prismaSchemas"],
          state: ctx.state(),
          local: {
            prismaSchemas: ctx
              .state()
              .prisma!.result.data.files.map((f) => f.models)
              .flat()
              .filter((m) => m.name === next.function.plan.prismaSchemaName),
          },
        }),

      // Transform history using Collector-specific transformer
      histories: (next) =>
        transformRealizeCollectorCorrectHistory(ctx, {
          function: next.function,
          neighbors: getNeighbors(next.function),
          failures: next.failures,
          preliminary: next.preliminary,
        }),

      // Create controller with Collector-specific validation
      controller: (next) => {
        const validate: Validator = (input) => {
          const result: IValidation<IAutoBeRealizeCollectorCorrectApplication.IProps> =
            typia.validate<IAutoBeRealizeCollectorCorrectApplication.IProps>(
              input,
            );
          if (result.success === false) return result;
          else if (result.data.request.type !== "complete")
            return next.preliminary.validate({
              thinking: result.data.thinking,
              request: result.data.request,
            });

          // Validate collector-specific constraints
          const errors: IValidation.IError[] =
            AutoBeRealizeCollectorProgrammer.validate({
              plan: next.function.plan,
              mappings: result.data.request.mappings,
              neighbors: props.functions.map((f) => f.plan),
              draft: result.data.request.draft,
              revise: result.data.request.revise,
              application: ctx.state().prisma!.result.data,
            });
          return errors.length
            ? {
                success: false,
                errors,
                data: result.data,
              }
            : result;
        };

        const application: ILlmApplication =
          typia.llm.application<IAutoBeRealizeCollectorCorrectApplication>({
            validate: {
              process: validate,
            },
          });

        return {
          protocol: "class",
          name: next.source,
          application,
          execute: {
            process: (v) => {
              if (v.request.type === "complete") next.build(v.request);
            },
          } satisfies IAutoBeRealizeCollectorCorrectApplication,
        };
      },
    },
    functions: props.functions,
    progress: props.progress,
  });
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeRealizeCollectorCorrectApplication.IProps>;

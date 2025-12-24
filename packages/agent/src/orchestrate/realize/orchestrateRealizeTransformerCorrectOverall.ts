import {
  AutoBeOpenApi,
  AutoBePrisma,
  AutoBeProgressEventBase,
  AutoBeRealizeTransformerFunction,
} from "@autobe/interface";
import { AutoBeOpenApiTypeChecker } from "@autobe/utils";
import { ILlmApplication, IValidation } from "@samchon/openapi";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformRealizeTransformerCorrectHistory } from "./histories/transformRealizeTransformerCorrectHistory";
import { orchestrateRealizeCorrectOverall } from "./internal/orchestrateRealizeCorrectOverall";
import { AutoBeRealizeTransformerProgrammer } from "./programmers/AutoBeRealizeTransformerProgrammer";
import { IAutoBeRealizeTransformerCorrectApplication } from "./structures/IAutoBeRealizeTransformerCorrectApplication";

export const orchestrateRealizeTransformerCorrectOverall = async (
  ctx: AutoBeContext,
  props: {
    functions: AutoBeRealizeTransformerFunction[];
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeRealizeTransformerFunction[]> => {
  const prismaApplication: AutoBePrisma.IApplication =
    ctx.state().prisma!.result.data;
  const document: AutoBeOpenApi.IDocument = ctx.state().interface!.document;
  const getNeighbors = (
    func: AutoBeRealizeTransformerFunction,
  ): AutoBeRealizeTransformerFunction[] => {
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
      location: "src/transformers",

      // Replace import statements using Transformer-specific programmer
      replaceImportStatements: async (next) => {
        return await AutoBeRealizeTransformerProgrammer.replaceImportStatements(
          ctx,
          {
            dtoTypeName: next.function.plan.dtoTypeName,
            schemas: document.components.schemas,
            code: next.code,
          },
        );
      },

      // No additional files needed for transformers (unlike operations)
      additional: (_functions) => ({}),

      // Create preliminary controller with only prismaSchemas support
      preliminary: (next) =>
        new AutoBePreliminaryController<"prismaSchemas">({
          source: next.source,
          application:
            typia.json.application<IAutoBeRealizeTransformerCorrectApplication>(),
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

      // Transform history using Transformer-specific transformer
      histories: (next) =>
        transformRealizeTransformerCorrectHistory(ctx, {
          function: next.function,
          neighbors: getNeighbors(next.function),
          failures: next.failures,
          preliminary: next.preliminary,
        }),

      // Create controller with Transformer-specific validation
      controller: (next) => {
        const validate: Validator = (input) => {
          const result: IValidation<IAutoBeRealizeTransformerCorrectApplication.IProps> =
            typia.validate<IAutoBeRealizeTransformerCorrectApplication.IProps>(
              input,
            );
          if (result.success === false) return result;
          else if (result.data.request.type !== "complete")
            return next.preliminary.validate({
              thinking: result.data.thinking,
              request: result.data.request,
            });

          // Validate transformer-specific constraints
          const errors: IValidation.IError[] =
            AutoBeRealizeTransformerProgrammer.validate({
              application: prismaApplication,
              document,
              plan: next.function.plan,
              neighbors: props.functions.map((f) => f.plan),
              transformMappings: result.data.request.transformMappings,
              selectMappings: result.data.request.selectMappings,
              draft: result.data.request.draft,
              revise: result.data.request.revise,
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
          typia.llm.application<IAutoBeRealizeTransformerCorrectApplication>({
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
          } satisfies IAutoBeRealizeTransformerCorrectApplication,
        };
      },
    },
    functions: props.functions,
    progress: props.progress,
  });
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeRealizeTransformerCorrectApplication.IProps>;

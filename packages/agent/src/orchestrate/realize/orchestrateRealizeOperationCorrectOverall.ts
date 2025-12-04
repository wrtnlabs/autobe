import {
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeRealizeAuthorization,
  AutoBeRealizeCollectorFunction,
  AutoBeRealizeOperationFunction,
  AutoBeRealizeTransformerFunction,
} from "@autobe/interface";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { validateEmptyCode } from "../../utils/validateEmptyCode";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { complementPreliminaryCollection } from "../common/internal/complementPreliminaryCollection";
import { IAutoBePreliminaryCollection } from "../common/structures/IAutoBePreliminaryCollection";
import { transformRealizeOperationCorrectHistory } from "./histories/transformRealizeOperationCorrectHistory";
import { orchestrateRealizeCorrectOverall } from "./internal/orchestrateRealizeCorrectOverall";
import { AutoBeRealizeOperationProgrammer } from "./programmers/AutoBeRealizeOperationProgrammer";
import { IAutoBeRealizeOperationCorrectApplication } from "./structures/IAutoBeRealizeOperationCorrectApplication";
import { IAutoBeRealizeScenarioResult } from "./structures/IAutoBeRealizeScenarioResult";

export const orchestrateRealizeOperationCorrectOverall = async <
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
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
      additional: (functions) =>
        AutoBeRealizeOperationProgrammer.getAdditional({
          authorizations: props.authorizations,
          collectors: props.collectors,
          transformers: props.transformers,
          functions,
        }),
      preliminary: (next) => {
        const preliminary: AutoBePreliminaryController<
          "prismaSchemas" | "realizeCollectors" | "realizeTransformers"
        > = new AutoBePreliminaryController({
          source: next.source,
          application:
            typia.json.application<IAutoBeRealizeOperationCorrectApplication>(),
          kinds: ["prismaSchemas", "realizeCollectors", "realizeTransformers"],
          state: ctx.state(),
          all: {
            prismaSchemas: ctx
              .state()
              .prisma!.result.data.files.map((f) => f.models)
              .flat(),
            realizeCollectors: props.collectors,
            realizeTransformers: props.transformers,
          },
        });
        const document: AutoBeOpenApi.IDocument =
          ctx.state().interface!.document;
        const operation: AutoBeOpenApi.IOperation = document.operations.find(
          (o) =>
            o.method === next.function.endpoint.method &&
            o.path === next.function.endpoint.path,
        )!;
        complementPreliminaryCollection({
          kinds: [
            "prismaSchemas",
            "interfaceOperations",
            "interfaceSchemas",
            "realizeCollectors",
            "realizeTransformers",
          ],
          all: {
            ...preliminary.getAll(),
            interfaceOperations: document.operations,
            interfaceSchemas: document.components.schemas,
          } as IAutoBePreliminaryCollection,
          local: {
            ...(preliminary.getLocal() as IAutoBePreliminaryCollection),
            interfaceOperations: [operation],
            interfaceSchemas: {},
          },
        });
        return preliminary;
      },
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
        assertSchemaModel(next.model);
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
            functionName: next.function.name,
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
        const application: ILlmApplication<Model> = collection[
          next.model === "chatgpt"
            ? "chatgpt"
            : next.model === "gemini"
              ? "gemini"
              : "claude"
        ](
          validate,
        ) satisfies ILlmApplication<any> as unknown as ILlmApplication<Model>;
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

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<IAutoBeRealizeOperationCorrectApplication, "chatgpt">(
      {
        validate: {
          process: validate,
        },
      },
    ),
  claude: (validate: Validator) =>
    typia.llm.application<IAutoBeRealizeOperationCorrectApplication, "claude">({
      validate: {
        process: validate,
      },
    }),
  gemini: (validate: Validator) =>
    typia.llm.application<IAutoBeRealizeOperationCorrectApplication, "gemini">({
      validate: {
        process: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeRealizeOperationCorrectApplication.IProps>;

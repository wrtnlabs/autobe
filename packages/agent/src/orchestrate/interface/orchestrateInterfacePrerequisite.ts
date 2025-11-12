import { IAgenticaController } from "@agentica/core";
import {
  AutoBeEventSource,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { AutoBeInterfacePrerequisite } from "@autobe/interface/src/histories/contents/AutoBeInterfacePrerequisite";
import { AutoBeOpenApiEndpointComparator } from "@autobe/utils";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { HashMap, IPointer, Pair } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeConfigConstant } from "../../constants/AutoBeConfigConstant";
import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { divideArray } from "../../utils/divideArray";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformInterfacePrerequisiteHistory } from "./histories/transformInterfacePrerequisiteHistory";
import { IAutoBeInterfacePrerequisiteApplication } from "./structures/IAutoBeInterfacePrerequisiteApplication";

export async function orchestrateInterfacePrerequisite<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  document: AutoBeOpenApi.IDocument,
): Promise<AutoBeInterfacePrerequisite[]> {
  const operations: AutoBeOpenApi.IOperation[] =
    document.operations.filter((op) => op.authorizationType === null) ?? [];
  const progress: AutoBeProgressEventBase = {
    total: operations.length,
    completed: 0,
  };
  const prerequisiteOperations: AutoBeOpenApi.IOperation[] =
    document.operations.filter(
      (op) => op.authorizationType === null && op.method === "post",
    );

  const dict: HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation> =
    new HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation>(
      prerequisiteOperations.map(
        (op) => new Pair({ path: op.path, method: op.method }, op),
      ),
      AutoBeOpenApiEndpointComparator.hashCode,
      AutoBeOpenApiEndpointComparator.equals,
    );

  const prerequisitesNotFound: string = [
    `You have to select one of the endpoints below`,
    "",
    " method | path ",
    "--------|------",
    ...prerequisiteOperations
      .map((op) => `\`${op.method}\` | \`${op.path}\``)
      .join("\n"),
  ].join("\n");

  const exclude: AutoBeInterfacePrerequisite[] = [];
  let include: AutoBeOpenApi.IOperation[] = [...operations];
  let trial: number = 0;

  do {
    const matrix: AutoBeOpenApi.IOperation[][] = divideArray({
      array: include,
      capacity: AutoBeConfigConstant.INTERFACE_CAPACITY,
    });
    await executeCachedBatch(
      matrix.map((ops) => async (promptCacheKey) => {
        const row: AutoBeInterfacePrerequisite[] = await divideAndConquer(ctx, {
          dict: dict,
          document,
          includes: ops,
          progress,
          promptCacheKey,
          prerequisitesNotFound,
        });
        exclude.push(...row);
        return row;
      }),
    );
    include = include.filter((op) => {
      if (
        exclude.some(
          (el) =>
            el.endpoint.method === op.method && el.endpoint.path === op.path,
        )
      ) {
        return false;
      }
      return true;
    });
  } while (include.length > 0 && ++trial < ctx.retry);
  return exclude;
}

async function divideAndConquer<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    dict: HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation>;
    document: AutoBeOpenApi.IDocument;
    includes: AutoBeOpenApi.IOperation[];
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
    prerequisitesNotFound: string;
  },
): Promise<AutoBeInterfacePrerequisite[]> {
  try {
    return await process(ctx, props);
  } catch {
    props.progress.completed += props.includes.length;
    return [];
  }
}

async function process<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    dict: HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation>;
    document: AutoBeOpenApi.IDocument;
    includes: AutoBeOpenApi.IOperation[];
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
    prerequisitesNotFound: string;
  },
): Promise<AutoBeInterfacePrerequisite[]> {
  const preliminary: AutoBePreliminaryController<
    | "analyzeFiles"
    | "prismaSchemas"
    | "interfaceOperations"
    | "interfaceSchemas"
  > = new AutoBePreliminaryController({
    functions: typia.json
      .application<IAutoBeInterfacePrerequisiteApplication>()
      .functions.map((f) => f.name),
    source: "interfacePrerequisite",
    kinds: [
      "analyzeFiles",
      "prismaSchemas",
      "interfaceOperations",
      "interfaceSchemas",
    ],
    state: ctx.state(),
  });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<AutoBeInterfacePrerequisite[] | null> = {
      value: null,
    };
    const result: AutoBeContext.IResult<Model> = await ctx.conversate({
      source: "interfacePrerequisite",
      controller: createController({
        model: ctx.model,
        document: props.document,
        dict: props.dict,
        includes: props.includes,
        prerequisitesNotFound: props.prerequisitesNotFound,
        preliminary,
        build: (next) => {
          pointer.value = next;
        },
      }),
      enforceFunctionCall: true,
      promptCacheKey: props.promptCacheKey,
      ...transformInterfacePrerequisiteHistory({
        document: props.document,
        includes: props.includes,
        preliminary,
      }),
    });
    if (pointer.value !== null) {
      props.progress.completed += pointer.value.length;
      ctx.dispatch({
        type: "interfacePrerequisite",
        id: v7(),
        created_at: new Date().toISOString(),
        metric: result.metric,
        tokenUsage: result.tokenUsage,
        operations: pointer.value,
        total: props.progress.total,
        completed: props.progress.completed,
        step: ctx.state().prisma?.step ?? 0,
      });
      return out(result)(pointer.value);
    }
    return out(result)(null);
  });
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  document: AutoBeOpenApi.IDocument;
  dict: HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation>;
  includes: AutoBeOpenApi.IOperation[];
  prerequisitesNotFound: string;
  preliminary: AutoBePreliminaryController<
    | "analyzeFiles"
    | "prismaSchemas"
    | "interfaceOperations"
    | "interfaceSchemas"
  >;
  build: (next: AutoBeInterfacePrerequisite[]) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const validate = (
    next: unknown,
  ): IValidation<IAutoBeInterfacePrerequisiteApplication.IProps> => {
    const result: IValidation<IAutoBeInterfacePrerequisiteApplication.IProps> =
      typia.validate<IAutoBeInterfacePrerequisiteApplication.IProps>(next);
    if (result.success === false) return result;

    const operations: AutoBeInterfacePrerequisite[] = result.data.operations;
    const filteredOperations: AutoBeInterfacePrerequisite[] = [];
    const errors: IValidation.IError[] = [];

    props.includes.forEach((el) => {
      // Find the matched operation in the includes
      const matched: AutoBeInterfacePrerequisite | undefined = operations.find(
        (op) =>
          op.endpoint.method === el.method && op.endpoint.path === el.path,
      );

      // Remove duplicate operations in Prerequisites
      if (matched) {
        const prerequisites: Map<string, AutoBeOpenApi.IPrerequisite> =
          new Map();
        matched.prerequisites.forEach((op) => {
          if (
            prerequisites.get(op.endpoint.method + op.endpoint.path) !==
            undefined
          ) {
            return;
          }
          prerequisites.set(op.endpoint.method + op.endpoint.path, op);
        });
        matched.prerequisites = Array.from(prerequisites.values());
        filteredOperations.push(matched);
      }
    });

    filteredOperations.forEach((op, i) => {
      op.prerequisites.forEach((p, j) => {
        if (props.dict.has(p.endpoint) === false) {
          errors.push({
            value: p.endpoint,
            path: `$input.operations[${i}].prerequisites[${j}].endpoint`,
            expected: "AutoBeOpenApi.IEndpoint",
            description: props.prerequisitesNotFound,
          });
        }

        if (
          p.endpoint.method === op.endpoint.method &&
          p.endpoint.path === op.endpoint.path
        ) {
          errors.push({
            value: p.endpoint,
            path: `$input.operations[${i}].prerequisites[${j}].endpoint`,
            expected: "AutoBeOpenApi.IEndpoint",
            description: "Self-reference is not allowed.",
          });
        }
      });
    });

    return errors.length === 0
      ? {
          ...result,
          data: {
            ...result.data,
            operations: filteredOperations,
          },
        }
      : {
          success: false,
          data: {
            ...result.data,
            operations: filteredOperations,
          },
          errors,
        };
  };

  const application: ILlmApplication<Model> = collection[
    props.model === "chatgpt"
      ? "chatgpt"
      : props.model === "gemini"
        ? "gemini"
        : "claude"
  ]({
    preliminary: props.preliminary,
    validate,
  }) satisfies ILlmApplication<any> as unknown as ILlmApplication<Model>;
  return {
    protocol: "class",
    name: "interfacePrerequisite" satisfies AutoBeEventSource,
    application,
    execute: {
      makePrerequisite: (next) => {
        props.build(next.operations);
      },
      analyzeFiles: () => {},
      prismaSchemas: () => {},
      interfaceOperations: () => {},
      interfaceSchemas: () => {},
    } satisfies IAutoBeInterfacePrerequisiteApplication,
  };
}

const collection = {
  chatgpt: (props: CustomValidateProps) =>
    typia.llm.application<IAutoBeInterfacePrerequisiteApplication, "chatgpt">({
      validate: {
        makePrerequisite: props.validate,
        ...props.preliminary.createValidate(),
      },
    }),
  claude: (props: CustomValidateProps) =>
    typia.llm.application<IAutoBeInterfacePrerequisiteApplication, "claude">({
      validate: {
        makePrerequisite: props.validate,
        ...props.preliminary.createValidate(),
      },
    }),
  gemini: (props: CustomValidateProps) =>
    typia.llm.application<IAutoBeInterfacePrerequisiteApplication, "gemini">({
      validate: {
        makePrerequisite: props.validate,
        ...props.preliminary.createValidate(),
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeInterfacePrerequisiteApplication.IProps>;

interface CustomValidateProps {
  validate: Validator;
  preliminary: AutoBePreliminaryController<
    | "analyzeFiles"
    | "prismaSchemas"
    | "interfaceOperations"
    | "interfaceSchemas"
  >;
}

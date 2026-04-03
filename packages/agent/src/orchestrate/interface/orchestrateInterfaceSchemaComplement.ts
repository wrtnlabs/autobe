import { IAgenticaController } from "@agentica/core";
import {
  AutoBeDatabase,
  AutoBeEventSource,
  AutoBeInterfaceSchemaComplementEvent,
  AutoBeInterfaceSchemaDesign,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { AutoBeOpenApiTypeChecker, missedOpenApiSchemas } from "@autobe/utils";
import { IPointer } from "tstl";
import typia, { ILlmApplication, ILlmSchema, IValidation } from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { buildAnalysisContextSections } from "../../utils/RAGRetrieval";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { getEmbedder } from "../../utils/getEmbedder";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { convertToSectionEntries } from "../common/internal/convertToSectionEntries";
import { IAnalysisSectionEntry } from "../common/structures/IAnalysisSectionEntry";
import { transformInterfaceSchemaComplementHistory } from "./histories/transformInterfaceSchemaComplementHistory";
import { AutoBeInterfaceSchemaProgrammer } from "./programmers/AutoBeInterfaceSchemaProgrammer";
import { IAutoBeInterfaceSchemaComplementApplication } from "./structures/IAutoBeInterfaceSchemaComplementApplication";
import { AutoBeJsonSchemaFactory } from "./utils/AutoBeJsonSchemaFactory";
import { AutoBeJsonSchemaValidator } from "./utils/AutoBeJsonSchemaValidator";
import { fulfillJsonSchemaErrorMessages } from "./utils/fulfillJsonSchemaErrorMessages";

export const orchestrateInterfaceSchemaComplement = async (
  ctx: AutoBeContext,
  props: {
    instruction: string;
    document: AutoBeOpenApi.IDocument;
    failures: Map<string, number>;
    progress: AutoBeProgressEventBase;
  },
): Promise<Record<string, AutoBeOpenApi.IJsonSchema>> => {
  const typeNames: string[] = missedOpenApiSchemas(props.document).filter(
    (k) => AutoBeJsonSchemaValidator.isPreset(k) === false,
  );
  if (typeNames.length === 0) return {};
  props.progress.total += typeNames.length;

  const result: Record<string, AutoBeOpenApi.IJsonSchema> = {};
  await executeCachedBatch(
    ctx,
    typeNames.map((it) => async (promptCacheKey) => {
      try {
        result[it] = await process(ctx, {
          instruction: props.instruction,
          document: props.document,
          typeName: it,
          progress: props.progress,
          promptCacheKey,
        });
      } catch (error) {
        --props.progress.total;
        console.log("interfaceSchemaComplement failure", it, error);
        const count: number | undefined = props.failures.get(it);
        if (count === undefined) props.failures.set(it, 1);
        else if (count < 3) props.failures.set(it, count + 1);
        else throw error;
      }
    }),
  );
  return result;
};

async function process(
  ctx: AutoBeContext,
  props: {
    instruction: string;
    document: AutoBeOpenApi.IDocument;
    typeName: string;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
  },
): Promise<AutoBeOpenApi.IJsonSchema> {
  const allSections: IAnalysisSectionEntry[] = convertToSectionEntries(
    ctx.state().analyze?.files ?? [],
  );
  const relatedOp = props.document.operations.find(
    (o) =>
      o.requestBody?.typeName === props.typeName ||
      o.responseBody?.typeName === props.typeName,
  );

  const opHint = relatedOp ? `${relatedOp.method} ${relatedOp.path}` : "";

  const task = props.instruction.replace(/\s+/g, " ").trim().slice(0, 200);

  const queryText: string = `
Type: ${props.typeName}
Ops: ${opHint || "N/A"}
Task: ${task}
`.trim();

  const ragSections: IAnalysisSectionEntry[] =
    await buildAnalysisContextSections(
      getEmbedder(),
      allSections,
      queryText,
      "TOPK",
      { log: false, logPrefix: "interfaceComplement" },
    );

  const preliminary: AutoBePreliminaryController<
    | "analysisSections"
    | "databaseSchemas"
    | "interfaceOperations"
    | "interfaceSchemas"
    | "previousAnalysisSections"
    | "previousDatabaseSchemas"
    | "previousInterfaceSchemas"
    | "previousInterfaceOperations"
  > = new AutoBePreliminaryController({
    application:
      typia.json.application<IAutoBeInterfaceSchemaComplementApplication>(),
    source: SOURCE,
    kinds: [
      "analysisSections",
      "databaseSchemas",
      "interfaceOperations",
      "interfaceSchemas",
      "previousAnalysisSections",
      "previousDatabaseSchemas",
      "previousInterfaceOperations",
      "previousInterfaceSchemas",
    ],
    config: {
      database: "text",
      databaseProperty: true,
    },
    state: ctx.state(),
    all: {
      interfaceOperations: props.document.operations,
      interfaceSchemas: props.document.components.schemas,
    },
    local: {
      analysisSections: ragSections,
      interfaceOperations: props.document.operations.filter((o) => {
        const predicate = (key: string | undefined): boolean => {
          if (key === undefined) return false;
          const schema: AutoBeOpenApi.IJsonSchemaDescriptive | undefined =
            props.document.components.schemas[key];
          return schema !== undefined && isReferenced(schema, props.typeName);
        };
        return (
          predicate(o.requestBody?.typeName) ||
          predicate(o.responseBody?.typeName)
        );
      }),
      interfaceSchemas: Object.fromEntries(
        Object.entries(props.document.components.schemas).filter(
          ([_k, v]) => v !== undefined && isReferenced(v, props.typeName),
        ),
      ),
      databaseSchemas:
        AutoBeInterfaceSchemaProgrammer.getNeighborDatabaseSchemas({
          typeName: props.typeName,
          application: ctx.state().database!.result.data,
        }),
    },
  });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeInterfaceSchemaComplementApplication.IWrite | null> =
      {
        value: null,
      };
    const result: AutoBeContext.IResult = await ctx.conversate({
      source: SOURCE,
      controller: createController(ctx, {
        typeName: props.typeName,
        operations: props.document.operations,
        build: (next) => {
          pointer.value = next;
        },
        preliminary,
      }),
      promptCacheKey: props.promptCacheKey,
      enforceFunctionCall: true,
      ...transformInterfaceSchemaComplementHistory({
        document: props.document,
        instruction: props.instruction,
        preliminary,
        typeName: props.typeName,
      }),
    });
    if (pointer.value === null) return out(result)(null);

    ++props.progress.completed;

    const schema: AutoBeOpenApi.IJsonSchema = AutoBeJsonSchemaFactory.fixDesign(
      pointer.value.design,
    );
    ctx.dispatch({
      type: SOURCE,
      id: v7(),
      typeName: props.typeName,
      analysis: pointer.value.analysis,
      rationale: pointer.value.rationale,
      schema,
      acquisition: preliminary.getAcquisition(),
      metric: result.metric,
      tokenUsage: result.tokenUsage,
      step: ctx.state().analyze?.step ?? 0,
      completed: props.progress.completed,
      total: props.progress.total,
      created_at: new Date().toISOString(),
    } satisfies AutoBeInterfaceSchemaComplementEvent);
    return out(result)(schema);
  });
}

function createController(
  ctx: AutoBeContext,
  props: {
    typeName: string;
    operations: AutoBeOpenApi.IOperation[];
    preliminary: AutoBePreliminaryController<
      | "analysisSections"
      | "databaseSchemas"
      | "interfaceOperations"
      | "interfaceSchemas"
      | "previousAnalysisSections"
      | "previousDatabaseSchemas"
      | "previousInterfaceSchemas"
      | "previousInterfaceOperations"
    >;
    build: (schema: IAutoBeInterfaceSchemaComplementApplication.IWrite) => void;
  },
): IAgenticaController.IClass {
  const everyModels: AutoBeDatabase.IModel[] =
    ctx.state().database?.result.data.files.flatMap((f) => f.models) ?? [];

  const validate = (
    next: unknown,
  ): IValidation<IAutoBeInterfaceSchemaComplementApplication.IProps> => {
    const result: IValidation<IAutoBeInterfaceSchemaComplementApplication.IProps> =
      typia.validate<IAutoBeInterfaceSchemaComplementApplication.IProps>(next);
    if (result.success === false) {
      fulfillJsonSchemaErrorMessages(result.errors);
      return result;
    } else if (result.data.request.type !== "write")
      return props.preliminary.validate({
        thinking: result.data.thinking,
        request: result.data.request,
      });

    const errors: IValidation.IError[] = [];
    AutoBeInterfaceSchemaProgrammer.validate({
      path: "$input.request.design",
      errors,
      everyModels,
      operations: props.operations,
      typeName: props.typeName,
      design: result.data.request.design,
    });
    if (errors.length !== 0)
      return {
        success: false,
        errors,
        data: next,
      };
    return result;
  };

  const application: ILlmApplication = props.preliminary.fixApplication(
    typia.llm.application<IAutoBeInterfaceSchemaComplementApplication>({
      validate: {
        process: validate,
      },
    }),
  );
  if (
    AutoBeJsonSchemaValidator.isObjectType({
      operations: props.operations,
      typeName: props.typeName,
    }) === true
  )
    (
      (
        application.functions[0].parameters.$defs[
          typia.reflect.name<AutoBeInterfaceSchemaDesign>()
        ] as ILlmSchema.IObject
      ).properties.schema as ILlmSchema.IReference
    ).$ref = "#/$defs/AutoBeOpenApi.IJsonSchema.IObject";
  AutoBeInterfaceSchemaProgrammer.fixApplication({
    application,
    everyModels,
  });

  return {
    protocol: "class",
    name: SOURCE,
    application,
    execute: {
      process: (next) => {
        if (next.request.type === "write") props.build(next.request);
      },
    } satisfies IAutoBeInterfaceSchemaComplementApplication,
  };
}

const SOURCE = "interfaceSchemaComplement" satisfies AutoBeEventSource;

const isReferenced = (
  schema: AutoBeOpenApi.IJsonSchemaDescriptive,
  typeName: string,
): boolean => {
  let found: boolean = false;
  AutoBeOpenApiTypeChecker.visit({
    components: {
      authorizations: [],
      schemas: {},
    },
    schema,
    closure: (next) => {
      if (
        AutoBeOpenApiTypeChecker.isReference(next) &&
        next.$ref.split("/").pop() === typeName
      )
        found = true;
    },
  });
  return found;
};

import {
  IAgenticaController,
  IAgenticaHistoryJson,
  MicroAgentica,
} from "@agentica/core";
import {
  AutoBeOpenApi,
  AutoBeTestScenario,
  AutoBeTestScenarioEvent,
} from "@autobe/interface";
import { AutoBeEndpointComparator } from "@autobe/utils";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { HashMap, IPointer, Pair } from "tstl";
import typia from "typia";
import { v4 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { divideArray } from "../../utils/divideArray";
import { enforceToolCall } from "../../utils/enforceToolCall";
import { forceRetry } from "../../utils/forceRetry";
import { IAutoBeTestScenarioApplication } from "./structures/IAutoBeTestScenarioApplication";

export async function orchestrateTestScenario<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
): Promise<AutoBeTestScenarioEvent> {
  const operations: AutoBeOpenApi.IOperation[] =
    ctx.state().interface?.document.operations ?? [];
  if (operations.length === 0) {
    throw new Error(
      "Cannot write test scenarios because these are no operations.",
    );
  }

  const dict: HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation> =
    new HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation>(
      operations.map(
        (op) =>
          new Pair(
            {
              path: op.path,
              method: op.method,
            },
            op,
          ),
      ),
      AutoBeEndpointComparator.hashCode,
      AutoBeEndpointComparator.equals,
    );
  const endpointNotFound: string = [
    `You have to select one of the endpoints below`,
    "",
    " method | path ",
    "--------|------",
    ...operations.map((op) => `\`${op.method}\` | \`${op.path}\``).join("\n"),
  ].join("\n");

  const exclude: IAutoBeTestScenarioApplication.IScenarioGroup[] = [];
  let include: AutoBeOpenApi.IOperation[] = Array.from(operations);

  do {
    // Use semantic grouping to optimize batch processing
    const semanticGroups = groupOperationsBySemantic(include);
    
    // Process larger batches for token efficiency - increased from 5 to 15
    const matrix: AutoBeOpenApi.IOperation[][] = semanticGroups.length > 0 
      ? semanticGroups.map(group => group.slice(0, 15)) // Use semantic groups
      : divideArray({
          array: include,
          capacity: 15, // Increased batch size for better token efficiency
        });
        
    await Promise.all(
      matrix.map(async (include) => {
        exclude.push(
          ...(await forceRetry(() =>
            execute(
              ctx,
              dict,
              endpointNotFound,
              operations,
              include,
              exclude.map((x) => x.endpoint),
            ),
          )),
        );
      }),
    );
    include = include.filter((op) => {
      if (
        exclude.some(
          (pg) =>
            pg.endpoint.method === op.method && pg.endpoint.path === op.path,
        )
      ) {
        return false;
      }
      return true;
    });
  } while (include.length > 0);

  return {
    type: "testScenario",
    step: ctx.state().analyze?.step ?? 0,
    scenarios: exclude.flatMap((pg) => {
      return pg.scenarios.map((plan) => {
        return {
          endpoint: pg.endpoint,
          draft: plan.draft,
          functionName: plan.functionName,
          dependencies: plan.dependencies,
        } satisfies AutoBeTestScenario;
      });
    }),
    created_at: new Date().toISOString(),
  } as AutoBeTestScenarioEvent;
}

const execute = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  dict: HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation>,
  endpointNotFound: string,
  entire: AutoBeOpenApi.IOperation[],
  include: AutoBeOpenApi.IEndpoint[],
  exclude: AutoBeOpenApi.IEndpoint[],
) => {
  const pointer: IPointer<IAutoBeTestScenarioApplication.IScenarioGroup[]> = {
    value: [],
  };
  const agentica: MicroAgentica<Model> = new MicroAgentica({
    model: ctx.model,
    vendor: ctx.vendor,
    config: {
      ...(ctx.config ?? {}),
      executor: {
        describe: null,
      },
    },
    histories: createHistoryProperties(entire, include, exclude),
    controllers: [
      createApplication({
        model: ctx.model,
        endpointNotFound,
        dict,
        build: (next) => {
          pointer.value ??= [];
          pointer.value.push(...next.scenarioGroups);
        },
      }),
    ],
  });
  enforceToolCall(agentica);

  await agentica.conversate(`create test scenarios.`).finally(() => {
    const tokenUsage = agentica.getTokenUsage();
    ctx.usage().record(tokenUsage, ["test"]);
  });
  if (pointer.value.length === 0) {
    console.error("Failed to create test plans. No function called.");
    return [];
    // @todo
    // throw new Error("Failed to create test plans.");
  }
  return pointer.value;
};

const createHistoryProperties = (
  entire: AutoBeOpenApi.IOperation[],
  include: Pick<AutoBeOpenApi.IOperation, "method" | "path">[],
  exclude: Pick<AutoBeOpenApi.IOperation, "method" | "path">[],
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => [
  {
    id: v4(),
    created_at: new Date().toISOString(),
    type: "systemMessage",
    text: "# API Test Scenario Generator System Prompt (OPTIMIZED FOR TOKEN EFFICIENCY)\n\n## 1. Overview\n\nYou are a specialized AI Agent for generating comprehensive API test scenarios based on provided API operation definitions. Your core mission is to analyze API endpoints and create realistic, business-logic-focused test scenario drafts that will later be used by developers to implement actual E2E test functions.\n\n## 2. Context Optimization\n\n**IMPORTANT: This context has been optimized using RAG (Retrieval-Augmented Generation) techniques to reduce token consumption while maintaining test quality.**\n\nYou are working with a focused subset of the full API operations to optimize token usage and processing efficiency.",
  } satisfies IAgenticaHistoryJson.ISystemMessage,
  {
    id: v4(),
    created_at: new Date().toISOString(),
    type: "systemMessage",
    text: [
      "# Operations (FILTERED FOR EFFICIENCY)",
      `Below are the relevant operations for this batch (${entire.length} total operations in system).`,
      "Your role is to draft test cases for the included operations.",
      "Focus on realistic business scenarios and comprehensive E2E testing.",
      "",
      `## Current Batch: ${include.length} operations`,
      include
        .map((el) => `- ${el.method.toUpperCase()}: ${el.path}`)
        .join("\n"),
      "",
      `## Already Processed: ${exclude.length} operations`,
      "These endpoints have test scenarios and do not need new ones.",
      "However, you may reference them as dependencies in new test scenarios.",
      exclude.length > 0 ? exclude
        .slice(0, 10) // Limit to first 10 to save tokens
        .map((el) => `- ${el.method.toUpperCase()}: ${el.path}`)
        .join("\n") + (exclude.length > 10 ? `\n... and ${exclude.length - 10} more` : "") : "None",
    ].join("\n"),
  } satisfies IAgenticaHistoryJson.ISystemMessage,
];

function createApplication<Model extends ILlmSchema.Model>(props: {
  model: Model;
  endpointNotFound: string;
  dict: HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation>;
  build: (next: IAutoBeTestScenarioApplication.IProps) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const application: ILlmApplication<Model> = collection[
    props.model
  ] as unknown as ILlmApplication<Model>;

  application.functions[0].validate = (next: unknown): IValidation => {
    const result: IValidation<IAutoBeTestScenarioApplication.IProps> =
      typia.validate<IAutoBeTestScenarioApplication.IProps>(next);
    if (result.success === false) return result;

    // merge to unique scenario groups
    const scenarioGroups: IAutoBeTestScenarioApplication.IScenarioGroup[] = [];
    result.data.scenarioGroups.forEach((sg) => {
      const created = scenarioGroups.find(
        (el) =>
          el.endpoint.method === sg.endpoint.method &&
          el.endpoint.path === sg.endpoint.path,
      );
      if (created) {
        created.scenarios.push(...sg.scenarios);
      } else {
        scenarioGroups.push(sg);
      }
    });

    // validate endpoints
    const errors: IValidation.IError[] = [];
    scenarioGroups.forEach((group, i) => {
      if (props.dict.has(group.endpoint) === false)
        errors.push({
          value: group.endpoint,
          path: `$input.scenarioGroups[${i}].endpoint`,
          expected: "AutoBeOpenApi.IEndpoint",
          description: props.endpointNotFound,
        });
      group.scenarios.forEach((s, j) => {
        s.dependencies.forEach((dep, k) => {
          if (props.dict.has(dep.endpoint) === false)
            errors.push({
              value: dep.endpoint,
              path: `$input.scenarioGroups[${i}].scenarios[${j}].dependencies[${k}].endpoint`,
              expected: "AutoBeOpenApi.IEndpoint",
              description: props.endpointNotFound,
            });
        });
      });
    });
    return errors.length === 0
      ? {
          success: true,
          data: scenarioGroups,
        }
      : {
          success: false,
          data: scenarioGroups,
          errors,
        };
  };
  return {
    protocol: "class",
    name: "Make test plans",
    application,
    execute: {
      makeScenario: (next) => {
        props.build(next);
      },
    } satisfies IAutoBeTestScenarioApplication,
  };
}

const claude = typia.llm.application<
  IAutoBeTestScenarioApplication,
  "claude",
  {
    reference: true;
  }
>();
const collection = {
  chatgpt: typia.llm.application<
    IAutoBeTestScenarioApplication,
    "chatgpt",
    { reference: true }
  >(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
};

/**
 * Group operations by semantic similarity to optimize batch processing
 * and reduce context switching between unrelated endpoints
 */
function groupOperationsBySemantic(operations: AutoBeOpenApi.IOperation[]): AutoBeOpenApi.IOperation[][] {
  if (operations.length <= 15) {
    return [operations]; // Single group if small enough
  }

  const groups: AutoBeOpenApi.IOperation[][] = [];
  const used = new Set<number>();
  
  // Group operations by path similarity and business domain
  for (let i = 0; i < operations.length; i++) {
    if (used.has(i)) continue;
    
    const group: AutoBeOpenApi.IOperation[] = [operations[i]];
    used.add(i);
    
    const baseOp = operations[i];
    
    // Find similar operations for this group
    for (let j = i + 1; j < operations.length && group.length < 15; j++) {
      if (used.has(j)) continue;
      
      const candidateOp = operations[j];
      
      // Check semantic similarity using path segments and business domain
      const similarity = calculateOperationSimilarity(baseOp, candidateOp);
      if (similarity > 0.3) { // Threshold for grouping
        group.push(candidateOp);
        used.add(j);
      }
    }
    
    groups.push(group);
  }
  
  // Add any remaining ungrouped operations
  const remainingOps = operations.filter((_, index) => !used.has(index));
  if (remainingOps.length > 0) {
    groups.push(remainingOps);
  }
  
  return groups;
}

/**
 * Calculate semantic similarity between two operations
 */
function calculateOperationSimilarity(op1: AutoBeOpenApi.IOperation, op2: AutoBeOpenApi.IOperation): number {
  // Path segment similarity
  const segments1 = op1.path.split('/').filter(s => s && !s.startsWith('{'));
  const segments2 = op2.path.split('/').filter(s => s && !s.startsWith('{'));
  
  let commonSegments = 0;
  const maxSegments = Math.max(segments1.length, segments2.length);
  
  for (let i = 0; i < Math.min(segments1.length, segments2.length); i++) {
    if (segments1[i] === segments2[i]) {
      commonSegments++;
    }
  }
  
  const pathSimilarity = maxSegments > 0 ? commonSegments / maxSegments : 0;
  
  // Method family similarity
  const readMethods = ['GET', 'HEAD', 'OPTIONS'];
  const writeMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  
  let methodSimilarity = 0;
  if ((readMethods.includes(op1.method) && readMethods.includes(op2.method)) ||
      (writeMethods.includes(op1.method) && writeMethods.includes(op2.method))) {
    methodSimilarity = 0.3;
  }
  
  // Business domain similarity (based on tags or summary)
  let domainSimilarity = 0;
  const op1Tags = (op1 as any).tags;
  const op2Tags = (op2 as any).tags;
  if (op1Tags && op2Tags) {
    const commonTags = op1Tags.filter((tag: string) => op2Tags?.includes(tag));
    domainSimilarity = commonTags.length > 0 ? 0.2 : 0;
  }
  
  return pathSimilarity * 0.6 + methodSimilarity + domainSimilarity;
}

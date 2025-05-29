import {
  AgenticaAssistantMessageHistory,
  IAgenticaController,
  MicroAgentica,
  MicroAgenticaHistory,
} from "@agentica/core";
import { AutoBeAssistantMessageHistory } from "@autobe/interface";
import { AutoBePrismaDraftEvent } from "@autobe/interface/src/events/AutoBePrismaDraft";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v4 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { transformPrismaDraftHistories } from "./transformPrismaDraftHistories";

export async function orchestratePrismaDraft<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  content: string = "Please create a draft document for making Prisma DB schema.",
): Promise<AutoBeAssistantMessageHistory | AutoBePrismaDraftEvent> {
  const start: Date = new Date();
  const pointer: IPointer<ICreateDraftProps | null> = {
    value: null,
  };
  const agentica: MicroAgentica<Model> = new MicroAgentica({
    model: ctx.model,
    vendor: ctx.vendor,
    config: {
      ...(ctx.config ?? {}),
    },
    controllers: [
      createApplication({
        model: ctx.model,
        build: (next) => {
          pointer.value = next;
        },
      }),
    ],
    histories: transformPrismaDraftHistories(ctx.state()),
    tokenUsage: ctx.usage(),
  });

  const histories: MicroAgenticaHistory<Model>[] =
    await agentica.conversate(content);

  if (pointer.value) {
    return {
      type: "prismaDraft",
      created_at: start.toISOString(),
      draft: pointer.value.draft,
      step: ctx.state().analyze?.step ?? 0,
    };
  }

  if (histories.at(-1)?.type === "assistantMessage")
    return {
      ...(histories.at(-1)! as AgenticaAssistantMessageHistory),
      created_at: start.toISOString(),
      completed_at: new Date().toISOString(),
      id: v4(),
    } satisfies AutoBeAssistantMessageHistory;

  throw new Error("Failed to create draft");
}

function createApplication<Model extends ILlmSchema.Model>(props: {
  model: Model;
  build: (next: ICreateDraftProps) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const application: ILlmApplication<Model> = collection[
    props.model
  ] as unknown as ILlmApplication<Model>;
  return {
    protocol: "class",
    name: "Prisma Extract Files and Tables",
    application,
    execute: {
      createDraft: (next) => {
        props.build(next);
      },
    } satisfies IApplication,
  };
}
const claude = typia.llm.application<
  IApplication,
  "claude",
  { reference: true }
>();
const collection = {
  chatgpt: typia.llm.application<
    IApplication,
    "chatgpt",
    { reference: true }
  >(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
  "3.0": typia.llm.application<IApplication, "3.0">(),
};

interface IApplication {
  /**
   * Creates a new draft document based on the provided content.
   *
   * DRAFT GENERATION PROMPT: You are an expert technical writer specializing in
   * creating comprehensive, well-structured draft documents. When generating
   * drafts, follow these guidelines:
   *
   * 1. STRUCTURE: Use clear hierarchical organization with numbered sections,
   *    subsections, and bullet points
   * 2. CLARITY: Write in concise, professional language avoiding jargon unless
   *    necessary
   * 3. COMPLETENESS: Cover all essential aspects of the topic with sufficient
   *    detail for implementation
   * 4. CONSISTENCY: Maintain uniform formatting, terminology, and style throughout
   * 5. ACTIONABILITY: Include specific, measurable requirements and clear next
   *    steps
   * 6. TRACEABILITY: Reference related documents and dependencies where applicable
   * 7. VALIDATION: Include acceptance criteria and verification methods
   *
   * Ensure the draft is ready for stakeholder review and can serve as a
   * foundation for implementation or further refinement.
   */
  createDraft(props: ICreateDraftProps): void;
}

interface ICreateDraftProps {
  /**
   * The complete draft document content following the structured format
   * guidelines. Should include executive summary, detailed sections, and
   * actionable conclusions.
   */
  draft: string;
}

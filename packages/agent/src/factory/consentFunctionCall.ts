import {
  IAgenticaHistoryJson,
  MicroAgentica,
  MicroAgenticaHistory,
} from "@agentica/core";
import {
  AutoBeConsentFunctionCallEvent,
  AutoBeEvent,
  AutoBeEventSource,
} from "@autobe/interface";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeConfigConstant } from "../constants/AutoBeConfigConstant";
import { AutoBeSystemPromptConstant } from "../constants/AutoBeSystemPromptConstant";
import { IAutoBeConfig } from "../structures/IAutoBeConfig";
import { IAutoBeVendor } from "../structures/IAutoBeVendor";
import { getCommonPrompt } from "./getCommonPrompt";
import { supportMistral } from "./supportMistral";

/**
 * Generates automatic consent messages when AI hesitates and seeks permission
 * before function calling.
 *
 * Uses fast LLM (chatgpt) to analyze assistant messages and determine if
 * they're seeking function execution approval. Returns strong directive consent
 * message to break permission-seeking loops, or `null` if not applicable.
 *
 * @returns Consent message if applicable, `null` otherwise
 */
export const consentFunctionCall = async (props: {
  dispatch: (event: AutoBeEvent) => void;
  source: AutoBeEventSource;
  config: IAutoBeConfig;
  vendor: IAutoBeVendor;
  assistantMessage: string;
}): Promise<string | null> => {
  const pointer: IPointer<AutoBeConsentFunctionCallEvent.IResult | null> = {
    value: null,
  };
  const agent: MicroAgentica = new MicroAgentica({
    vendor: props.vendor,
    config: {
      ...(props.config ?? []),
      executor: {
        describe: false,
      },
      systemPrompt: {
        common: () => getCommonPrompt(props.config),
      },
      retry: props.config?.retry ?? AutoBeConfigConstant.RETRY,
      throw: true,
    },
    histories: [
      {
        id: v7(),
        type: "systemMessage",
        text: AutoBeSystemPromptConstant.CONSENT_FUNCTION_CALL,
        created_at: new Date().toISOString(),
      } satisfies IAgenticaHistoryJson.ISystemMessage,
      {
        id: v7(),
        type: "assistantMessage",
        text: props.assistantMessage,
        created_at: new Date().toISOString(),
      } satisfies IAgenticaHistoryJson.IAssistantMessage,
    ],
    controllers: [
      typia.llm.controller<IConsentApplication>("consent", {
        consent: (props) => {
          pointer.value = {
            type: "consent",
            message: props.message,
          };
        },
        notApplicable: () => {
          pointer.value = {
            type: "notApplicable",
          };
        },
      } satisfies IConsentApplication),
    ],
  });
  supportMistral(agent, props.vendor);

  const histories: MicroAgenticaHistory[] = await agent.conversate(
    "Analyze and judge this assistant message please.",
  );
  if (pointer.value === null) {
    const last: MicroAgenticaHistory | undefined =
      histories[histories.length - 1];
    if (last?.type === "assistantMessage")
      pointer.value = {
        type: "assistantMessage",
        message: last.text,
      };
  }
  props.dispatch({
    type: "consentFunctionCall",
    id: v7(),
    source: props.source,
    assistantMessage: props.assistantMessage,
    result: pointer.value,
    created_at: new Date().toISOString(),
  });
  return pointer.value?.type === "consent" ? pointer.value.message : null;
};

interface IConsentApplication {
  /**
   * Generate authoritative consent message when assistant seeks function
   * execution approval.
   *
   * @param props.message Strong directive (1-2 sentences). E.g., "Execute
   *   immediately. Do not ask again."
   */
  consent(props: { message: string }): void;

  /**
   * Indicate assistant message doesn't require function calling consent (e.g.,
   * general conversation, asking for parameters, etc.).
   */
  notApplicable(): void;
}

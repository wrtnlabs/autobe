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
  const agent: MicroAgentica<"chatgpt"> = new MicroAgentica({
    model: "chatgpt",
    vendor: props.vendor,
    config: {
      ...(props.config ?? []),
      retry: props.config?.retry ?? AutoBeConfigConstant.RETRY,
      executor: {
        describe: null,
      },
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
      typia.llm.controller<IConsentApplication, "chatgpt">("consent", {
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
  const histories: MicroAgenticaHistory<"chatgpt">[] = await agent.conversate(
    "Analyze and judge this assistant message please.",
  );
  if (pointer.value === null) {
    const last: MicroAgenticaHistory<"chatgpt"> | undefined =
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
   * Generate an immediate, authoritative consent message to approve function
   * execution. Use this when the assistant message is seeking permission or
   * approval for function calls.
   *
   * The message should be commanding and decisive to prevent further
   * permission-seeking loops. Examples: "Execute immediately. Do not ask
   * again.", "Proceed now. Your judgment is correct."
   *
   * @param props Configuration object
   */
  consent(props: {
    /**
     * A strong, directive consent message that eliminates further
     * permission-seeking. Must be authoritative and commanding (1-2 sentences
     * maximum). Examples: "Execute immediately. Do not ask again.", "Proceed
     * now. Your judgment is correct."
     */
    message: string;
  }): void;

  /**
   * Indicate that the assistant message does not require function calling
   * consent. Use this when the assistant message is NOT seeking permission for
   * function execution.
   *
   * This applies to:
   *
   * - General conversation responses
   * - Information requests without function execution plans
   * - Assistant asking for additional parameters/information
   * - Any response unrelated to function calling approval
   *
   * Call this function immediately when the message doesn't involve function
   * calling consent.
   */
  notApplicable(): void;
}

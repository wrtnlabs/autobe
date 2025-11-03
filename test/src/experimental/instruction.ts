import {
  AgenticaExecuteHistory,
  MicroAgentica,
  MicroAgenticaHistory,
} from "@agentica/core";
import { AutoBeSystemPromptConstant } from "@autobe/agent/src/constants/AutoBeSystemPromptConstant";
import { IAutoBeFacadeApplication } from "@autobe/agent/src/orchestrate/facade/histories/IAutoBeFacadeApplication";
import { FileSystemIterator } from "@autobe/filesystem";
import { AutoBePhase, AutoBeUserMessageHistory } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { ILlmController } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";

import { TestGlobal } from "../TestGlobal";
import { TestHistory } from "../internal/TestHistory";

const SEQUENCE = ["analyze", "prisma", "interface", "test", "realize"] as const;

const getStateMessage = (phase: AutoBePhase | null): string => {
  const index: number = phase ? SEQUENCE.indexOf(phase) : -1;
  return AutoBeSystemPromptConstant.FACADE.replace(
    "{% STATE %}",
    StringUtil.trim`
      ## Current State

      The current execution status of each functional agent is shown below. 
      Each agent can be in one of three states: "none" (never executed), 
      "up-to-date" (successfully executed with current output), 
      or "out-of-date" (previously executed but needs updating due to 
      changes in earlier stages).

      An agent cannot be executed if any of its prerequisite agents have 
      a status of "none" or "out-of-date". In such cases, you must complete or 
      update the earlier stages first. Additionally, re-executing an "up-to-date" 
      agent will cause all subsequent agents to become "out-of-date", as they 
      depend on the updated output.

      ${SEQUENCE.map(
        (s, i) => `- ${s}: ${index < i ? "none" : "up-to-date"}`,
      ).join("\n")}
    `,
  );
};

const main = async (): Promise<void> => {
  const instructions: Record<string, string> = {};
  const currentPhase: IPointer<AutoBePhase | null> = { value: null };
  const controller: ILlmController<"chatgpt", IAutoBeFacadeApplication> =
    typia.llm.controller<IAutoBeFacadeApplication, "chatgpt">("facade", {
      analyze: async () => {
        currentPhase.value = "analyze";
        return {
          type: "success",
          description: "Analysis completed successfully.",
        };
      },
      prisma: async (props) => {
        currentPhase.value = "prisma";
        instructions.prisma = props.instruction;
        return {
          type: "success",
          description: "Prisma schemas have been generated successfully.",
        };
      },
      interface: async (props) => {
        currentPhase.value = "interface";
        instructions.interface = props.instruction;
        return {
          type: "success",
          description: "API interfaces have been generated successfully.",
        };
      },
      test: async (props) => {
        currentPhase.value = "test";
        instructions.test = props.instruction;
        return {
          type: "success",
          description: "Test functions have been generated successfully.",
        };
      },
      realize: async (props) => {
        currentPhase.value = "realize";
        instructions.realize = props.instruction;
        return {
          type: "success",
          description:
            "API implementation codes have been generated successfully.",
        };
      },
    } satisfies IAutoBeFacadeApplication);

  const agent: MicroAgentica<"chatgpt"> = new MicroAgentica({
    vendor: TestGlobal.getVendorConfig(),
    model: "chatgpt",
    config: {
      executor: {
        describe: null,
      },
      systemPrompt: {
        execute: () => getStateMessage(currentPhase.value),
      },
    },
    controllers: [controller],
  });
  agent.on("request", (event) => {
    event.body.tool_choice = "required";
  });

  for (const s of SEQUENCE) {
    const message: AutoBeUserMessageHistory = await TestHistory.getUserMessage(
      "chat",
      s,
    );
    console.log(
      "userMessage",
      message.contents[0].type === "text"
        ? message.contents[0].text.length
        : "binary",
    );

    const start: Date = new Date();
    const histories: MicroAgenticaHistory<"chatgpt">[] = await agent.conversate(
      message.contents,
    );
    const execute: AgenticaExecuteHistory<"chatgpt"> | undefined =
      histories.find((h) => h.type === "execute");
    if (execute !== undefined)
      console.log(
        execute.operation.name,
        (execute.arguments as any).instruction?.length,
        `(${new Date().getTime() - start.getTime()} ms)`,
      );
  }

  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/instructions`,
    files: Object.fromEntries(
      Object.entries(instructions).map(([k, v]) => [`${k}.md`, v]),
    ),
  });
};
main().catch(console.error);

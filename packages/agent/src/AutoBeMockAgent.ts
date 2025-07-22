import {
  AutoBeAssistantMessageHistory,
  AutoBeEvent,
  AutoBeEventSnapshot,
  AutoBeHistory,
  AutoBeUserMessageContent,
  AutoBeUserMessageHistory,
  IAutoBeAgent,
  IAutoBeCompiler,
  IAutoBeCompilerListener,
} from "@autobe/interface";
import { Singleton, sleep_for } from "tstl";
import { v4 } from "uuid";

import { AutoBeAgentBase } from "./AutoBeAgentBase";
import { AutoBeState } from "./context/AutoBeState";
import { AutoBeTokenUsage } from "./context/AutoBeTokenUsage";
import { createAutoBeState } from "./factory/createAutoBeState";

/** @internal */
export class AutoBeMockAgent extends AutoBeAgentBase implements IAutoBeAgent {
  private readonly props_: AutoBeMockAgent.IProps;
  private readonly histories_: AutoBeHistory[];
  private readonly compiler_: Singleton<Promise<IAutoBeCompiler>>;
  private token_usage_: AutoBeTokenUsage;

  public constructor(props: AutoBeMockAgent.IProps) {
    super({
      compiler: () => this.compiler_.get(),
      state: () => createAutoBeState(this.histories_),
    });
    this.props_ = props;
    this.histories_ = [];
    this.compiler_ = new Singleton(async () =>
      props.compiler({
        realize: {
          test: {
            onOperation: async () => {},
            onReset: async () => {},
          },
        },
      }),
    );
    this.token_usage_ = new AutoBeTokenUsage();
  }

  public async conversate(
    content: string | AutoBeUserMessageContent | AutoBeUserMessageContent[],
  ): Promise<AutoBeHistory[]> {
    // THE USER-MESSAGE
    const userMessage: AutoBeUserMessageHistory = {
      id: v4(),
      type: "userMessage",
      contents:
        typeof content === "string"
          ? [
              {
                type: "text",
                text: content,
              },
            ]
          : Array.isArray(content)
            ? content
            : [content],
      created_at: new Date().toISOString(),
    };
    void this.dispatch(userMessage).catch(() => {});

    // ALREADY REALIZED CASE
    const state: AutoBeState = createAutoBeState(this.histories_);
    if (state.test !== null) {
      const assistantMessage: AutoBeAssistantMessageHistory = {
        id: v4(),
        type: "assistantMessage",
        text: [
          "You've reached to the test agent.",
          "",
          "The realize agent would be developed until 2025-08-31.",
          "",
          "Thanks for using AutoBE!",
        ].join("\n"),
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      };
      void this.dispatch(assistantMessage).catch(() => {});
      this.histories_.push(userMessage, assistantMessage);
      return this.histories_;
    }
    const take = async (
      type: "analyze" | "prisma" | "interface" | "test",
    ): Promise<void> => {
      for (const s of this.getEventSnapshots(type)) {
        void this.dispatch(s.event).catch(() => {});
        this.token_usage_ = new AutoBeTokenUsage(s.tokenUsage);
        await sleep_for(sleepMap[s.event.type] ?? 500);
      }
      this.histories_.push(userMessage);
      this.histories_.push(
        this.props_.preset.histories.find((h) => h.type === type)!,
      );
    };
    if (state.analyze === null) await take("analyze");
    else if (state.prisma === null) await take("prisma");
    else if (state.interface === null) await take("interface");
    else if (state.test === null) await take("test");
    return this.histories_;
  }

  public getHistories(): AutoBeHistory[] {
    return this.histories_;
  }

  public getTokenUsage(): AutoBeTokenUsage {
    return this.token_usage_;
  }

  private getEventSnapshots(
    state: "analyze" | "prisma" | "interface" | "test",
  ): AutoBeEventSnapshot[] {
    return this.props_.preset[state];
  }
}
export namespace AutoBeMockAgent {
  export interface IProps {
    compiler: (
      listener: IAutoBeCompilerListener,
    ) => IAutoBeCompiler | Promise<IAutoBeCompiler>;
    preset: IPreset;
  }
  export interface IPreset {
    histories: AutoBeHistory[];
    analyze: AutoBeEventSnapshot[];
    prisma: AutoBeEventSnapshot[];
    interface: AutoBeEventSnapshot[];
    test: AutoBeEventSnapshot[];
  }
}

const sleepMap: Partial<Record<AutoBeEvent.Type, number>> = {
  analyzeStart: 1_000,
  analyzeWrite: 500,
  analyzeReview: 500,
  analyzeComplete: 500,
  prismaStart: 1_000,
  prismaComponents: 1_000,
  prismaSchemas: 500,
  prismaValidate: 2_500,
  prismaCorrect: 500,
  prismaInsufficient: 1_000,
  prismaComplete: 500,
  interfaceStart: 1_000,
  interfaceEndpoints: 1_000,
  interfaceOperations: 500,
  interfaceComponents: 500,
  interfaceComplement: 2_500,
  interfaceComplete: 500,
  testStart: 1_000,
  testScenario: 1_000,
  testWrite: 50,
  testValidate: 100,
  testCorrect: 250,
  testComplete: 500,
};

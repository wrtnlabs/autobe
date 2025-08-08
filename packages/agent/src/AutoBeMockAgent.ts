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
import { Singleton, randint, sleep_for } from "tstl";
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
    if (state.realize !== null) {
      await sleep_for(2_000);
      const assistantMessage: AutoBeAssistantMessageHistory = {
        id: v4(),
        type: "assistantMessage",
        text: [
          "AutoBE has successfully realized the application.",
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
      type: "analyze" | "prisma" | "interface" | "test" | "realize",
    ): Promise<void> => {
      for (const s of this.getEventSnapshots(type)) {
        const time: number = sleepMap[s.event.type] ?? 500;
        await sleep_for(randint(time * 0.2, time * 1.8));
        void this.dispatch(s.event).catch(() => {});
        this.token_usage_ = new AutoBeTokenUsage(s.tokenUsage);
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
    else if (state.realize === null) await take("realize");
    return this.histories_;
  }

  public getHistories(): AutoBeHistory[] {
    return this.histories_;
  }

  public getTokenUsage(): AutoBeTokenUsage {
    return this.token_usage_;
  }

  private getEventSnapshots(
    state: "analyze" | "prisma" | "interface" | "test" | "realize",
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
    realize: AutoBeEventSnapshot[];
  }
}

const sleepMap: Record<AutoBeEvent.Type, number> = {
  userMessage: 1_000,
  assistantMessage: 1_000,
  // ANALYZE
  analyzeStart: 1_000,
  analyzeWrite: 500,
  analyzeReview: 300,
  analyzeComplete: 1_000,
  // PRISMA
  prismaStart: 1_000,
  prismaComponents: 1_000,
  prismaSchemas: 500,
  prismaInsufficient: 1_000,
  prismaReview: 500,
  prismaValidate: 2_000,
  prismaCorrect: 500,
  prismaComplete: 1_000,
  // INTERFACE
  interfaceStart: 1_000,
  interfaceGroups: 1_000,
  interfaceEndpoints: 1_000,
  interfaceOperations: 400,
  interfaceSchemas: 400,
  interfaceComplement: 2_000,
  interfaceComplete: 1_000,
  // TEST
  testStart: 1_000,
  testScenario: 1_000,
  testWrite: 40,
  testValidate: 100,
  testCorrect: 100,
  testComplete: 1_000,
  // REALIZE
  realizeStart: 1_000,
  realizeComplete: 1_000,
  realizeWrite: 80,
  realizeCorrect: 80,
  realizeValidate: 200,
  realizeAuthorizationStart: 1_000,
  realizeAuthorizationWrite: 200,
  realizeAuthorizationValidate: 200,
  realizeAuthorizationCorrect: 200,
  realizeAuthorizationComplete: 1_000,
  realizeTestStart: 1_000,
  realizeTestReset: 2_500,
  realizeTestOperation: 400,
  realizeTestComplete: 1_000,
};

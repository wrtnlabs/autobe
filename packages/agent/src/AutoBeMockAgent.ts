import {
  AutoBeAssistantMessageHistory,
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
      interval: number,
    ): Promise<void> => {
      for (const s of this.getEventSnapshots(type)) {
        await sleep_for(interval);
        void this.dispatch(s.event).catch(() => {});
        this.token_usage_ = new AutoBeTokenUsage(s.tokenUsage);
      }
      this.histories_.push(userMessage);
      this.histories_.push(
        this.props_.preset.histories.find((h) => h.type === type)!,
      );
    };
    if (state.analyze === null) await take("analyze", 500);
    else if (state.prisma === null) await take("prisma", 500);
    else if (state.interface === null) await take("interface", 500);
    else if (state.test === null) await take("test", 100);
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

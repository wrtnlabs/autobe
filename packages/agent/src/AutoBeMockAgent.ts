import {
  AutoBeAssistantMessageHistory,
  AutoBeEvent,
  AutoBeEventSnapshot,
  AutoBeHistory,
  AutoBePhase,
  AutoBeUserConversateContent,
  AutoBeUserMessageHistory,
  IAutoBeAgent,
  IAutoBeCompiler,
  IAutoBeCompilerListener,
  IAutoBeGetFilesOptions,
  IAutoBePlaygroundReplay,
} from "@autobe/interface";
import { Singleton, randint, sleep_for } from "tstl";
import { v7 } from "uuid";

import { AutoBeAgentBase } from "./AutoBeAgentBase";
import { AutoBeState } from "./context/AutoBeState";
import { AutoBeTokenUsage } from "./context/AutoBeTokenUsage";
import { createAutoBeUserMessageContent } from "./factory/createAutoBeMessageContent";
import { createAutoBeState } from "./factory/createAutoBeState";
import { getAutoBeGenerated } from "./factory/getAutoBeGenerated";

/** @internal */
export class AutoBeMockAgent extends AutoBeAgentBase implements IAutoBeAgent {
  private readonly props_: AutoBeMockAgent.IProps;
  private readonly histories_: AutoBeHistory[];
  private readonly compiler_: Singleton<Promise<IAutoBeCompiler>>;
  private token_usage_: AutoBeTokenUsage;

  public constructor(props: AutoBeMockAgent.IProps) {
    super();
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
    content:
      | string
      | AutoBeUserConversateContent
      | AutoBeUserConversateContent[],
  ): Promise<AutoBeHistory[]> {
    const contents: AutoBeUserConversateContent[] =
      typeof content === "string"
        ? [
            {
              type: "text",
              text: content,
            },
          ]
        : Array.isArray(content)
          ? content
          : [content];
    // THE USER-MESSAGE
    const userMessage: AutoBeUserMessageHistory = {
      id: v7(),
      type: "userMessage",
      contents: contents.map((c) =>
        createAutoBeUserMessageContent({ content: c }),
      ),
      created_at: new Date().toISOString(),
    };
    void this.dispatch(userMessage).catch(() => {});

    // ALREADY REALIZED CASE
    const state: AutoBeState = createAutoBeState(this.histories_);
    if (state.realize !== null) {
      await sleep_for(2_000);
      const assistantMessage: AutoBeAssistantMessageHistory = {
        id: v7(),
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
    const take = async (type: AutoBePhase): Promise<void> => {
      const snapshots: AutoBeEventSnapshot[] | null =
        this.getEventSnapshots(type);
      if (snapshots === null) {
        this.histories_.push(userMessage);
        this.histories_.push({
          id: v7(),
          type: "assistantMessage",
          text: [
            "The histories are prepared until current state.",
            "",
            "Thanks for using AutoBE!",
          ].join("\n"),
          created_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        });
        return;
      }
      for (const s of snapshots) {
        const time: number = sleepMap[s.event.type] ?? 500;
        await sleep_for(randint(time * 0.2, time * 1.8));
        void this.dispatch(s.event).catch(() => {});
        this.token_usage_ = new AutoBeTokenUsage(s.tokenUsage);
      }
      this.histories_.push(userMessage);
      this.histories_.push(
        this.props_.replay.histories.find((h) => h.type === type)!,
      );
    };
    if (state.analyze === null) await take("analyze");
    else if (state.database === null) await take("database");
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

  public async getFiles(
    options?: IAutoBeGetFilesOptions,
  ): Promise<Record<string, string>> {
    return await getAutoBeGenerated({
      compiler: await this.compiler_.get(),
      state: createAutoBeState(this.histories_),
      histories: this.getHistories(),
      tokenUsage: this.getTokenUsage(),
      options,
    });
  }

  public getPhase(): AutoBePhase | null {
    const state: AutoBeState = createAutoBeState(this.histories_);
    if (state.analyze === null) return null;
    else if (state.realize?.step === state.analyze.step) return "realize";
    else if (state.test?.step === state.analyze.step) return "test";
    else if (state.interface?.step === state.analyze.step) return "interface";
    else if (state.database?.step === state.analyze.step) return "database";
    return "analyze";
  }

  private getEventSnapshots(state: AutoBePhase): AutoBeEventSnapshot[] | null {
    return this.props_.replay[state] ?? null;
  }
}
export namespace AutoBeMockAgent {
  export interface IProps {
    compiler: (
      listener: IAutoBeCompilerListener,
    ) => IAutoBeCompiler | Promise<IAutoBeCompiler>;
    replay: IAutoBePlaygroundReplay;
  }
}

const sleepMap: Record<AutoBeEvent.Type, number> = {
  userMessage: 1_000,
  assistantMessage: 1_000,
  vendorRequest: 0,
  vendorResponse: 0,
  vendorTimeout: 0,
  jsonParseError: 0,
  jsonValidateError: 0,
  consentFunctionCall: 0,
  preliminary: 0,
  // DESCRIBE
  imageDescribeStart: 1_000,
  imageDescribeDraft: 300,
  imageDescribeComplete: 1_000,
  // ANALYZE
  analyzeStart: 1_000,
  analyzeScenario: 1_000,
  analyzeWrite: 500,
  analyzeReview: 300,
  analyzeComplete: 1_000,
  // PRISMA
  databaseStart: 1_000,
  databaseComponent: 1_000,
  databaseSchema: 500,
  databaseInsufficient: 1_000,
  databaseReview: 500,
  databaseValidate: 2_000,
  databaseCorrect: 500,
  databaseComplete: 1_000,
  // INTERFACE
  interfaceStart: 1_000,
  interfaceGroup: 1_000,
  interfaceEndpoint: 1_000,
  interfaceEndpointReview: 1_000,
  interfaceOperation: 400,
  interfaceOperationReview: 400,
  interfaceAuthorization: 400,
  interfaceSchema: 400,
  interfaceSchemaReview: 200,
  interfaceSchemaRename: 200,
  interfaceComplement: 2_000,
  interfaceComplete: 1_000,
  interfacePrerequisite: 400,
  // TEST
  testStart: 1_000,
  testScenario: 40,
  testScenarioReview: 40,
  testWrite: 40,
  testValidate: 100,
  testCorrect: 100,
  testComplete: 1_000,
  // REALIZE
  realizeStart: 1_000,
  realizeComplete: 1_000,
  realizePlan: 80,
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

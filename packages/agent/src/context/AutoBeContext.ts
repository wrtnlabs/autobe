import {
  IAgenticaVendor,
  IMicroAgenticaHistoryJson,
  MicroAgentica,
} from "@agentica/core";
import {
  AutoBeAnalyzeHistory,
  AutoBeAssistantMessageEvent,
  AutoBeAssistantMessageHistory,
  AutoBeEvent,
  AutoBeEventSource,
  AutoBeHistory,
  AutoBeInterfaceHistory,
  AutoBePrismaHistory,
  AutoBeRealizeHistory,
  AutoBeTestHistory,
  IAutoBeCompiler,
  IAutoBeCompilerListener,
  IAutoBeGetFilesOptions,
} from "@autobe/interface";
import { ILlmController, ILlmSchema } from "@samchon/openapi";

import { AutoBeState } from "./AutoBeState";
import { AutoBeTokenUsage } from "./AutoBeTokenUsage";

export interface AutoBeContext<Model extends ILlmSchema.Model> {
  // configuration
  model: Model;
  vendor: IAgenticaVendor;
  locale: string;

  // accessors
  compilerListener: IAutoBeCompilerListener;
  compiler: () => Promise<IAutoBeCompiler>;
  files: (options: IAutoBeGetFilesOptions) => Promise<Record<string, string>>;
  histories: () => Readonly<AutoBeHistory[]>;
  state: () => Readonly<AutoBeState>;
  usage: () => AutoBeTokenUsage;

  // events
  dispatch: <Event extends Exclude<AutoBeEvent, AutoBeAssistantMessageEvent>>(
    event: Event,
  ) => AutoBeContext.DispatchHistory<Event>;
  assistantMessage: (
    message: AutoBeAssistantMessageHistory,
  ) => AutoBeAssistantMessageHistory;

  // factories
  createAgent: (
    props: AutoBeContext.IAgentProps<Model>,
  ) => MicroAgentica<Model>;
}
export namespace AutoBeContext {
  export type DispatchHistory<
    Event extends Exclude<AutoBeEvent, AutoBeAssistantMessageEvent>,
  > = Event["type"] extends keyof DispatchHistoryMap
    ? DispatchHistoryMap[Event["type"]]
    : null;
  export type DispatchHistoryMap = {
    assistantMessage: AutoBeAssistantMessageHistory;
    analyzeComplete: AutoBeAnalyzeHistory;
    prismaComplete: AutoBePrismaHistory;
    interfaceComplete: AutoBeInterfaceHistory;
    testComplete: AutoBeTestHistory;
    realizeComplete: AutoBeRealizeHistory;
  };
  export interface IAgentProps<Model extends ILlmSchema.Model> {
    source: AutoBeEventSource;
    controller: ILlmController<Model>;
    histories: Array<IMicroAgenticaHistoryJson>;
    enforceFunctionCall: boolean;
  }
}

import {
  IAgenticaVendor,
  IMicroAgenticaHistoryJson,
  MicroAgentica,
  MicroAgenticaHistory,
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
  IAutoBeTokenUsageJson,
} from "@autobe/interface";
import { ILlmController, ILlmSchema } from "@samchon/openapi";

import { AutoBeState } from "./AutoBeState";
import { AutoBeTokenUsage } from "./AutoBeTokenUsage";

export interface AutoBeContext<Model extends ILlmSchema.Model> {
  // configuration
  model: Model;
  vendor: IAgenticaVendor;
  locale: string;
  retry: number;

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
  conversate(
    props: AutoBeContext.IConversate<Model>,
    closure?: (agent: MicroAgentica<Model>) => void,
  ): Promise<AutoBeContext.IResult<Model>>;
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
  export interface IConversate<Model extends ILlmSchema.Model> {
    source: AutoBeEventSource;
    controller: ILlmController<Model>;
    histories: Array<IMicroAgenticaHistoryJson>;
    enforceFunctionCall: boolean;
    message: string;
    promptCacheKey?: string;
  }
  export interface IResult<Model extends ILlmSchema.Model> {
    histories: MicroAgenticaHistory<Model>[];
    tokenUsage: IAutoBeTokenUsageJson.IComponent;
  }
}

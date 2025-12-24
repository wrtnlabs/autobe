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
  AutoBeFunctionCallingMetric,
  AutoBeHistory,
  AutoBeInterfaceHistory,
  AutoBePhase,
  AutoBePrismaHistory,
  AutoBeProcessAggregateCollection,
  AutoBeRealizeHistory,
  AutoBeTestHistory,
  IAutoBeCompiler,
  IAutoBeCompilerListener,
  IAutoBeGetFilesOptions,
  IAutoBeTokenUsageJson,
} from "@autobe/interface";
import { ILlmController } from "@samchon/openapi";

import { AutoBeState } from "./AutoBeState";
import { AutoBeTokenUsage } from "./AutoBeTokenUsage";

/**
 * Core execution context providing orchestrators access to configuration,
 * state, compiler, events, and AI conversation.
 *
 * Follows Dependency Injection pattern for testability. State transitions are
 * atomic, and event dispatch is type-safe with automatic WebSocket forwarding.
 *
 * Key methods:
 *
 * - `state()`: Current pipeline state with step counters
 * - `compiler()`: Three-tier compilation infrastructure
 * - `dispatch()`: Type-safe event emission with automatic state updates
 * - `conversate()`: Creates MicroAgentica for LLM interactions
 *
 * @author Samchon
 */
export interface AutoBeContext {
  // configuration
  vendor: IAgenticaVendor;
  locale: string;
  retry: number;

  // accessors
  aggregates: AutoBeProcessAggregateCollection;
  compilerListener: IAutoBeCompilerListener;
  compiler: () => Promise<IAutoBeCompiler>;
  files: (options: IAutoBeGetFilesOptions) => Promise<Record<string, string>>;
  histories: () => Readonly<AutoBeHistory[]>;
  state: () => Readonly<AutoBeState>;
  usage: () => AutoBeTokenUsage;
  getCurrentAggregates: (
    phase: AutoBePhase,
  ) => AutoBeProcessAggregateCollection;

  // events
  dispatch: <Event extends Exclude<AutoBeEvent, AutoBeAssistantMessageEvent>>(
    event: Event,
  ) => AutoBeContext.DispatchHistory<Event>;
  assistantMessage: (
    message: AutoBeAssistantMessageHistory,
  ) => AutoBeAssistantMessageHistory;

  // factories
  conversate(
    props: AutoBeContext.IConversate,
    closure?: (agent: MicroAgentica) => void,
  ): Promise<AutoBeContext.IResult>;
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
  export interface IConversate {
    source: AutoBeEventSource;
    controller: ILlmController;
    histories: Array<IMicroAgenticaHistoryJson>;
    enforceFunctionCall: boolean;
    userMessage: string;
    promptCacheKey?: string;
  }
  export interface IResult {
    histories: MicroAgenticaHistory[];
    tokenUsage: IAutoBeTokenUsageJson.IComponent;
    metric: AutoBeFunctionCallingMetric;
  }
}

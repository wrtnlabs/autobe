import { IAgenticaVendor } from "@agentica/core";
import {
  AutoBeAnalyzeHistory,
  AutoBeAssistantMessageEvent,
  AutoBeAssistantMessageHistory,
  AutoBeEvent,
  AutoBeHistory,
  AutoBeInterfaceHistory,
  AutoBePrismaHistory,
  AutoBeRealizeHistory,
  AutoBeTestHistory,
  IAutoBeCompiler,
  IAutoBeCompilerListener,
  IAutoBeGetFilesOptions,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";

import { IAutoBeConfig } from "../structures/IAutoBeConfig";
import { AutoBeState } from "./AutoBeState";
import { AutoBeTokenUsage } from "./AutoBeTokenUsage";

export interface AutoBeContext<Model extends ILlmSchema.Model> {
  model: Model;
  vendor: IAgenticaVendor;
  config: IAutoBeConfig | undefined;
  compilerListener: IAutoBeCompilerListener;
  compiler: () => Promise<IAutoBeCompiler>;
  files: (options: IAutoBeGetFilesOptions) => Promise<Record<string, string>>;
  histories: () => Readonly<AutoBeHistory[]>;
  state: () => Readonly<AutoBeState>;
  usage: () => AutoBeTokenUsage;
  dispatch: <Event extends Exclude<AutoBeEvent, AutoBeAssistantMessageEvent>>(
    event: Event,
  ) => AutoBeContext.DispatchHistory<Event>;
  assistantMessage: (
    message: AutoBeAssistantMessageHistory,
  ) => AutoBeAssistantMessageHistory;
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
}

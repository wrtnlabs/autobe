import {
  AutoBeAnalyzeCompleteEvent,
  AutoBeAnalyzeHistory,
  AutoBeAnalyzeStartEvent,
  AutoBeAssistantMessageEvent,
  AutoBeEvent,
  AutoBeHistory,
  AutoBeInterfaceCompleteEvent,
  AutoBeInterfaceHistory,
  AutoBeInterfaceStartEvent,
  AutoBePrismaCompleteEvent,
  AutoBePrismaHistory,
  AutoBePrismaStartEvent,
  AutoBeRealizeCompleteEvent,
  AutoBeRealizeHistory,
  AutoBeRealizeStartEvent,
  AutoBeTestCompleteEvent,
  AutoBeTestHistory,
  AutoBeTestStartEvent,
  IAutoBeCompiler,
  IAutoBeCompilerListener,
  IAutoBeGetFilesOptions,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import { v4 } from "uuid";

import { AutoBeContext } from "../context/AutoBeContext";
import { AutoBeState } from "../context/AutoBeState";
import { AutoBeTokenUsage } from "../context/AutoBeTokenUsage";
import { IAutoBeConfig } from "../structures/IAutoBeConfig";
import { IAutoBeVendor } from "../structures/IAutoBeVendor";

export const createAutoBeContext = <Model extends ILlmSchema.Model>(props: {
  model: Model;
  vendor: IAutoBeVendor;
  compiler: () => Promise<IAutoBeCompiler>;
  compilerListener: IAutoBeCompilerListener;
  config: IAutoBeConfig;
  state: () => AutoBeState;
  files: (options: IAutoBeGetFilesOptions) => Promise<Record<string, string>>;
  histories: () => AutoBeHistory[];
  usage: () => AutoBeTokenUsage;
  dispatch: (event: AutoBeEvent) => Promise<void>;
}): AutoBeContext<Model> => ({
  model: props.model,
  vendor: props.vendor,
  config: props.config,
  compilerListener: props.compilerListener,
  compiler: props.compiler,
  files: props.files,
  histories: props.histories,
  state: props.state,
  usage: props.usage,
  dispatch: createDispatch(props),
  assistantMessage: (message) => {
    props.histories().push(message);
    setTimeout(() => props.dispatch(message).catch(() => {}));
    return message;
  },
});

const createDispatch = (props: {
  state: () => AutoBeState;
  histories: () => AutoBeHistory[];
  dispatch: (event: AutoBeEvent) => Promise<void>;
}) => {
  let analyzeStart: AutoBeAnalyzeStartEvent | null = null;
  let prismaStart: AutoBePrismaStartEvent | null = null;
  let interfaceStart: AutoBeInterfaceStartEvent | null = null;
  let testStart: AutoBeTestStartEvent | null = null;
  let realizeStart: AutoBeRealizeStartEvent | null = null;
  return <Event extends Exclude<AutoBeEvent, AutoBeAssistantMessageEvent>>(
    event: Event,
  ): AutoBeContext.DispatchHistory<Event> => {
    // dispatch event
    setTimeout(() => props.dispatch(event).catch(() => {}));
    // starts
    if (event.type === "analyzeStart") analyzeStart = event;
    else if (event.type === "prismaStart") prismaStart = event;
    else if (event.type === "interfaceStart") interfaceStart = event;
    else if (event.type === "testStart") testStart = event;
    else if (event.type === "realizeStart") realizeStart = event;
    // completes
    else if (event.type === "analyzeComplete") {
      const history: AutoBeAnalyzeHistory = {
        type: "analyze",
        id: v4(),
        reason: analyzeStart?.reason ?? "",
        prefix: event.prefix,
        roles: event.roles,
        files: event.files,
        created_at: analyzeStart?.created_at ?? new Date().toISOString(),
        completed_at: event.created_at,
        step: event.step,
      };
      props.state().analyze = history;
      props.histories().push(history);
      return history satisfies AutoBeContext.DispatchHistory<AutoBeAnalyzeCompleteEvent> as AutoBeContext.DispatchHistory<Event>;
    } else if (event.type === "prismaComplete") {
      const history: AutoBePrismaHistory = {
        type: "prisma",
        id: v4(),
        reason: prismaStart?.reason ?? "",
        schemas: event.schemas,
        result: event.result,
        compiled: event.compiled,
        created_at: prismaStart?.created_at ?? new Date().toISOString(),
        completed_at: event.created_at,
        step: event.step,
      };
      props.state().prisma = history;
      props.histories().push(history);
      return history satisfies AutoBeContext.DispatchHistory<AutoBePrismaCompleteEvent> as AutoBeContext.DispatchHistory<Event>;
    } else if (event.type === "interfaceComplete") {
      const history: AutoBeInterfaceHistory = {
        type: "interface",
        id: v4(),
        reason: interfaceStart?.reason ?? "",
        document: event.document,
        created_at: interfaceStart?.created_at ?? new Date().toISOString(),
        completed_at: new Date().toISOString(),
        step: event.step,
      };
      props.state().interface = history;
      props.histories().push(history);
      return history satisfies AutoBeContext.DispatchHistory<AutoBeInterfaceCompleteEvent> as AutoBeContext.DispatchHistory<Event>;
    } else if (event.type === "testComplete") {
      const history: AutoBeTestHistory = {
        type: "test",
        id: v4(),
        reason: testStart?.reason ?? "",
        files: event.files,
        compiled: event.compiled,
        created_at: testStart?.created_at ?? new Date().toISOString(),
        completed_at: new Date().toISOString(),
        step: event.step,
      };
      props.state().test = history;
      props.histories().push(history);
      return history satisfies AutoBeContext.DispatchHistory<AutoBeTestCompleteEvent> as AutoBeContext.DispatchHistory<Event>;
    } else if (event.type === "realizeComplete") {
      const history: AutoBeRealizeHistory = {
        type: "realize",
        id: v4(),
        reason: realizeStart?.reason ?? "",
        authorizations: event.authorizations,
        functions: event.functions,
        controllers: event.controllers,
        compiled: event.compiled,
        created_at: realizeStart?.created_at ?? new Date().toISOString(),
        completed_at: new Date().toISOString(),
        step: event.step,
      };
      props.state().realize = history;
      props.histories().push(history);
      return history satisfies AutoBeContext.DispatchHistory<AutoBeRealizeCompleteEvent> as AutoBeContext.DispatchHistory<Event>;
    }
    return null as AutoBeContext.DispatchHistory<Event>;
  };
};

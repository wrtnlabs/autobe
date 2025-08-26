import { MicroAgentica, MicroAgenticaHistory } from "@agentica/core";
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
  IAutoBeTokenUsageJson,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../context/AutoBeContext";
import { AutoBeState } from "../context/AutoBeState";
import { AutoBeTokenUsage } from "../context/AutoBeTokenUsage";
import { AutoBeTokenUsageComponent } from "../context/AutoBeTokenUsageComponent";
import { IAutoBeApplication } from "../context/IAutoBeApplication";
import { IAutoBeConfig } from "../structures/IAutoBeConfig";
import { IAutoBeVendor } from "../structures/IAutoBeVendor";
import { consentFunctionCall } from "./consentFunctionCall";

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
  locale: props.config.locale ?? "en-US",
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
  conversate: async (next) => {
    const execute = async (): Promise<AutoBeContext.IResult<Model>> => {
      const agent: MicroAgentica<Model> = new MicroAgentica<Model>({
        model: props.model,
        vendor: props.vendor,
        config: {
          ...(props.config ?? {}),
          executor: {
            describe: null,
          },
        },
        histories: next.histories,
        controllers: [next.controller],
      });
      agent.on("request", async (event) => {
        if (next.enforceFunctionCall === true && event.body.tools)
          event.body.tool_choice = "required";
        if (event.body.parallel_tool_calls !== undefined)
          delete event.body.parallel_tool_calls;
        await props.dispatch({
          ...event,
          type: "vendorRequest",
          source: next.source,
        });
      });
      agent.on("response", (event) => {
        void props
          .dispatch({
            ...event,
            type: "vendorResponse",
            source: next.source,
          })
          .catch(() => {});
      });
      agent.on("jsonParseError", (event) => {
        void props
          .dispatch({
            ...event,
            source: next.source,
          })
          .catch(() => {});
      });
      agent.on("validate", (event) => {
        void props
          .dispatch({
            type: "jsonValidateError",
            id: v7(),
            source: next.source,
            result: event.result,
            created_at: event.created_at,
          })
          .catch(() => {});
      });

      const histories: MicroAgenticaHistory<Model>[] = await agent.conversate(
        next.message,
      );
      const tokenUsage: IAutoBeTokenUsageJson.IComponent = agent
        .getTokenUsage()
        .toJSON().aggregate;
      props
        .usage()
        .record(tokenUsage, [
          STAGES.find((stage) => next.source.startsWith(stage)) ?? "analyze",
        ]);

      if (
        true === next.enforceFunctionCall &&
        false ===
          histories.some((h) => h.type === "execute" && h.success === true)
      ) {
        const failure = () => {
          throw new Error(
            `Failed to function calling in the ${next.source} step`,
          );
        };
        const last: MicroAgenticaHistory<Model> | undefined = histories.at(-1);
        if (
          last?.type === "assistantMessage" &&
          last.text.trim().length !== 0
        ) {
          const consent: string | null = await consentFunctionCall({
            source: next.source,
            dispatch: (e) => {
              props.dispatch(e).catch(() => {});
            },
            config: props.config,
            vendor: props.vendor,
            assistantMessage: last.text,
          });
          if (consent !== null) {
            const newHistories: MicroAgenticaHistory<Model>[] =
              await agent.conversate(consent);
            const newTokenUsage: IAutoBeTokenUsageJson.IComponent = agent
              .getTokenUsage()
              .toJSON().aggregate;
            props
              .usage()
              .record(
                AutoBeTokenUsageComponent.minus(
                  new AutoBeTokenUsageComponent(newTokenUsage),
                  new AutoBeTokenUsageComponent(tokenUsage),
                ),
                [
                  STAGES.find((stage) => next.source.startsWith(stage)) ??
                    "analyze",
                ],
              );
            if (
              newHistories.some(
                (h) => h.type === "execute" && h.success === true,
              )
            )
              return {
                histories: newHistories,
                tokenUsage: newTokenUsage,
              };
          }
        }
        failure();
      }
      return { histories, tokenUsage };
    };
    if (next.enforceFunctionCall === true) return forceRetry(execute);
    else return execute();
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
    // starts
    if (event.type === "analyzeStart") analyzeStart = event;
    else if (event.type === "prismaStart") prismaStart = event;
    else if (event.type === "interfaceStart") interfaceStart = event;
    else if (event.type === "testStart") testStart = event;
    else if (event.type === "realizeStart") realizeStart = event;
    // completes
    else if (event.type === "analyzeComplete")
      return transformAndDispatch<AutoBeAnalyzeCompleteEvent>({
        dispatch: props.dispatch,
        histories: props.histories,
        state: props.state,
        event,
        history: {
          type: "analyze",
          id: v7(),
          reason: analyzeStart?.reason ?? "",
          prefix: event.prefix,
          roles: event.roles,
          files: event.files,
          created_at: analyzeStart?.created_at ?? new Date().toISOString(),
          completed_at: event.created_at,
          step: event.step,
        } satisfies AutoBeAnalyzeHistory,
      }) as AutoBeContext.DispatchHistory<Event>;
    else if (event.type === "prismaComplete")
      return transformAndDispatch<AutoBePrismaCompleteEvent>({
        dispatch: props.dispatch,
        histories: props.histories,
        state: props.state,
        event,
        history: {
          type: "prisma",
          id: v7(),
          reason: prismaStart?.reason ?? "",
          schemas: event.schemas,
          result: event.result,
          compiled: event.compiled,
          created_at: prismaStart?.created_at ?? new Date().toISOString(),
          completed_at: event.created_at,
          step: event.step,
        } satisfies AutoBePrismaHistory,
      }) as AutoBeContext.DispatchHistory<Event>;
    else if (event.type === "interfaceComplete")
      return transformAndDispatch({
        dispatch: props.dispatch,
        histories: props.histories,
        state: props.state,
        event,
        history: {
          type: "interface",
          id: v7(),
          reason: interfaceStart?.reason ?? "",
          authorizations: event.authorizations,
          document: event.document,
          created_at: interfaceStart?.created_at ?? new Date().toISOString(),
          completed_at: new Date().toISOString(),
          step: event.step,
        } satisfies AutoBeInterfaceHistory,
      }) as AutoBeContext.DispatchHistory<Event>;
    else if (event.type === "testComplete")
      return transformAndDispatch<AutoBeTestCompleteEvent>({
        dispatch: props.dispatch,
        histories: props.histories,
        state: props.state,
        event,
        history: {
          type: "test",
          id: v7(),
          reason: testStart?.reason ?? "",
          files: event.files,
          compiled: event.compiled,
          created_at: testStart?.created_at ?? new Date().toISOString(),
          completed_at: new Date().toISOString(),
          step: event.step,
        } satisfies AutoBeTestHistory,
      }) as AutoBeContext.DispatchHistory<Event>;
    else if (event.type === "realizeComplete")
      return transformAndDispatch<AutoBeRealizeCompleteEvent>({
        dispatch: props.dispatch,
        histories: props.histories,
        state: props.state,
        event,
        history: {
          type: "realize",
          id: v7(),
          reason: realizeStart?.reason ?? "",
          authorizations: event.authorizations,
          functions: event.functions,
          controllers: event.controllers,
          compiled: event.compiled,
          created_at: realizeStart?.created_at ?? new Date().toISOString(),
          completed_at: new Date().toISOString(),
          step: event.step,
        } satisfies AutoBeRealizeHistory,
      }) as AutoBeContext.DispatchHistory<Event>;
    props.dispatch(event).catch(() => {});
    return null as AutoBeContext.DispatchHistory<Event>;
  };
};

const transformAndDispatch = <
  Event extends
    | AutoBeAnalyzeCompleteEvent
    | AutoBePrismaCompleteEvent
    | AutoBeInterfaceCompleteEvent
    | AutoBeTestCompleteEvent
    | AutoBeRealizeCompleteEvent,
>(props: {
  dispatch: (event: Event) => Promise<void>;
  histories: () => AutoBeHistory[];
  state: () => AutoBeState;
  event: Event;
  history: NonNullable<AutoBeContext.DispatchHistory<Event>>;
}): NonNullable<AutoBeContext.DispatchHistory<Event>> => {
  props.histories().push(props.history);
  props.state()[props.history.type] = props.history as any;
  props.dispatch(props.event).catch(() => {});
  return props.history;
};

const forceRetry = async <T>(
  task: () => Promise<T>,
  count: number = 3,
): Promise<T> => {
  let error: unknown = undefined;
  for (let i: number = 0; i < count; ++i)
    try {
      return await task();
    } catch (e) {
      error = e;
    }
  throw error;
};

const STAGES = typia.misc.literals<keyof IAutoBeApplication>();

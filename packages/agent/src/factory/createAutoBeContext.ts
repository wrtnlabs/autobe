import {
  AgenticaJsonParseError,
  AgenticaValidationError,
  IMicroAgenticaConfig,
  MicroAgentica,
  MicroAgenticaHistory,
} from "@agentica/core";
import {
  AutoBeAnalyzeCompleteEvent,
  AutoBeAnalyzeHistory,
  AutoBeAnalyzeStartEvent,
  AutoBeAssistantMessageEvent,
  AutoBeDatabaseCompleteEvent,
  AutoBeDatabaseHistory,
  AutoBeDatabaseStartEvent,
  AutoBeEvent,
  AutoBeFunctionCallingMetric,
  AutoBeHistory,
  AutoBeInterfaceCompleteEvent,
  AutoBeInterfaceHistory,
  AutoBeInterfaceStartEvent,
  AutoBePhase,
  AutoBeProcessAggregate,
  AutoBeProcessAggregateCollection,
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
import {
  AutoBeProcessAggregateFactory,
  StringUtil,
  TokenUsageComputer,
} from "@autobe/utils";
import { APIError } from "openai";
import { Semaphore, Singleton } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeConfigConstant } from "../constants/AutoBeConfigConstant";
import { AutoBeContext } from "../context/AutoBeContext";
import { AutoBeState } from "../context/AutoBeState";
import { AutoBeTokenUsage } from "../context/AutoBeTokenUsage";
import { AutoBeTokenUsageComponent } from "../context/AutoBeTokenUsageComponent";
import { IAutoBeConfig } from "../structures/IAutoBeConfig";
import { IAutoBeVendor } from "../structures/IAutoBeVendor";
import { TimedConversation } from "../utils/TimedConversation";
import { forceRetry } from "../utils/forceRetry";
import { consentFunctionCall } from "./consentFunctionCall";
import { getCommonPrompt } from "./getCommonPrompt";
import { getCriticalCompiler } from "./getCriticalCompiler";
import { supportMistral } from "./supportMistral";

export const createAutoBeContext = (props: {
  vendor: IAutoBeVendor;
  compiler: () => Promise<IAutoBeCompiler>;
  compilerListener: IAutoBeCompilerListener;
  config: IAutoBeConfig;
  state: () => AutoBeState;
  files: (options: IAutoBeGetFilesOptions) => Promise<Record<string, string>>;
  histories: () => AutoBeHistory[];
  usage: () => AutoBeTokenUsage;
  dispatch: (event: AutoBeEvent) => Promise<void>;
  aggregates: AutoBeProcessAggregateCollection;
}): AutoBeContext => {
  const config: Required<Omit<IAutoBeConfig, "backoffStrategy" | "timezone">> =
    {
      retry: props.config.retry ?? AutoBeConfigConstant.RETRY,
      locale: props.config.locale ?? "en-US",
      timeout: props.config.timeout ?? null,
    };
  const critical: Semaphore = new Semaphore(2);
  return {
    vendor: props.vendor,
    retry: config.retry,
    locale: config.locale,
    aggregates: props.aggregates,
    compilerListener: props.compilerListener,
    compiler: async () => {
      const compiler = await props.compiler();
      return getCriticalCompiler(critical, compiler);
    },
    files: props.files,
    histories: props.histories,
    state: props.state,
    usage: props.usage,
    dispatch: createDispatch(props),
    assistantMessage: (message) => {
      props.histories().push(message);
      setTimeout(() => {
        void props.dispatch(message).catch(() => {});
      });
      return message;
    },
    conversate: async (next, closure): Promise<AutoBeContext.IResult> => {
      const aggregate: AutoBeProcessAggregate =
        AutoBeProcessAggregateFactory.createAggregate();
      const progress: IProgress = {
        request: 0,
        response: 0,
        timeout: 0,
      };

      const metric = (key: keyof AutoBeFunctionCallingMetric): void => {
        const accumulate = (collection: AutoBeProcessAggregateCollection) => {
          ++collection.total.metric[key];
          collection[next.source as "analyzeWrite"] ??=
            AutoBeProcessAggregateFactory.createAggregate();
          ++collection[next.source as "analyzeWrite"]!.metric[key];
        };
        ++aggregate.metric[key];
        accumulate(props.aggregates);
      };

      const consume = (tokenUsage: IAutoBeTokenUsageJson.IComponent): void => {
        const accumulate = (
          collection: AutoBeProcessAggregateCollection,
        ): void => {
          TokenUsageComputer.increment(collection.total.tokenUsage, tokenUsage);
          collection[next.source as "analyzeWrite"] ??=
            AutoBeProcessAggregateFactory.createAggregate();
          TokenUsageComputer.increment(
            collection[next.source as "analyzeWrite"]!.tokenUsage,
            tokenUsage,
          );
        };
        TokenUsageComputer.increment(aggregate.tokenUsage, tokenUsage);
        accumulate(props.aggregates);
        props
          .usage()
          .record(tokenUsage, [
            STAGES.find((stage) => next.source.startsWith(stage)) ?? "analyze",
          ]);
      };

      const execute = async (): Promise<AutoBeContext.IResult> => {
        // CREATE AGENT
        const agent: MicroAgentica = new MicroAgentica({
          vendor: props.vendor,
          config: {
            ...(props.config ?? {}),
            executor: {
              describe: false,
            },
            systemPrompt: {
              common: () => getCommonPrompt(props.config),
            },
            retry: props.config?.retry ?? AutoBeConfigConstant.RETRY,
          } satisfies IMicroAgenticaConfig,
          histories: next.histories,
          controllers: [next.controller],
        });
        supportMistral(agent, props.vendor);

        // ADD EVENT LISTENERS
        agent.on("request", async (event): Promise<void> => {
          if (
            next.enforceFunctionCall === true &&
            !!event.body.tools?.length &&
            (props.vendor.useToolChoice ?? true) === true
          )
            event.body.tool_choice = "required";
          if (event.body.parallel_tool_calls !== undefined)
            delete event.body.parallel_tool_calls;
          if (next.promptCacheKey)
            event.body.prompt_cache_key = next.promptCacheKey;
          await props.dispatch({
            ...event,
            type: "vendorRequest",
            source: next.source,
            retry: progress.request++,
          });
        });
        agent.on("response", (event) => {
          void props
            .dispatch({
              ...event,
              type: "vendorResponse",
              source: next.source,
              retry: progress.response++,
            })
            .catch(() => {});
        });
        agent.on("call", () => {
          metric("attempt");
        });
        agent.on("jsonParseError", (event) => {
          metric("invalidJson");
          void props
            .dispatch({
              ...event,
              function: event.operation.function.name,
              source: next.source,
            })
            .catch(() => {});
        });
        agent.on("validate", (event) => {
          metric("validationFailure");
          void props
            .dispatch({
              type: "jsonValidateError",
              id: v7(),
              source: next.source,
              function: event.operation.function.name,
              result: event.result,
              life: event.life,
              created_at: event.created_at,
            })
            .catch(() => {});
        });
        if (closure) closure(agent);

        // DO CONVERSATE
        const message: string =
          next.enforceFunctionCall === true
            ? StringUtil.trim`
                ${next.userMessage}

                > You have to call function(s) of below to accomplish my request.
                >
                > Never hesitate the function calling. Never ask for me permission 
                > to execute the function. Never explain me your plan with waiting
                > for my approval.
                >
                > I gave you every information for the function calling, so just 
                > call it. I repeat that, never hesitate the function calling. 
                > Just do it without any explanation.
                >
                ${next.controller.application.functions
                  .map((f) => `> - ${f.name}`)
                  .join("\n")}
              `
            : next.userMessage;
        const result: TimedConversation.IResult =
          await TimedConversation.process({
            timeout: config.timeout,
            agent,
            message,
          });
        const tokenUsage: IAutoBeTokenUsageJson.IComponent = agent
          .getTokenUsage()
          .toJSON().aggregate;
        props
          .usage()
          .record(tokenUsage, [
            STAGES.find((stage) => next.source.startsWith(stage)) ?? "analyze",
          ]);
        consume(tokenUsage);

        const success = (histories: MicroAgenticaHistory[]) => {
          metric("success");
          return {
            histories,
            tokenUsage: aggregate.tokenUsage,
            metric: aggregate.metric,
            __agent: agent,
          };
        };
        if (result.type === "error") throw result.error;
        else if (result.type === "timeout") {
          void props
            .dispatch({
              type: "vendorTimeout",
              id: v7(),
              source: next.source,
              timeout: config.timeout!,
              retry: progress.timeout++,
              created_at: new Date().toISOString(),
            })
            .catch(() => {});
          throw result.error;
        } else if (
          true === next.enforceFunctionCall &&
          false === result.histories.some((h) => h.type === "execute")
        ) {
          const failure = () => {
            throw new Error(
              StringUtil.trim`
                Failed to function calling in the ${next.source} step.

                Here is the list of history types that occurred during the conversation:

                ${result.histories.map((h) => `- ${h.type}`).join("\n")}

                \`\`\`json
                ${JSON.stringify(result.histories, null, 2)}
                \`\`\`
              `,
            );
          };
          const last: MicroAgenticaHistory | undefined =
            result.histories.at(-1);
          if (
            last?.type === "assistantMessage" &&
            last.text.trim().length !== 0
          ) {
            metric("consent");
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
              const newHistories: MicroAgenticaHistory[] =
                await agent.conversate(consent);
              const newTokenUsage: IAutoBeTokenUsageJson.IComponent =
                AutoBeTokenUsageComponent.minus(
                  new AutoBeTokenUsageComponent(
                    agent.getTokenUsage().toJSON().aggregate,
                  ),
                  new AutoBeTokenUsageComponent(tokenUsage),
                );
              consume(newTokenUsage);
              if (newHistories.some((h) => h.type === "execute"))
                return success(newHistories);
            }
          }
          failure();
        }
        return success(result.histories);
      };
      return await forceRetry(
        execute,
        AutoBeConfigConstant.FUNCTION_CALLING_RETRY,
        (error) =>
          error instanceof APIError ||
          error instanceof AgenticaJsonParseError ||
          error instanceof AgenticaValidationError ||
          (error instanceof TypeError && error.message === "terminated") ||
          (error instanceof Error &&
            OPENAI_API_ERROR_KEYS.get().every((key) =>
              error.hasOwnProperty(key),
            )),
      );
    },
    getCurrentAggregates: (phase) => {
      const previous: AutoBeProcessAggregateCollection =
        AutoBeProcessAggregateFactory.reduce(
          props
            .histories()
            .filter(
              (h) =>
                h.type === "analyze" ||
                h.type === "database" ||
                h.type === "interface" ||
                h.type === "test" ||
                h.type === "realize",
            )
            .map((h) => h.aggregates),
        );
      return AutoBeProcessAggregateFactory.filterPhase(
        AutoBeProcessAggregateFactory.minus(props.aggregates, previous),
        phase,
      );
    },
  };
};

const createDispatch = (props: {
  state: () => AutoBeState;
  histories: () => AutoBeHistory[];
  dispatch: (event: AutoBeEvent) => Promise<void>;
}) => {
  let analyzeStart: AutoBeAnalyzeStartEvent | null = null;
  let databaseStart: AutoBeDatabaseStartEvent | null = null;
  let interfaceStart: AutoBeInterfaceStartEvent | null = null;
  let testStart: AutoBeTestStartEvent | null = null;
  let realizeStart: AutoBeRealizeStartEvent | null = null;
  return <Event extends Exclude<AutoBeEvent, AutoBeAssistantMessageEvent>>(
    event: Event,
  ): AutoBeContext.DispatchHistory<Event> => {
    // starts
    if (event.type === "analyzeStart") analyzeStart = event;
    else if (event.type === "databaseStart") databaseStart = event;
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
          prefix: event.prefix,
          actors: event.actors,
          files: event.files,
          aggregates: event.aggregates,
          step: event.step,
          created_at: analyzeStart?.created_at ?? new Date().toISOString(),
          completed_at: event.created_at,
        } satisfies AutoBeAnalyzeHistory,
      }) as AutoBeContext.DispatchHistory<Event>;
    else if (event.type === "databaseComplete")
      return transformAndDispatch<AutoBeDatabaseCompleteEvent>({
        dispatch: props.dispatch,
        histories: props.histories,
        state: props.state,
        event,
        history: {
          type: "database",
          id: v7(),
          instruction: databaseStart?.reason ?? "",
          schemas: event.schemas,
          result: event.result,
          compiled: event.compiled,
          aggregates: event.aggregates,
          step: event.step,
          created_at: databaseStart?.created_at ?? new Date().toISOString(),
          completed_at: event.created_at,
        } satisfies AutoBeDatabaseHistory,
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
          instruction: interfaceStart?.reason ?? "",
          authorizations: event.authorizations,
          document: event.document,
          missed: event.missed,
          aggregates: event.aggregates,
          step: event.step,
          created_at: interfaceStart?.created_at ?? new Date().toISOString(),
          completed_at: new Date().toISOString(),
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
          instruction: testStart?.reason ?? "",
          functions: event.functions,
          compiled: event.compiled,
          aggregates: event.aggregates,
          step: event.step,
          created_at: testStart?.created_at ?? new Date().toISOString(),
          completed_at: new Date().toISOString(),
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
          instruction: realizeStart?.reason ?? "",
          authorizations: event.authorizations,
          functions: event.functions,
          controllers: event.controllers,
          compiled: event.compiled,
          aggregates: event.aggregates,
          step: event.step,
          created_at: realizeStart?.created_at ?? new Date().toISOString(),
          completed_at: new Date().toISOString(),
        } satisfies AutoBeRealizeHistory,
      }) as AutoBeContext.DispatchHistory<Event>;
    void props.dispatch(event).catch(() => {});
    return null as AutoBeContext.DispatchHistory<Event>;
  };
};

const transformAndDispatch = <
  Event extends
    | AutoBeAnalyzeCompleteEvent
    | AutoBeDatabaseCompleteEvent
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
  void props.dispatch(props.event).catch(() => {});
  return props.history;
};

const STAGES =
  typia.misc.literals<
    keyof Pick<IAutoBeTokenUsageJson, "facade" | AutoBePhase>
  >();

const OPENAI_API_ERROR_KEYS = new Singleton(() =>
  Object.keys(new APIError(undefined, undefined, undefined, undefined)),
);

interface IProgress {
  request: number;
  response: number;
  timeout: number;
}

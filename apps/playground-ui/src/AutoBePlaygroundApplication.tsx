import {
  IAutoBePlaygroundHeader,
  IAutoBePlaygroundVendor,
} from "@autobe/interface";
import pApi from "@autobe/playground-api";
import { AutoBeListener, IAutoBeConfig, IAutoBeServiceData } from "@autobe/ui";
import { ILlmSchema } from "@samchon/openapi";
import { useRef } from "react";

import { AutoBePlaygroundChatMovie } from "./movies/chat/AutoBePlaygroundChatMovie";
import { AutoBeAgentSessionStorageIndexedDBStrategy } from "./strategy/AutoBeAgentSessionStorageIndexedDBStrategy";

export function AutoBePlaygroundApplication() {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Playground service factory
  const serviceFactory = async (
    config: IAutoBeConfig,
  ): Promise<IAutoBeServiceData> => {
    // Set playground defaults
    const playgroundConfig = {
      ...config,
      serverUrl: String(config["serverUrl"] ?? "http://127.0.0.1:5890"), // Default for playground
    };

    const vendorConfig: IAutoBePlaygroundVendor = {
      model: playgroundConfig.aiModel ?? "gpt-4.1",
      apiKey: playgroundConfig.openApiKey ?? "",
      baseURL: playgroundConfig.baseUrl ?? undefined,
      semaphore: playgroundConfig.semaphore ?? 16,
    };

    const headers: IAutoBePlaygroundHeader<ILlmSchema.Model> = {
      model: (playgroundConfig.schemaModel ?? "chatgpt") as Exclude<
        ILlmSchema.Model,
        "gemini" | "3.0"
      >,
      vendor: vendorConfig,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: playgroundConfig.locale ?? window.navigator.language,
    };
    const listener = new AutoBeListener();
    const { service, sessionId } = await (async () => {
      const connection = {
        host: playgroundConfig.serverUrl,
        headers: headers as unknown as Record<string, string>,
      };

      const sessionId =
        config.sessionId != null && typeof config.sessionId === "string"
          ? config.sessionId
          : globalThis.crypto.randomUUID();
      return {
        service: await pApi.functional.autobe.playground
          .start(connection, listener.getListener())
          .then((v) => v.driver),
        sessionId: sessionId,
      };
    })();

    return {
      service,
      sessionId,
      listener,
    };
  };

  return (
    <div
      ref={scrollRef}
      style={{
        width: "100%",
        height: "100%",
        overflow: "auto",
      }}
    >
      <AutoBePlaygroundChatMovie
        title="AutoBE Playground"
        serviceFactory={serviceFactory}
        storageStrategyFactory={() =>
          new AutoBeAgentSessionStorageIndexedDBStrategy()
        }
      />
    </div>
  );
}

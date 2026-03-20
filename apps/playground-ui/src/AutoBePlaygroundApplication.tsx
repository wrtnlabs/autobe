import pApi from "@autobe/playground-api";
import { AutoBeListener, IAutoBeConfig, IAutoBeServiceData } from "@autobe/ui";
import { useEffect, useRef } from "react";

import { AutoBePlaygroundChatMovie } from "./movies/chat/AutoBePlaygroundChatMovie";
import { AutoBeAgentSessionStorageServerStrategy } from "./strategy/AutoBeAgentSessionStorageServerStrategy";
import { getServerUrl } from "./utils/connection";
import { getGlobalConfig } from "./utils/globalConfig";

export function AutoBePlaygroundApplication() {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Seed localStorage with global config defaults on first visit
  useEffect(() => {
    getGlobalConfig().then((cfg) => {
      if (cfg.default_model && !localStorage.getItem("autobe_ai_model")) {
        localStorage.setItem("autobe_ai_model", cfg.default_model);
      }
    });
  }, []);

  // Playground service factory
  const serviceFactory = async (
    config: IAutoBeConfig,
  ): Promise<IAutoBeServiceData> => {
    const serverUrl = getServerUrl();
    const connection = { host: serverUrl };
    const listener = new AutoBeListener();
    const globalConfig = await getGlobalConfig();

    let sessionId: string;

    if (config.sessionId != null && typeof config.sessionId === "string") {
      // Reconnecting to existing session
      sessionId = config.sessionId;
    } else {
      // Create or reuse vendor on the server
      const vendorId = await getOrCreateVendor(connection, {
        name: String(config["vendorName"] ?? "default"),
        apiKey: String(config.openApiKey ?? ""),
        baseURL: config.baseUrl || undefined,
        semaphore: config.semaphore ?? 16,
      });

      // Create new session on the server
      const session =
        await pApi.functional.autobe.playground.sessions.create(connection, {
          vendor_id: vendorId,
          model: config.aiModel ?? globalConfig.default_model ?? "gpt-4.1",
          locale:
            config.locale ??
            globalConfig.locale ??
            window.navigator.language,
          timezone:
            globalConfig.timezone ??
            Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
      sessionId = session.id;
    }

    // Connect to session via WebSocket
    const { driver: service, connector } =
      await pApi.functional.autobe.playground.sessions.connect(
        connection,
        sessionId,
        listener.getListener(),
      );

    return {
      service,
      sessionId,
      listener,
      close: () => connector.close(),
    } satisfies IAutoBeServiceData;
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
          new AutoBeAgentSessionStorageServerStrategy()
        }
      />
    </div>
  );
}

async function getOrCreateVendor(
  connection: { host: string },
  config: {
    name: string;
    apiKey?: string;
    baseURL?: string;
    semaphore?: number;
  },
): Promise<string> {
  // 1. Fetch all vendors from server, find by name
  const { data: vendors } =
    await pApi.functional.autobe.playground.vendors.index(connection, {});
  const existing = vendors.find((v) => v.name === config.name);

  if (existing) {
    // Vendor already registered — update only if new API key provided
    if (config.apiKey) {
      await pApi.functional.autobe.playground.vendors.update(
        connection,
        existing.id as any,
        {
          apiKey: config.apiKey,
          baseURL: config.baseURL || null,
          semaphore: config.semaphore,
        },
      );
    }
    localStorage.setItem("autobe_vendor_id", existing.id);
    return existing.id;
  }

  // 2. New vendor — API key is required
  if (!config.apiKey) {
    throw new Error(
      `Vendor "${config.name}" not found. API Key is required to register a new vendor.`,
    );
  }

  const vendor = await pApi.functional.autobe.playground.vendors.create(
    connection,
    {
      name: config.name,
      apiKey: config.apiKey,
      baseURL: config.baseURL || null,
      semaphore: config.semaphore,
    },
  );
  localStorage.setItem("autobe_vendor_id", vendor.id);
  return vendor.id;
}

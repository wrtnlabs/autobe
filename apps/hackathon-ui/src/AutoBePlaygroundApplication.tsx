import hApi from "@autobe/hackathon-api";
import {
  AutoBeListener,
  IAutoBeConfig,
  getAutoBeAgentSession,
} from "@autobe/ui";
import { useRef } from "react";

import { AutoBePlaygroundChatMovie } from "./AutoBePlaygroundChatMovie";
import { HACKATHON_CODE } from "./constant";
import { useAuthorizationToken } from "./hooks/useAuthorizationToken";
import { AutoBeAgentSessionStorageStrategy } from "./strategy/AutoBeAgentSessionStorageStrategy";

export function AutoBePlaygroundApplication() {
  const { getToken } = useAuthorizationToken();
  const token = getToken();
  /** @todo Process refresh token logic */
  if (token === null || new Date(token.token.expired_at) < new Date()) {
    window.location.href = "/login";
    return;
  }

  const scrollRef = useRef<HTMLDivElement>(null);

  // Playground service factory
  const serviceFactory = async (config: IAutoBeConfig) => {
    const listener = new AutoBeListener();
    const service = await (() => {
      if (config.sessionId != null && typeof config.sessionId === "string") {
        return hApi.autobe.hackathon.participants.sessions.restart(
          {
            host: import.meta.env.VITE_API_BASE_URL,
            headers: {
              Authorization: `Bearer ${token.token.access}`,
              model: config.aiModel,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
          },
          HACKATHON_CODE,
          config.sessionId,
          listener.getListener(),
        );
      }

      return hApi.autobe.hackathon.participants.sessions.start(
        {
          host: import.meta.env.VITE_API_BASE_URL,
          headers: {
            Authorization: `Bearer ${token.token.access}`,
            model: config.aiModel,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        },
        HACKATHON_CODE,
        listener.getListener(),
      );
    })().then((v) => v.driver);
    return {
      service,
      listener,
      uploadConfig: {
        supportAudio: config.supportAudioEnable ?? false,
      },
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
        storageStrategyFactory={() => new AutoBeAgentSessionStorageStrategy()}
        configFilter={(config) => config.key === "aiModel"}
      />
    </div>
  );
}

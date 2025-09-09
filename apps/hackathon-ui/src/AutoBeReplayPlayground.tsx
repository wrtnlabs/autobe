import hApi from "@autobe/hackathon-api";
import {
  AutoBeListener,
  IAutoBeConfig,
  SearchParamsProvider,
} from "@autobe/ui";
import { useRef } from "react";

import { AutoBePlaygroundChatMovie } from "./AutoBePlaygroundChatMovie";
import { HACKATHON_CODE } from "./constant";
import { useAuthorizationToken } from "./hooks/useAuthorizationToken";
import { AutoBeAgentSessionStorageMockStrategy } from "./strategy/AutoBeAgentSessionStorageMockStrategy";

export function AutoBeReplayPlayground() {
  const { getToken } = useAuthorizationToken();
  const token = getToken();
  /** @todo Process refresh token logic */
  if (token === null || new Date(token.token.expired_at) < new Date()) {
    window.location.href = "/login";
    return null;
  }

  const scrollRef = useRef<HTMLDivElement>(null);

  // Playground service factory
  const serviceFactory = async (config: IAutoBeConfig) => {
    const listener = new AutoBeListener();
    const { service, sessionId } = await (async () => {
      const connection = {
        host: import.meta.env.VITE_API_BASE_URL,
        headers: {
          Authorization: `Bearer ${token.token.access}`,
          model: config.aiModel,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      };

      if (config.sessionId != null && typeof config.sessionId === "string") {
        return {
          service: await hApi.functional.autobe.hackathon.participants.sessions
            .replay(
              connection,
              HACKATHON_CODE,
              config.sessionId,
              listener.getListener(),
            )
            .then((v) => v.driver),
          sessionId: config.sessionId,
        };
      }

      window.location.href = "/";
      throw new Error("Session ID is required");
    })();

    return {
      service,
      sessionId,
      listener,
      uploadConfig: {
        supportAudio: config.supportAudioEnable ?? false,
      },
    };
  };

  return (
    <SearchParamsProvider>
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
            new AutoBeAgentSessionStorageMockStrategy()
          }
          configFilter={(config) => config.key === "aiModel"}
          isReplay={true}
        />
      </div>
    </SearchParamsProvider>
  );
}

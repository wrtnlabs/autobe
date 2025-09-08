import hApi from "@autobe/hackathon-api";
import {
  AutoBeListener,
  IAutoBeConfig,
  getAutoBeAgentSession,
} from "@autobe/ui";
import { ILlmSchema } from "@samchon/openapi";
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
    const autoBeListener: AutoBeListener = new AutoBeListener();
    console.log("config", config);
    const wrapper = await getAutoBeAgentSession({
      storageStrategy: new AutoBeAgentSessionStorageStrategy(),
      listener: autoBeListener,
      connect: () =>
        hApi.autobe.hackathon.participants.sessions
          .start(
            {
              host: import.meta.env.VITE_API_BASE_URL,
              headers: {
                Authorization: `Bearer ${token.token.access}`,
                model: config.aiModel,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              },
            },
            HACKATHON_CODE,
            autoBeListener.getListener(),
          )
          .then((v) => v.driver),
    });

    return {
      service: wrapper.service,
      listener: wrapper.listener,
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

import hApi from "@autobe/hackathon-api";
import { AutoBeHackathonModel } from "@autobe/interface";
import {
  AutoBeListener,
  IAutoBeConfig,
  SearchParamsProvider,
} from "@autobe/ui";
import { useRef } from "react";

import { AutoBePlaygroundChatMovie } from "./AutoBePlaygroundChatMovie";
import { HACKATHON_CODE } from "./constant";
import { useAuthorizationToken } from "./hooks/useAuthorizationToken";
import { AutoBeAgentSessionStorageStrategy } from "./strategy/AutoBeAgentSessionStorageStrategy";
import { goToLogin } from "./utils";

export function AutoBePlaygroundApplication() {
  const { getToken } = useAuthorizationToken();
  const token = getToken();
  /** @todo Process refresh token logic */
  if (token === null || new Date(token.token.expired_at) < new Date()) {
    goToLogin();
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
            .connect(
              connection,
              HACKATHON_CODE,
              config.sessionId,
              listener.getListener(),
            )
            .then((v) => v.driver),
          sessionId: config.sessionId,
        };
      }

      const session =
        await hApi.functional.autobe.hackathon.participants.sessions.create(
          connection,
          HACKATHON_CODE,
          {
            model: config.aiModel as AutoBeHackathonModel,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        );

      return {
        service: await hApi.functional.autobe.hackathon.participants.sessions
          .connect(
            connection,
            HACKATHON_CODE,
            session.id,
            listener.getListener(),
          )
          .then((v) => v.driver),
        sessionId: session.id,
      };
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
          storageStrategyFactory={() => new AutoBeAgentSessionStorageStrategy()}
          configFilter={(config) => config.key === "aiModel"}
        />
      </div>
    </SearchParamsProvider>
  );
}

import hApi, { HttpError } from "@autobe/hackathon-api";
import { AutoBeHackathonModel } from "@autobe/interface";
import {
  AutoBeListener,
  IAutoBeConfig,
  IAutoBeServiceData,
  SearchParamsProvider,
} from "@autobe/ui";
import { useRef } from "react";
import { toast } from "sonner";

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
    const { service, sessionId, connector } = await (async () => {
      const connection = {
        host: import.meta.env.VITE_API_BASE_URL,
        headers: {
          Authorization: `Bearer ${token.token.access}`,
          model:
            config.aiModel == null || config.aiModel === ""
              ? "openai/gpt-4.1-mini"
              : config.aiModel,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      };
      const errorHandler = (e: unknown) => {
        if (e instanceof HttpError && e.status === 422) {
          const message = JSON.parse(e.message).message;
          toast.error(message);
        }
        throw e;
      };

      if (config.sessionId != null && typeof config.sessionId === "string") {
        const { connector, driver } =
          await hApi.functional.autobe.hackathon.participants.sessions
            .connect(
              connection,
              HACKATHON_CODE,
              config.sessionId,
              listener.getListener(),
            )
            .catch(errorHandler);
        return {
          service: driver,
          connector,
          sessionId: config.sessionId,
        };
      }

      const session =
        await hApi.functional.autobe.hackathon.participants.sessions
          .create(connection, HACKATHON_CODE, {
            model: connection.headers.model as AutoBeHackathonModel,
            timezone: connection.headers.timezone,
          })
          .catch(errorHandler);

      const { connector, driver } =
        await hApi.functional.autobe.hackathon.participants.sessions
          .connect(
            connection,
            HACKATHON_CODE,
            session.id,
            listener.getListener(),
          )
          .catch(errorHandler);

      return {
        service: driver,
        listener,
        connector,
        close: connector.close,
        sessionId: session.id,
      } satisfies IAutoBeServiceData;
    })();

    return {
      service,
      sessionId,
      listener,
      connector,
      close: connector.close,
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

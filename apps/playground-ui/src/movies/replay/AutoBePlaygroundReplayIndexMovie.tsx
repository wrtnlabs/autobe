import {
  IAutoBePlaygroundHeader,
  IAutoBePlaygroundReplay,
} from "@autobe/interface";
import pApi from "@autobe/playground-api";
import { useEffect, useState } from "react";

import { AutoBePlaygroundListener } from "../../structures/AutoBePlaygroundListener";
import { AutoBePlaygroundChatMovie } from "../chat/AutoBePlaygroundChatMovie";

export const AutoBePlaygroundReplayGetMovie = () => {
  const [props] = useState<IAutoBePlaygroundReplay.IProps | null>(getProps());
  if (props === null) return <></>;

  const [next, setNext] = useState<AutoBePlaygroundChatMovie.IContext | null>(
    null,
  );
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    const connect = async () => {
      if (props === null) return;

      const listener: AutoBePlaygroundListener = new AutoBePlaygroundListener();
      const { driver } = await pApi.functional.autobe.playground.replay.get(
        {
          host: "http://localhost:5890",
        },
        props,
        listener.getListener(),
      );
      setNext({
        header: {
          model: "chatgpt",
          vendor: {
            model: props.vendor,
            apiKey: "********",
          },
          locale: "en-US",
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        } satisfies IAutoBePlaygroundHeader<"chatgpt">,
        listener,
        service: driver,
      });
    };
    connect().catch((err) => {
      setError(err as Error);
    });
  }, []);
  if (next !== null)
    return (
      <AutoBePlaygroundChatMovie title="AutoBE Playground (Replay)" {...next} />
    );
  else if (error !== null) return <>Error: {error.message}</>;
  return <>Loading Replay...</>;
};

const getProps = (): IAutoBePlaygroundReplay.IProps | null => {
  const query: URLSearchParams = new URLSearchParams(window.location.search);
  const vendor: string | null = query.get("vendor");
  const project: string | null = query.get("project");
  const step: string | null = query.get("step");
  if (vendor === null || project === null || step === null) return null;

  return {
    vendor,
    project,
    step: step as "analyze",
  };
};

"use client";

import { IAutoBePlaygroundReplay } from "@autobe/interface";

import replaysData from "../../data/replays.json";
import AutoBeDemoProjectMovie from "./AutoBeDemoProjectMovie";

export default function AutoBeDemoModelMovie(
  props: AutoBeReplayModelMovie.IProps,
) {
  const replayList: IAutoBePlaygroundReplay.ISummary[] =
    typeof props.data === "string"
      ? (replaysData as IAutoBePlaygroundReplay.Collection)[props.data]
      : props.data;
  return (
    <div
      className="gap-6 grid grid-cols-1 lg:grid-cols-2"
      style={{
        maxWidth: "920px",
        margin: "0 auto",
      }}
    >
      {replayList.map((replay, index) => (
        <AutoBeDemoProjectMovie key={index} replay={replay} />
      ))}
    </div>
  );
}
export namespace AutoBeReplayModelMovie {
  export interface IProps {
    data: string | IAutoBePlaygroundReplay.ISummary[];
  }
}

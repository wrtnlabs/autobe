import { IAutoBePlaygroundReplay } from "@autobe/interface";

import replaysData from "../../data/replays.json";
import AutoBeLandingDemoReplayMovie from "./AutoBeLandingDemoReplayMovie";

export default function AutoBeLandingDemoModelMovie(
  props: AutoBeLandingDemoModelMovie.IProps,
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
        <AutoBeLandingDemoReplayMovie key={index} replay={replay} />
      ))}
    </div>
  );
}
export namespace AutoBeLandingDemoModelMovie {
  export interface IProps {
    data: string | IAutoBePlaygroundReplay.ISummary[];
  }
}

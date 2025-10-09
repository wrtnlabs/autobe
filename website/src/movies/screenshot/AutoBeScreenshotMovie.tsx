"use client";

import AutoBeDemoModelMovie from "../demo/AutoBeDemoModelMovie";

export default function AutoBeScreenshotMovie() {
  const model =
    new URLSearchParams(location.search).get("model") ?? "openai/gpt-4.1";
  return <AutoBeDemoModelMovie model={model} />;
}

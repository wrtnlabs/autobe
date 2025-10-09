"use client";

import { useEffect, useState } from "react";

import AutoBeDemoModelMovie from "../demo/AutoBeDemoModelMovie";

export default function AutoBeScreenshotMovie() {
  const [model, setModel] = useState<string>(window ? getValue() : "");
  useEffect(() => {
    setModel(getValue());
  }, []);
  return <AutoBeDemoModelMovie model={model} />;
}

const getValue = (): string =>
  new URLSearchParams(window.location.search).get("model") ?? "openai/gpt-4.1";

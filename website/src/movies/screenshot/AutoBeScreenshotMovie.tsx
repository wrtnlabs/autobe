"use client";

import { useEffect, useState } from "react";

import AutoBeDemoModelMovie from "../demo/AutoBeDemoModelMovie";

export default function AutoBeScreenshotMovie() {
  const [model, setModel] = useState("openai/gpt-4.1");
  useEffect(() => {
    const value: string | null = new URLSearchParams(
      window.location.search,
    ).get("model");
    if (value) setModel(value);
  }, []);
  return <AutoBeDemoModelMovie model={model} />;
}

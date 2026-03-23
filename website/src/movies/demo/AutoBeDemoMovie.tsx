"use client";

import { AutoBeDemoStorage } from "@/src/data/AutoBeDemoStorage";
import { useState } from "react";

import AutoBeDemoModelMovie from "./AutoBeDemoModelMovie";

export default function AutoBeDemoMovie(props: AutoBeDemoMovie.IProps) {
  const [items] = useState(AutoBeDemoStorage.getItems());
  const [selectedModel, setSelectedModel] = useState<string>(
    props.model ?? items[0].data,
  );

  return (
    <div>
      <div className="mb-10 text-center">
        <div className="relative inline-block">
          <label className="sr-only" htmlFor="model-select">
            Select AI Model
          </label>
          <select
            id="model-select"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-neutral-900 text-neutral-300 px-5 py-2.5 pr-10 rounded-full border border-neutral-800 appearance-none cursor-pointer hover:border-neutral-700 focus:outline-none transition-all duration-200 text-sm font-medium min-w-[250px]"
          >
            {items.map((b) => (
              <option key={b.data} value={b.data}>
                {b.label}
              </option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg
              className="w-3.5 h-3.5 text-neutral-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>
      <AutoBeDemoModelMovie model={selectedModel} />
    </div>
  );
}
export namespace AutoBeDemoMovie {
  export interface IProps {
    model?: string;
  }
}

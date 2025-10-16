"use client";

import { AutoBeDemoStorage } from "@/src/data/AutoBeDemoStorage";
import { IAutoBePlaygroundReplay } from "@autobe/interface";
import { useState } from "react";

import AutoBeDemoModelMovie from "./AutoBeDemoModelMovie";

export default function AutoBeDemoMovie(props: AutoBeDemoMovie.IProps) {
  // Get available models from replays data
  const models: string[] = AutoBeDemoStorage.getModels();
  const [selectedModel, setSelectedModel] = useState<string>(
    props.model ?? "openai/gpt-4.1",
  );

  return (
    <section className="px-2 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Model Selection - Simple Dropdown */}
        <div className="mb-8">
          <div className="flex justify-center">
            <div className="relative">
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-gray-800 text-white px-6 py-3 pr-12 rounded-lg border border-gray-700 appearance-none cursor-pointer hover:bg-gray-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 text-base font-medium min-w-[250px]"
              >
                {models.map((model) => (
                  <option key={model} value={model}>
                    {emoji(model)} {model}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-400"
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
        </div>
        <AutoBeDemoModelMovie model={selectedModel} />
      </div>
    </section>
  );
}
export namespace AutoBeDemoMovie {
  export interface IProps {
    model?: string;
  }
}

const emoji = (key: string): string => {
  const projects: IAutoBePlaygroundReplay.ISummary[] | null =
    AutoBeDemoStorage.getModelProjects(key);
  const success: number =
    projects === null
      ? 0
      : projects.filter((p) => p.realize !== null && p.realize.success === true)
          .length;
  // return success >= 3 ? "🟢" : "❌";
  return success >= 3 ? "🟢" : success !== 0 ? "🟡" : "❌";
};

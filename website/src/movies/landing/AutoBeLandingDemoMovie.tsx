"use client";

import { IAutoBePlaygroundReplay } from "@autobe/interface";
import { useState } from "react";

import replaysData from "../../data/replays.json";
import AutoBeLandingDemoModelMovie from "./AutoBeLandingDemoModelMovie";

export default function AutoBeLandingDemoMovie(
  props: AutoBeLandingDemoMovie.IProps,
) {
  // Get available models from replays data
  const models: string[] = Object.keys(
    replaysData as IAutoBePlaygroundReplay.Collection,
  );
  const [selectedModel, setSelectedModel] = useState<string>(
    props.model ?? models[0] ?? "openai/gpt-4.1",
  );

  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-6">Real Examples</h2>
          <p className="text-xl text-gray-300 mb-6">
            See what AutoBE can build with different AI models
          </p>

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
                      {model}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
        <AutoBeLandingDemoModelMovie
          data={
            (replaysData as IAutoBePlaygroundReplay.Collection)[selectedModel]
          }
        />
      </div>
    </section>
  );
}
export namespace AutoBeLandingDemoMovie {
  export interface IProps {
    model?: string;
  }
}

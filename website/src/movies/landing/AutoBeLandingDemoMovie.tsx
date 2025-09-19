"use client";

import { IAutoBePlaygroundReplay } from "@autobe/interface";
import { useState } from "react";

import replaysData from "../../data/replays.json";
import AutoBeLandingDemoReplayMovie from "./AutoBeLandingDemoReplayMovie";

export default function AutoBeLandingDemoMovie() {
  // Get available models from replays data
  const models = Object.keys(replaysData as IAutoBePlaygroundReplay.Collection);
  const [selectedModel, setSelectedModel] = useState<string>(
    models[0] || "openai/gpt-4.1",
  );

  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-6">Real Examples</h2>
          <p className="text-xl text-gray-300 mb-6">
            See what AutoBE can build with different AI models
          </p>

          {/* Model Tabs */}
          <div className="flex justify-center mb-8">
            <div
              className="relative bg-gray-800/50 rounded-full p-1 inline-grid"
              style={{
                gridTemplateColumns: `repeat(${models.length}, minmax(140px, 1fr))`,
              }}
            >
              {/* Sliding background indicator */}
              <div
                className="absolute top-1 bottom-1 bg-blue-600 rounded-full shadow-lg transition-all duration-300 ease-out"
                style={{
                  width: `calc(${100 / models.length}% - 4px)`,
                  transform: `translateX(${models.indexOf(selectedModel) * 100}%)`,
                  left: "4px",
                }}
              />
              {models.map((model) => (
                <button
                  key={model}
                  onClick={() => setSelectedModel(model)}
                  className={`relative z-10 px-4 py-3 rounded-full text-sm font-medium transition-all duration-200 min-w-[140px] ${
                    selectedModel === model
                      ? "text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {model}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div
          className="gap-6 grid grid-cols-1 lg:grid-cols-2"
          style={{
            maxWidth: "920px",
            margin: "0 auto",
          }}
        >
          {(replaysData as IAutoBePlaygroundReplay.Collection)[
            selectedModel
          ]?.map((replay: IAutoBePlaygroundReplay.ISummary, index: number) => (
            <AutoBeLandingDemoReplayMovie key={index} replay={replay} />
          )) || []}
        </div>
      </div>
    </section>
  );
}

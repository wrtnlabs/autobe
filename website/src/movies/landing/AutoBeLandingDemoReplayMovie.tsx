"use client";

import { useState } from "react";

import replaysData from "../../data/replays.json";

// Convert elapsed time from milliseconds to human readable format
function formatElapsedTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  const s = seconds % 60;
  const m = minutes % 60;
  const h = hours;

  if (h > 0) {
    return `${h}h ${m}m ${s}s`;
  } else if (m > 0) {
    return `${m}m ${s}s`;
  } else {
    return `${s}s`;
  }
}

// Format token numbers with K/M suffix
function formatTokens(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(2)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

export default function AutoBeLandingDemoReplayMovie() {
  // Get available models from replays data
  const models = Object.keys(replaysData as any);
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
          {(replaysData as any)[selectedModel]?.map(
            (replay: any, index: number) => {
              // Use project name directly from replay data
              const projectTitle =
                replay.project.charAt(0).toUpperCase() +
                replay.project.slice(1);

              // Generate URL based on vendor and project
              const vendor = replay.vendor.replace(/\//g, "-");
              const url = `https://github.com/wrtnlabs/autobe-example-${replay.project}-${vendor}`;

              const tokenUsage = replay.tokenUsage.aggregate;
              const totalTokens = formatTokens(tokenUsage.total);
              const inputTokens = formatTokens(tokenUsage.input.total);
              const cachedTokens = formatTokens(tokenUsage.input.cached);
              const outputTokens = formatTokens(tokenUsage.output.total);

              return (
                <a
                  key={index}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-white/5 border border-gray-600/30 rounded-2xl p-6 transition-all duration-300 hover:bg-white/10 hover:border-gray-500/50 hover:shadow-xl hover:shadow-blue-500/10 hover:scale-[1.02]"
                >
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold">{projectTitle}</h3>
                  </div>

                  <div className="mb-6">
                    <table className="w-full">
                      <tbody>
                        {[
                          "analyze",
                          "prisma",
                          "interface",
                          "test",
                          "realize",
                        ].map((phaseName) => {
                          const phase = replay[phaseName];
                          if (!phase) {
                            return (
                              <tr
                                key={phaseName}
                                className="border-b border-gray-700/30 last:border-0"
                              >
                                <td className="py-2 pr-3 w-6">
                                  <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
                                </td>
                                <td className="py-2 pr-3 text-sm w-20">
                                  <span className="text-gray-500">
                                    {phaseName.charAt(0).toUpperCase() +
                                      phaseName.slice(1)}
                                  </span>
                                </td>
                                <td className="py-2 pl-3 text-sm text-gray-500 whitespace-nowrap">
                                  -
                                </td>
                                <td className="py-2 px-3 text-sm text-gray-500 text-right w-20 whitespace-nowrap hidden sm:table-cell">
                                  -
                                </td>
                              </tr>
                            );
                          }

                          const detail = phase.aggregate
                            ? Object.entries(phase.aggregate)
                                .map(([key, value]) => `${key}: ${value}`)
                                .join(", ")
                            : "-";

                          return (
                            <tr
                              key={phaseName}
                              className="border-b border-gray-700/30 last:border-0"
                            >
                              <td className="py-2 pr-3 w-6">
                                <div
                                  className={`w-3 h-3 ${
                                    phase.success === true
                                      ? "bg-green-500"
                                      : phase.success === false
                                        ? "bg-red-500"
                                        : "bg-gray-600"
                                  } rounded-full`}
                                ></div>
                              </td>
                              <td className="py-2 pr-3 text-sm w-20">
                                <span
                                  className={
                                    phase.success === true
                                      ? "text-white"
                                      : phase.success === false
                                        ? "text-red-400"
                                        : "text-gray-500"
                                  }
                                >
                                  {phaseName.charAt(0).toUpperCase() +
                                    phaseName.slice(1)}
                                </span>
                              </td>
                              <td className="py-2 pl-3 text-sm text-gray-400 whitespace-nowrap">
                                {detail}
                              </td>
                              <td className="py-2 px-3 text-sm text-gray-400 text-right w-20 whitespace-nowrap hidden sm:table-cell">
                                {phase.elapsed
                                  ? formatElapsedTime(phase.elapsed)
                                  : "-"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="border-t border-gray-600 pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center text-sm text-gray-400">
                        <span className="mr-2">⏱</span>
                        <span>Elapsed Time</span>
                      </div>
                      <span className="text-blue-400 font-bold">
                        {formatElapsedTime(replay.elapsed)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-400">
                        <span className="mr-2">💰</span>
                        <span>Total Tokens</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-white">
                          {totalTokens}
                        </div>
                        <div className="text-xs text-gray-400">
                          <div>
                            in: {inputTokens} ({cachedTokens} cached)
                          </div>
                          <div>out: {outputTokens}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </a>
              );
            },
          ) || []}
        </div>
      </div>
    </section>
  );
}

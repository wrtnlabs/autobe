"use client";

import { AutoBeDemoStorage } from "@/src/data/AutoBeDemoStorage";
import { IAutoBePlaygroundReplay } from "@autobe/interface";
import { useEffect, useRef, useState } from "react";

import AutoBeDemoPhaseMovie from "./AutoBeDemoPhaseMovie";

export default function AutoBeDemoProjectMovie(
  props: AutoBeDemoProjectMovie.IProps,
) {
  const replay: IAutoBePlaygroundReplay.ISummary | null =
    AutoBeDemoStorage.getProject(props);

  if (replay === null) {
    return (
      <div className="rounded-2xl p-6 border border-neutral-800/50 flex flex-col items-center justify-center min-h-[200px]">
        <p className="text-sm text-neutral-400">No project data available</p>
      </div>
    );
  }

  const projectTitle =
    replay.project.charAt(0).toUpperCase() + replay.project.slice(1);

  const url = `https://github.com/wrtnlabs/autobe-examples/tree/main/${replay.vendor.replaceAll(":", "-")}/${replay.project}`;

  const tokenUsage = replay.aggregates.total.tokenUsage;
  const totalTokens = formatTokens(tokenUsage.total);
  const inputTokens = formatTokens(tokenUsage.input.total);
  const cachedTokens = formatTokens(tokenUsage.input.cached);
  const outputTokens = formatTokens(tokenUsage.output.total);

  const successRate = (
    (replay.aggregates.total.metric.success /
      replay.aggregates.total.metric.attempt) *
    100
  ).toFixed(2);

  const containerRef = useRef<HTMLAnchorElement>(null);
  const [showTimeColumn, setShowTimeColumn] = useState(false);

  useEffect(() => {
    const checkWidth = () => {
      if (containerRef.current) {
        setShowTimeColumn(containerRef.current.offsetWidth > 400);
      }
    };

    checkWidth();
    window.addEventListener("resize", checkWidth);

    const resizeObserver = new ResizeObserver(checkWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener("resize", checkWidth);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <a
      ref={containerRef}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-2xl p-6 border border-neutral-800/50 transition-all duration-300 hover:border-neutral-700/60"
    >
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">{projectTitle}</h3>
        <span className="text-[11px] text-neutral-400 px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800/50">
          {replay.vendor}
        </span>
      </div>

      <div className="mb-5">
        <table className="w-full">
          <tbody>
            {(
              ["analyze", "database", "interface", "test", "realize"] as const
            ).map((phaseName) => {
              const phase = replay[phaseName];
              return (
                <AutoBeDemoPhaseMovie
                  key={phaseName}
                  phaseName={phaseName}
                  phase={phase}
                  showTimeColumn={showTimeColumn}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="border-t border-neutral-800/40 pt-4 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-neutral-400">Success Rate</span>
          <span className="text-xs text-neutral-300 font-medium">
            {successRate}%
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-neutral-400">Elapsed Time</span>
          <span className="text-xs text-neutral-300 font-medium">
            {formatElapsedTime(replay.elapsed)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-neutral-400">Total Tokens</span>
          <div className="text-right">
            <span className="text-xs text-neutral-300 font-medium">
              {totalTokens}
            </span>
            <div className="text-[11px] text-neutral-500">
              in: {inputTokens} ({cachedTokens} cached) · out: {outputTokens}
            </div>
          </div>
        </div>
      </div>
    </a>
  );
}
export namespace AutoBeDemoProjectMovie {
  export interface IProps {
    model: string;
    project: string;
  }
}

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

function formatTokens(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(2)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

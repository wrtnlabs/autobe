"use client";

import { useEffect, useState } from "react";

import FadeIn from "./FadeIn";

interface BenchmarkEntry {
  model: string;
  project: string;
  totalScore: number;
  grade: string;
}

interface ModelSummary {
  model: string;
  avgScore: number;
  projects: number;
  bestGrade: string;
}

function gradeColor(grade: string): string {
  if (grade === "A" || grade === "A+") return "text-emerald-400";
  if (grade === "B") return "text-blue-400";
  if (grade === "C") return "text-yellow-400";
  if (grade === "D") return "text-orange-400";
  return "text-neutral-500";
}

export default function AutoBeLandingBenchmarkMovie() {
  const [models, setModels] = useState<ModelSummary[]>([]);

  useEffect(() => {
    fetch("/benchmark/benchmark-summary.json")
      .then((r) => r.json())
      .then((data) => {
        const entries: BenchmarkEntry[] = data.entries || [];
        const byModel = new Map<string, BenchmarkEntry[]>();
        for (const e of entries) {
          if (e.totalScore <= 0) continue;
          if (!byModel.has(e.model)) byModel.set(e.model, []);
          byModel.get(e.model)!.push(e);
        }

        const summaries: ModelSummary[] = [];
        for (const [model, items] of byModel) {
          const avg = Math.round(
            items.reduce((s, e) => s + e.totalScore, 0) / items.length,
          );
          const best = items.sort((a, b) => b.totalScore - a.totalScore)[0];
          summaries.push({
            model,
            avgScore: avg,
            projects: items.length,
            bestGrade: best.grade,
          });
        }
        summaries.sort((a, b) => b.avgScore - a.avgScore);
        setModels(summaries.slice(0, 5));
      })
      .catch(() => {});
  }, []);

  if (models.length === 0) return null;

  return (
    <section className="py-40 px-6 bg-neutral-950">
      <div className="max-w-5xl mx-auto">
        <FadeIn className="max-w-xl mb-16">
          <p className="text-xs font-medium tracking-[0.3em] uppercase text-neutral-600 mb-6">
            Estimate
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-[1.1] mb-5">
            Model leaderboard
          </h2>
          <p className="text-base text-neutral-500 leading-relaxed">
            Averaged scores across multiple real-world projects. Higher is
            better.
          </p>
        </FadeIn>

        <FadeIn delay={150}>
          <div className="space-y-3">
            {models.map((m, i) => (
              <div
                key={m.model}
                className="flex items-center gap-4 py-4 px-5 rounded-xl border border-neutral-800/50 bg-neutral-900/30"
              >
                <span className="text-xs font-mono text-neutral-700 w-6 text-right">
                  {i + 1}
                </span>
                <span className="text-sm font-medium text-white flex-1 truncate">
                  {m.model}
                </span>
                <span className="text-xs text-neutral-600">
                  {m.projects} project{m.projects > 1 ? "s" : ""}
                </span>
                <div className="w-32 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-700"
                    style={{ width: `${m.avgScore}%` }}
                  />
                </div>
                <span className="text-sm font-mono font-semibold text-white w-10 text-right">
                  {m.avgScore}
                </span>
                <span
                  className={`text-xs font-semibold w-6 text-right ${gradeColor(m.bestGrade)}`}
                >
                  {m.bestGrade}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <a
              href="/benchmark/index.html"
              className="text-sm text-neutral-500 hover:text-white transition-colors"
            >
              View full estimate dashboard →
            </a>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

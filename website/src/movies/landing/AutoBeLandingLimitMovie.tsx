"use client";

import FadeIn from "./FadeIn";
import AutoBeLandingLimitCardMovie from "./AutoBeLandingLimitCardMovie";

const limitations = [
  {
    title: "Runtime",
    description:
      "100% compilation guaranteed, runtime behavior is actively being improved.",
    detail: "Target: 100% runtime success",
  },
  {
    title: "Token Usage",
    description:
      "Complex projects use significant tokens. RAG optimization coming soon.",
    detail: "Todo ~4M · E-commerce ~250M",
  },
  {
    title: "Design Gap",
    description:
      "AI output may differ from your vision. Review specs before implementation.",
    detail: "Detailed requirements help",
  },
  {
    title: "Maintenance",
    description:
      "Focused on initial generation. Pair with AI coding assistants for upkeep.",
    detail: "AutoBE + Claude Code",
  },
];

export default function AutoBeLandingLimitMovie() {
  return (
    <section className="py-40 px-6 bg-neutral-950">
      <div className="max-w-5xl mx-auto">
        <FadeIn>
        <div className="rounded-2xl border border-neutral-800/50 p-10 md:p-14">
          <div className="flex flex-col md:flex-row md:items-start gap-10 md:gap-16">
            {/* Label */}
            <div className="md:w-48 shrink-0">
              <p className="text-xs font-medium tracking-[0.3em] uppercase text-neutral-600 mb-3">
                Transparency
              </p>
              <h2 className="text-2xl font-bold text-white tracking-tight leading-tight">
                Known
                <br />
                limitations
              </h2>
              <a
                href="https://autobe.dev/docs/roadmap/alpha"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-6 text-xs text-neutral-600 hover:text-white transition-colors duration-200"
              >
                View Roadmap →
              </a>
            </div>

            {/* Items */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {limitations.map((limitation, index) => (
                <AutoBeLandingLimitCardMovie key={index} {...limitation} />
              ))}
            </div>
          </div>
        </div>
        </FadeIn>
      </div>
    </section>
  );
}

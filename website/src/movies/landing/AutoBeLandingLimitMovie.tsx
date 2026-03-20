"use client";

import AutoBeLandingLimitCardMovie from "./AutoBeLandingLimitCardMovie";

const limitations = [
  {
    title: "Runtime success: in progress",
    description:
      "Compilation is guaranteed today. Runtime success improves with testing and iterations; v1.0 targets 100% runtime success.",
    footer: (
      <p className="text-xs text-slate-500 font-mono">
        Current: 100% compilation ✓ · Target: 100% runtime success
      </p>
    ),
  },
  {
    title: "Token Consumption",
    description:
      "Complex projects require significant AI tokens. We're implementing RAG optimization to reduce token usage by up to 70%.",
    footer: (
      <div className="text-xs text-slate-500 font-mono space-y-1">
        <div>Simple Todo App: ~4M tokens</div>
        <div>E-Commerce Platform: ~250M tokens</div>
      </div>
    ),
  },
  {
    title: "Spec review is required",
    description:
      "AI output can differ from your intent; review the generated specs before you implement.",
    footer: (
      <p className="text-xs text-slate-500 italic">
        Tip: Provide detailed requirements for better results
      </p>
    ),
  },
  {
    title: "Maintenance workflow",
    description:
      "AutoBE focuses on initial generation. For ongoing maintenance, combine with AI coding assistants like Claude Code.",
    footer: (
      <p className="text-xs text-slate-500 font-semibold">
        AutoBE + Claude Code = Full Development Lifecycle
      </p>
    ),
  },
];

export default function AutoBeLandingLimitMovie() {
  return (
    <section className="landing-section">
      <div className="landing-container">
        <div className="max-w-5xl mx-auto">
          <div className="pb-8 mb-10 border-b border-white/10 flex items-end justify-between gap-6">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] uppercase text-slate-400">
                Road map
              </p>
              <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight text-white">
                What we’re improving next
              </h2>
            </div>
            <a
              href="https://autobe.dev/docs/roadmap/v1.0"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white underline underline-offset-4 decoration-white/15 hover:decoration-white/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25 rounded"
            >
              View details <span aria-hidden="true">→</span>
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-10 md:gap-y-12">
            {limitations.map((limitation, index) => (
              <div
                key={limitation.title}
                className={[
                  "pt-8 border-t border-white/10",
                  index % 2 === 1
                    ? "md:border-l md:border-white/10 md:pl-10"
                    : "md:pr-10",
                ].join(" ")}
              >
                <AutoBeLandingLimitCardMovie {...limitation} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
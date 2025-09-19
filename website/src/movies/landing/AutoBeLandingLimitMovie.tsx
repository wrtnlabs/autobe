"use client";

import AutoBeLandingLimitCardMovie from "./AutoBeLandingLimitCardMovie";

const limitations = [
  {
    bgColor: "bg-yellow-500/5",
    borderColor: "border-yellow-600/30",
    hoverBgColor: "bg-yellow-500/10",
    hoverBorderColor: "border-yellow-600/40",
    iconBgColor: "bg-yellow-500/20",
    iconColor: "text-yellow-400",
    icon: "⚡",
    titleColor: "text-yellow-400",
    title: "Runtime Optimization in Progress",
    description:
      "While we guarantee 100% compilation success, runtime behavior may need testing and refinement. Our v1.0 release (Q4 2025) targets 100% runtime success.",
    footer: (
      <div className="text-xs text-gray-500 font-mono bg-black/30 rounded p-2">
        Current: 100% Compilation ✓<br />
        Target: 100% Runtime Success
      </div>
    ),
  },
  {
    bgColor: "bg-blue-500/5",
    borderColor: "border-blue-600/30",
    hoverBgColor: "bg-blue-500/10",
    hoverBorderColor: "border-blue-600/40",
    iconBgColor: "bg-blue-500/20",
    iconColor: "text-blue-400",
    icon: "🪙",
    titleColor: "text-blue-400",
    title: "Token Consumption",
    description:
      "Complex projects require significant AI tokens. We're implementing RAG optimization to reduce token usage by up to 70%.",
    footer: (
      <div className="text-xs text-gray-500 space-y-1">
        <div className="flex justify-between">
          <span>Simple Todo App:</span>
          <span className="text-blue-400 font-mono">~4M tokens</span>
        </div>
        <div className="flex justify-between">
          <span>E-Commerce Platform:</span>
          <span className="text-blue-400 font-mono">~250M tokens</span>
        </div>
      </div>
    ),
  },
  {
    bgColor: "bg-purple-500/5",
    borderColor: "border-purple-600/30",
    hoverBgColor: "bg-purple-500/10",
    hoverBorderColor: "border-purple-600/40",
    iconBgColor: "bg-purple-500/20",
    iconColor: "text-purple-400",
    icon: "🎨",
    titleColor: "text-purple-400",
    title: "Design Interpretation",
    description:
      "AI-generated designs may differ from your vision. Always review the generated specifications before implementation.",
    footer: (
      <p className="text-xs text-gray-500 italic">
        Tip: Provide detailed requirements for better results
      </p>
    ),
  },
  {
    bgColor: "bg-green-500/5",
    borderColor: "border-green-600/30",
    hoverBgColor: "bg-green-500/10",
    hoverBorderColor: "border-green-600/40",
    iconBgColor: "bg-green-500/20",
    iconColor: "text-green-400",
    icon: "🔧",
    titleColor: "text-green-400",
    title: "Post-Generation Maintenance",
    description:
      "AutoBE focuses on initial generation. For ongoing maintenance, combine with AI coding assistants like Claude Code.",
    footer: (
      <p className="text-xs text-green-400/70 font-semibold">
        AutoBE + Claude Code = Full Development Lifecycle
      </p>
    ),
  },
];

export default function AutoBeLandingLimitMovie() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-6">Current Limitations</h2>
          <p className="text-xl text-gray-300">
            Transparent about what we're still working on
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {limitations.map((limitation, index) => (
            <AutoBeLandingLimitCardMovie key={index} {...limitation} />
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-400 mb-6">
            Despite these limitations, AutoBE significantly accelerates backend
            development
          </p>
          <a
            href="https://autobe.dev/docs/roadmap/v1.0"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-gray-600 text-white rounded-full hover:from-blue-500/20 hover:to-purple-500/20 transition-all duration-300"
          >
            View Our Roadmap
            <span className="ml-2">→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
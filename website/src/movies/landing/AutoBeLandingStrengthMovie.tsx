"use client";

import FadeIn from "./FadeIn";
import AutoBeLandingStrengthCardMovie from "./AutoBeLandingStrengthCardMovie";

const features = [
  {
    num: "01",
    title: "Intelligent Agents",
    subtitle: "40+ specialized agents collaborate",
    description:
      "From requirements analysis to API implementation — the entire waterfall development process is fully automated by our intelligent agent system.",
    footer: "Analyze · Database · Interface · Test · Realize",
    span: true,
  },
  {
    num: "02",
    title: "AST-Based Generation",
    subtitle: "100% compilation guaranteed",
    description:
      "AI generates Abstract Syntax Trees first, then compilers validate and generate code — ensuring structural correctness every time.",
    footer: "TypeScript · Prisma · OpenAPI · Zero Errors",
    span: true,
  },
  {
    num: "03",
    title: "Modern Tech Stack",
    subtitle: "Proven enterprise frameworks",
    description:
      "Built with TypeScript, NestJS, and Prisma — the most trusted tools for enterprise-grade backend applications.",
    footer: "PostgreSQL · SQLite · Production-Ready",
    span: false,
  },
  {
    num: "04",
    title: "Enterprise Ready",
    subtitle: "Complete development lifecycle",
    description:
      "Comprehensive documentation, E2E testing, and clean architecture that juniors can understand and seniors can extend with AI assistants.",
    footer: "Full Documentation · Testing · Maintainable Code",
    span: false,
  },
  {
    num: "05",
    title: "Cost Effective",
    subtitle: "Reduce development time and cost",
    description:
      "From months to hours of development time. Significantly reduce backend development costs while maintaining enterprise-grade quality.",
    footer: "Time Saving · Cost Reduction · High ROI",
    span: false,
  },
  {
    num: "06",
    title: "Open Source",
    subtitle: "Flexible and community-driven",
    description:
      "Open source project with support for multiple LLMs (GPT-4.1, Qwen3), local development, and seamless integration with AI coding assistants.",
    footer: "Multi-LLM · Local Setup · AI Assistant Ready",
    span: false,
  },
];

export default function AutoBeLandingStrengthMovie() {
  return (
    <section className="relative py-40 px-6 bg-neutral-950">
      {/* Subtle side glow */}
      <div className="absolute top-1/3 right-0 w-[500px] h-[800px] bg-[radial-gradient(ellipse_at_right,_rgba(59,130,246,0.04)_0%,_transparent_70%)] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto">
        {/* LEFT-aligned header */}
        <FadeIn className="max-w-xl mb-20">
          <p className="text-xs font-medium tracking-[0.3em] uppercase text-neutral-600 mb-6">
            Why AutoBE
          </p>
          <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight leading-[1.1] mb-5">
            Built for real
            <br />
            <span className="text-neutral-500">production use</span>
          </h2>
          <p className="text-base text-neutral-500 leading-relaxed">
            Everything you need to go from idea to deployed backend, without
            writing a single line of code.
          </p>
        </FadeIn>

        {/* Unified 4-col grid — featured cards span 2 cols */}
        <FadeIn delay={150}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {features.map((feature) => (
              <AutoBeLandingStrengthCardMovie
                key={feature.title}
                {...feature}
              />
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

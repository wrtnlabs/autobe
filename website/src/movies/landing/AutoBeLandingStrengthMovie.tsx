"use client";

import AutoBeLandingStrengthCardMovie from "./AutoBeLandingStrengthCardMovie";

const features = [
  {
    title: "Intelligent Agents",
    subtitle: "40+ specialized agents collaborate",
    description: "From requirements analysis to API implementation - the entire waterfall development process is fully automated by our intelligent agent system.",
    footer: "• Analyze • Database • Interface • Test • Realize",
  },
  {
    title: "AST-Based Generation",
    subtitle: "100% compilation guaranteed",
    description: "AI generates Abstract Syntax Trees first, then compilers validate and generate code - ensuring structural correctness every time.",
    footer: "TypeScript • Prisma • OpenAPI • Zero Errors",
  },
  {
    title: "Modern Tech Stack",
    subtitle: "Proven enterprise frameworks",
    description: "Built with TypeScript, NestJS, and Prisma - the most trusted tools for enterprise-grade backend applications.",
    footer: "PostgreSQL • SQLite • Production-Ready",
  },
  {
    title: "Enterprise Ready",
    subtitle: "Complete development lifecycle",
    description: "Comprehensive documentation, E2E testing, and clean architecture that juniors can understand and seniors can extend with AI assistants.",
    footer: "Full Documentation • Testing • Maintainable Code",
  },
  {
    title: "Cost Effective",
    subtitle: "Reduce development time & cost",
    description: "From months to hours of development time. Significantly reduce backend development costs while maintaining enterprise-grade quality.",
    footer: "Time Saving • Cost Reduction • High ROI",
  },
  {
    title: "Open Source & Extensible",
    subtitle: "Flexible and community-driven",
    description: "Open source project with support for multiple LLMs (GPT-4.1, Qwen3), local development, and seamless integration with AI coding assistants.",
    footer: "Multi-LLM Support • Local Setup • AI Assistant Ready",
  },
];

export default function AutoBeLandingStrengthMovie() {
  return (
    <section className="landing-section">
      <div className="landing-container">
        <div className="max-w-5xl mx-auto">
          <div className="pb-8 mb-10 border-b border-white/10">
            <p className="text-xs font-semibold tracking-[0.18em] uppercase text-slate-400">
              Why AutoBE
            </p>
            <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight text-white">
              Built for reliable backend generation
            </h2>
            <p className="mt-3 text-base md:text-lg text-slate-300 leading-relaxed max-w-2xl">
              Compiler validation and specialized agents keep output consistent,
              predictable, and production-minded.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-12 lg:gap-y-14">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className={[
                  "px-0",
                  "md:px-6",
                  "lg:px-8",
                  index % 3 === 1 ? "lg:border-x lg:border-white/10" : "",
                ].join(" ")}
              >
                <AutoBeLandingStrengthCardMovie {...feature} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
"use client";

import FadeIn from "./FadeIn";

const steps = [
  {
    title: "Analyze",
    desc: "Requirements extraction from conversation",
  },
  {
    title: "Database",
    desc: "Prisma schema generation & validation",
  },
  {
    title: "Interface",
    desc: "OpenAPI spec with full type safety",
  },
  {
    title: "Test",
    desc: "E2E test suite auto-generation",
  },
  {
    title: "Realize",
    desc: "NestJS implementation with zero errors",
  },
];

export default function AutoBeLandingTechMovie() {
  return (
    <section className="relative py-40 px-6 bg-neutral-950">
      <div className="max-w-5xl mx-auto">
        {/* LEFT-aligned header */}
        <FadeIn className="max-w-xl mb-20">
          <p className="text-xs font-medium tracking-[0.3em] uppercase text-neutral-600 mb-6">
            How it works
          </p>
          <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight leading-[1.1]">
            Five phases,
            <br />
            <span className="text-neutral-500">zero manual steps</span>
          </h2>
        </FadeIn>

        {/* Pipeline timeline */}
        <FadeIn className="relative mb-28">
          {/* Horizontal line (desktop) */}
          <div className="hidden md:block absolute top-5 left-[10%] right-[10%] h-px bg-neutral-800" />

          <div className="grid grid-cols-1 md:grid-cols-5 gap-10 md:gap-0">
            {steps.map((step, i) => (
              <div key={step.title} className="relative text-center px-2">
                {/* Numbered dot on the line */}
                <div className="relative inline-flex items-center justify-center w-10 h-10 rounded-full border border-neutral-700 bg-neutral-950 mb-5 z-10">
                  <span className="text-[11px] font-mono text-neutral-400">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white mb-1.5">
                  {step.title}
                </h3>
                <p className="text-xs text-neutral-500 leading-relaxed max-w-[140px] mx-auto">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </FadeIn>

        {/* Two-column feature blocks */}
        <FadeIn>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Compiler block */}
            <div className="rounded-2xl border border-neutral-800/60 p-10 flex flex-col">
              <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-neutral-600 mb-5">
                Compiler-Driven
              </div>
              <h3 className="text-xl font-semibold text-white mb-8">
                Three-tier validation
              </h3>

              <div className="space-y-2 mb-8 flex-1">
                {[
                  { name: "Prisma Compiler", desc: "Schema" },
                  { name: "OpenAPI Compiler", desc: "API Spec" },
                  { name: "TypeScript Compiler", desc: "Code" },
                ].map((compiler) => (
                  <div
                    key={compiler.name}
                    className="flex items-center justify-between py-3.5 px-5 rounded-xl bg-neutral-900/80 border border-neutral-800/40"
                  >
                    <span className="text-sm text-neutral-300">
                      {compiler.name}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {compiler.desc}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 pt-6 border-t border-neutral-800/40">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-sm text-neutral-400 font-medium">
                  100% compilation success
                </span>
              </div>
            </div>

            {/* SDK block */}
            <div className="rounded-2xl border border-neutral-800/60 p-10 flex flex-col">
              <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-neutral-600 mb-5">
                Auto-Generated
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">
                Type-safe client SDK
              </h3>
              <p className="text-sm text-neutral-500 leading-relaxed mb-8">
                Every backend ships with a fully typed SDK. Zero configuration —
                powers both frontend integration and E2E tests.
              </p>

              <div className="rounded-xl bg-black border border-neutral-800/40 p-6 mb-8 overflow-x-auto flex-1">
                <pre className="text-[13px] font-mono leading-[1.7] text-neutral-400">
                  <span className="text-neutral-600">{"// Fully typed"}</span>
                  {"\n"}
                  <span className="text-neutral-500">{"const"}</span>
                  {" post "}
                  <span className="text-neutral-600">{"="}</span>
                  {" "}
                  <span className="text-neutral-500">{"await"}</span>
                  {"\n"}
                  {"  api.functional.posts."}
                  <span className="text-white">{"create"}</span>
                  {"(conn, {"}
                  {"\n"}
                  {"    title: "}
                  <span className="text-neutral-500">{'"Hello"'}</span>
                  {","}
                  {"\n"}
                  {"    content: "}
                  <span className="text-neutral-500">{'"World"'}</span>
                  {"\n"}
                  {"  });"}
                </pre>
              </div>

              <p className="text-xs text-neutral-500">
                Works with any frontend framework
              </p>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

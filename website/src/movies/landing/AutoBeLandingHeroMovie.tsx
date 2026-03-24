"use client";

import CodeShowcase from "./CodeShowcase";
import FadeIn from "./FadeIn";

export default function AutoBeLandingHeroMovie() {
  return (
    <section className="relative px-6 pt-36 pb-48 overflow-hidden">
      {/* Radial gradient glow */}
      <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[1400px] h-[800px] bg-[radial-gradient(ellipse_at_center,_rgba(59,130,246,0.08)_0%,_transparent_70%)] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto text-center">
        <FadeIn>
          <h1 className="text-5xl md:text-7xl lg:text-[6rem] font-bold tracking-[-0.04em] leading-[1] mb-8 text-white">
            Every line compiles
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-neutral-500">
              Every time
            </span>
          </h1>
        </FadeIn>

        <FadeIn delay={100}>
          <p className="text-lg md:text-xl text-neutral-500 max-w-xl mx-auto leading-relaxed mb-14">
            Production-ready backends from natural language.
          </p>
        </FadeIn>

        <FadeIn delay={200}>
          <div className="flex flex-wrap justify-center items-center gap-4 mb-8">
            <a
              href="https://autobe.dev/docs/setup"
              target="_blank"
              rel="noopener noreferrer"
              className="group px-8 py-3 bg-white text-black font-semibold text-sm rounded-full transition-all duration-300 hover:shadow-[0_0_60px_rgba(255,255,255,0.15)]"
            >
              Get Started
              <span className="inline-block ml-1.5 transition-transform duration-200 group-hover:translate-x-1">
                →
              </span>
            </a>
            <a
              href="https://github.com/wrtnlabs/autobe"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 text-neutral-400 font-medium text-sm rounded-full transition-all duration-200 hover:text-white border border-neutral-800 hover:border-neutral-600"
            >
              GitHub
            </a>
          </div>
        </FadeIn>

        {/* GitHub stars badge */}
        <FadeIn delay={300}>
          <div className="flex justify-center mb-24">
            <a
              href="https://github.com/wrtnlabs/autobe"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs text-neutral-600 hover:text-neutral-400 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
              <span>Star on GitHub</span>
            </a>
          </div>
        </FadeIn>

        {/* Stats strip */}
        <FadeIn delay={400}>
          <div className="max-w-5xl mx-auto grid grid-cols-3 border border-neutral-800/60 rounded-2xl overflow-hidden mb-24">
            {[
              { value: "100%", label: "Compilation guarantee" },
              { value: "40+", label: "Specialized AI agents" },
              { value: "6+", label: "Supported models" },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className={`py-10 px-6 text-center ${i < 2 ? "border-r border-neutral-800/60" : ""}`}
              >
                <div className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-2">
                  {stat.value}
                </div>
                <div className="text-xs text-neutral-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </FadeIn>

        {/* Terminal animation */}
        <FadeIn delay={500}>
          <CodeShowcase />
        </FadeIn>
      </div>
    </section>
  );
}

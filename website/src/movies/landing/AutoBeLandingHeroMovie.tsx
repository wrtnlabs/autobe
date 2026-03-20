"use client";

export default function AutoBeLandingHeroMovie() {
  return (
    <section className="landing-section relative">
      <div className="landing-container relative">
        <div className="landing-grid items-center">
          <div className="col-span-12 lg:col-span-6">
            <p className="text-sm font-semibold tracking-wide text-indigo-200/90 mb-4">
              From prototype to production
            </p>
            <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-white">
              AI Backend Builder
            </h1>
            <p className="mt-5 text-lg md:text-xl leading-relaxed text-slate-300 max-w-xl">
              Generate 100% working backends through conversation, powered by
              AI-friendly compilers that drive code to compile.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <a
                href="https://autobe.dev/docs/setup"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-indigo-500 text-white font-semibold text-sm transition-colors hover:bg-indigo-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/60"
              >
                Getting Started
              </a>
              <a
                href="https://autobe.dev/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-full border border-white/15 bg-white/5 text-white font-semibold text-sm transition-colors hover:bg-white/10 hover:border-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25"
              >
                Guide Documents
              </a>
            </div>

            <div className="mt-5">
              <a
                href="https://github.com/wrtnlabs/autobe"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white underline underline-offset-4 decoration-white/15 hover:decoration-white/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25 rounded"
              >
                <svg
                  viewBox="0 0 16 16"
                  width="16"
                  height="16"
                  aria-hidden="true"
                  className="text-slate-300"
                  fill="currentColor"
                >
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.48 7.48 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
                </svg>
                <span>GitHub</span>
              </a>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden shadow-[0_20px_60px_-30px_rgba(99,102,241,0.35)]">
              <iframe
                src="https://www.youtube.com/embed/iE0b3Gt_uPk"
                title="AutoBE & AutoView Demonstration (Reddit like Community)"
                width="100%"
                style={{ aspectRatio: "16/9" }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

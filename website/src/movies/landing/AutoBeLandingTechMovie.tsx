"use client";

export default function AutoBeLandingTechMovie() {
  return (
    <section className="landing-section">
      <div className="landing-container">
        <div className="max-w-5xl mx-auto">
          <div className="pb-8 mb-10 border-b border-white/10">
            <p className="text-xs font-semibold tracking-[0.18em] uppercase text-slate-400">
              Technical
            </p>
            <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight text-white">
              Technical innovation
            </h2>
            <p className="mt-3 text-base md:text-lg text-slate-300 leading-relaxed max-w-2xl">
              Why AutoBE achieves 100% compilation success where others fail.
            </p>
          </div>

          <div className="space-y-14">
            <div className="pt-10 border-t border-white/10">
              <div className="grid md:grid-cols-12 gap-10 items-start">
                <div className="md:col-span-7">
                  <h3 className="text-xl md:text-2xl font-semibold tracking-tight text-white">
                    AI-friendly compilers
                  </h3>
                  <p className="mt-3 text-sm text-slate-400 leading-relaxed max-w-xl">
                    Instead of emitting code as raw text, AutoBE generates AST
                    first and validates it with compilers before producing
                    TypeScript.
                  </p>

                  <div className="mt-7 space-y-5">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        Traditional AI tools
                      </p>
                      <p className="mt-1 text-sm text-slate-400 leading-relaxed">
                        Generate code as text → higher chance of syntax errors
                        and drift.
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        AutoBE approach
                      </p>
                      <p className="mt-1 text-sm text-slate-400 leading-relaxed">
                        AI generates AST → compiler validates → generator emits
                        correct TypeScript.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-5">
                  <div className="rounded-2xl border border-white/10 p-6">
                    <p className="text-xs font-semibold tracking-[0.18em] uppercase text-slate-400">
                      Process
                    </p>
                    <div className="mt-3 text-slate-300 font-mono text-sm space-y-1.5">
                      <div>1. AI → Abstract Syntax Tree</div>
                      <div>2. Compiler → validates structure</div>
                      <div>3. Generator → emits TypeScript</div>
                      <div className="text-slate-200 mt-2">
                        100% compilation success
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-10 border-t border-white/10">
              <div className="grid md:grid-cols-12 gap-10 items-start">
                <div className="md:col-span-7">
                  <h3 className="text-xl md:text-2xl font-semibold tracking-tight text-white">
                    Automatic SDK generation
                  </h3>
                  <p className="mt-3 text-sm text-slate-400 leading-relaxed max-w-xl">
                    Every backend ships with a type-safe client SDK — no manual
                    typing, no boilerplate, and end-to-end type safety for both
                    apps and tests.
                  </p>

                  <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-10">
                    {[
                      {
                        title: "Zero configuration",
                        desc: "Auto-generated with your backend.",
                      },
                      {
                        title: "100% type safety",
                        desc: "TypeScript-first SDK and validation.",
                      },
                      {
                        title: "Frontend ready",
                        desc: "Works with React, Vue, Angular.",
                      },
                      {
                        title: "E2E test integration",
                        desc: "Powers AI-generated test suites.",
                      },
                    ].map((item, idx) => (
                      <div
                        key={item.title}
                        className={[
                          "pt-5 border-t border-white/10",
                          idx % 2 === 1
                            ? "sm:border-l sm:border-white/10 sm:pl-8"
                            : "",
                        ].join(" ")}
                      >
                        <p className="text-sm font-semibold text-white">
                          {item.title}
                        </p>
                        <p className="mt-1 text-sm text-slate-400 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-5">
                  <div className="rounded-2xl border border-white/10 p-6 overflow-x-auto">
                    <p className="text-xs font-semibold tracking-[0.18em] uppercase text-slate-400">
                      Example
                    </p>
                    <pre className="mt-3 text-slate-200/90 font-mono text-xs lg:text-sm leading-relaxed">
{`import api, { IPost } from "autobe-generated-sdk";

const connection: api.IConnection = {
  host: "http://localhost:1234",
};

await api.functional.users.login(connection, {
  body: { email: "user@example.com", password: "secure-password" },
});

const post: IPost = await api.functional.posts.create(connection, {
  body: { title: "Hello World", content: "My first post" },
});`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

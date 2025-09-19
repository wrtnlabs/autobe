"use client";

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
          {/* Runtime Behavior */}
          <div className="bg-yellow-500/5 border border-yellow-600/30 rounded-2xl p-6 transition-all duration-300 hover:bg-yellow-500/10 hover:border-yellow-600/40">
            <div className="flex items-start mb-4">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center mr-4">
                <span className="text-yellow-400 text-xl">⚡</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-yellow-400 mb-2">
                  Runtime Optimization in Progress
                </h3>
                <p className="text-gray-400 text-sm">
                  While we guarantee 100% compilation success, runtime behavior
                  may need testing and refinement. Our v1.0 release (Q4 2025)
                  targets 100% runtime success.
                </p>
              </div>
            </div>
            <div className="pl-14">
              <div className="text-xs text-gray-500 font-mono bg-black/30 rounded p-2">
                Current: 100% Compilation Success
                <br />
                Target: 100% Runtime Success
              </div>
            </div>
          </div>

          {/* Token Usage */}
          <div className="bg-blue-500/5 border border-blue-600/30 rounded-2xl p-6 transition-all duration-300 hover:bg-blue-500/10 hover:border-blue-600/40">
            <div className="flex items-start mb-4">
              <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center mr-4">
                <span className="text-blue-400 text-xl">🪙</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-blue-400 mb-2">
                  Token Consumption
                </h3>
                <p className="text-gray-400 text-sm">
                  Complex projects require significant AI tokens. We're
                  implementing RAG optimization to reduce token usage by up to
                  70%.
                </p>
              </div>
            </div>
            <div className="pl-14">
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
            </div>
          </div>

          {/* Design Flexibility */}
          <div className="bg-purple-500/5 border border-purple-600/30 rounded-2xl p-6 transition-all duration-300 hover:bg-purple-500/10 hover:border-purple-600/40">
            <div className="flex items-start mb-4">
              <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center mr-4">
                <span className="text-purple-400 text-xl">🎨</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-purple-400 mb-2">
                  Design Interpretation
                </h3>
                <p className="text-gray-400 text-sm">
                  AI-generated designs may differ from your vision. Always
                  review the generated specifications before implementation.
                </p>
              </div>
            </div>
            <div className="pl-14">
              <p className="text-xs text-gray-500 italic">
                Tip: Provide detailed requirements for better results
              </p>
            </div>
          </div>

          {/* Maintenance */}
          <div className="bg-green-500/5 border border-green-600/30 rounded-2xl p-6 transition-all duration-300 hover:bg-green-500/10 hover:border-green-600/40">
            <div className="flex items-start mb-4">
              <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center mr-4">
                <span className="text-green-400 text-xl">🔧</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-green-400 mb-2">
                  Post-Generation Maintenance
                </h3>
                <p className="text-gray-400 text-sm">
                  AutoBE focuses on initial generation. For ongoing maintenance,
                  combine with AI coding assistants like Claude Code.
                </p>
              </div>
            </div>
            <div className="pl-14">
              <p className="text-xs text-green-400/70 font-semibold">
                AutoBE + Claude Code = Full Development Lifecycle
              </p>
            </div>
          </div>
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

export default function AutoBeLandingPage() {
  return (
    <div className="text-white overflow-hidden">
      {/* Hero Section */}
      <section className="relative px-6 py-20">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-32 left-32 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-48 right-32 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative max-w-6xl mx-auto text-center">
          {/* Main headline */}
          <h1 className="text-6xl md:text-7xl font-bold mb-8">
            <span className="text-white">AI Backend Builder</span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              for Prototype to Production
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-300 mb-4 max-w-4xl mx-auto">
            Generate 100% working TypeScript backends through conversation
          </p>
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto">
            Enhanced by compiler feedback for perfect code quality
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap justify-center gap-6 mb-16">
            <a
              href="https://stackblitz.com/github/wrtnlabs/autobe-playground-stackblitz"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-lg rounded-full hover:scale-105 transition-transform duration-200"
            >
              Try Playground
            </a>
            <a
              href="https://autobe.dev/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 border border-gray-400 text-white text-lg rounded-full hover:bg-white/10 transition-colors duration-200"
            >
              Guide Documents
            </a>
            <a
              href="https://github.com/wrtnlabs/autobe"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 border border-blue-400 text-blue-400 text-lg rounded-full hover:bg-blue-400/10 transition-colors duration-200"
            >
              View on GitHub
            </a>
          </div>

          {/* Demo Video */}
          <div className="relative max-w-4xl mx-auto">
            <iframe
              src="https://www.youtube.com/embed/JNreQ0Rk94g"
              title="AutoBE Demonstration (Bullet-in Board System)"
              width="100%"
              style={{ aspectRatio: "16/9" }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6">Why Choose AutoBE?</h2>
            <p className="text-xl text-gray-300">
              Powered by advanced AI agents and compiler validation
            </p>
          </div>

          <div
            className="gap-8"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              maxWidth: "800px",
              margin: "0 auto",
            }}
          >
            {/* Feature 1 */}
            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-gray-600/30 rounded-2xl p-8">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-6">
                <div className="text-blue-400 text-2xl">⚡</div>
              </div>
              <h3 className="text-2xl font-bold mb-4">Intelligent Agents</h3>
              <p className="text-gray-300 mb-4">
                5 specialized agents collaborate
              </p>
              <p className="text-gray-400 text-sm mb-4">
                From requirements analysis to API implementation - the entire
                process is fully automated by our intelligent agent system.
              </p>
              <p className="text-blue-400 text-sm font-semibold">
                • Analyze • Database • API • Test • Realize
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gradient-to-br from-pink-500/10 to-red-500/10 border border-gray-600/30 rounded-2xl p-8">
              <div className="w-16 h-16 bg-pink-500/20 rounded-full flex items-center justify-center mb-6">
                <div className="text-pink-400 text-2xl">✓</div>
              </div>
              <h3 className="text-2xl font-bold mb-4">Compiler Validation</h3>
              <p className="text-gray-300 mb-4">100% working code guaranteed</p>
              <p className="text-gray-400 text-sm mb-4">
                TypeScript, Prisma, and OpenAPI compilers validate your code in
                real-time, ensuring error-free perfect backend generation.
              </p>
              <p className="text-pink-400 text-sm font-semibold">
                Zero bugs. Zero deployment issues.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-gray-600/30 rounded-2xl p-8">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-6">
                <div className="text-purple-400 text-2xl">🚀</div>
              </div>
              <h3 className="text-2xl font-bold mb-4">Modern Tech Stack</h3>
              <p className="text-gray-300 mb-4">Proven framework combination</p>
              <p className="text-gray-400 text-sm mb-4">
                Built with TypeScript, NestJS, and Prisma - the most trusted
                tools for enterprise-grade backend applications.
              </p>
              <p className="text-purple-400 text-sm font-semibold">
                PostgreSQL • SQLite • Production-Ready
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6">How It Works</h2>
            <p className="text-xl text-gray-300">
              From conversation to deployment in 5 simple steps
            </p>
          </div>

          <div className="bg-gradient-to-r from-green-500/5 to-blue-500/5 border border-gray-600/30 rounded-3xl p-12">
            <div className="flex flex-wrap justify-between items-center gap-8">
              {/* Step 1 */}
              <div className="flex flex-col items-center text-center flex-1 min-w-32">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4">
                  1
                </div>
                <h4 className="font-bold text-lg mb-2">Input Requirements</h4>
                <p className="text-sm text-gray-400">
                  Describe your backend needs in natural language
                </p>
              </div>

              {/* Arrow */}
              <div className="hidden md:block text-gray-400 text-2xl">→</div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center flex-1 min-w-32">
                <div className="w-16 h-16 bg-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4">
                  2
                </div>
                <h4 className="font-bold text-lg mb-2">AI Analysis</h4>
                <p className="text-sm text-gray-400">
                  Intelligent agents analyze and design your system
                </p>
              </div>

              <div className="hidden md:block text-gray-400 text-2xl">→</div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center flex-1 min-w-32">
                <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4">
                  3
                </div>
                <h4 className="font-bold text-lg mb-2">Code Generation</h4>
                <p className="text-sm text-gray-400">
                  Generate TypeScript APIs, database schemas, tests
                </p>
              </div>

              <div className="hidden md:block text-gray-400 text-2xl">→</div>

              {/* Step 4 */}
              <div className="flex flex-col items-center text-center flex-1 min-w-32">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4">
                  4
                </div>
                <h4 className="font-bold text-lg mb-2">Validation</h4>
                <p className="text-sm text-gray-400">
                  Compilers validate all generated code
                </p>
              </div>

              <div className="hidden md:block text-gray-400 text-2xl">→</div>

              {/* Step 5 */}
              <div className="flex flex-col items-center text-center flex-1 min-w-32">
                <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4">
                  5
                </div>
                <h4 className="font-bold text-lg mb-2">Deploy Ready</h4>
                <p className="text-sm text-gray-400">
                  Production-ready backend ready for deployment
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Real Examples Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6">Real Examples</h2>
            <p className="text-xl text-gray-300">
              See what AutoBE can build for you
            </p>
          </div>

          <div
            className="gap-8"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              maxWidth: "900px",
              margin: "0 auto",
            }}
          >
            {/* Todo Example */}
            <a
              href="https://github.com/wrtnlabs/autobe-example-todo"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/5 border border-gray-600/30 rounded-2xl p-6 hover:bg-white/10 transition-colors duration-200 block"
            >
              <div className="mb-6">
                <h3 className="text-2xl font-bold">To Do List</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Simple task management application
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-white">Analyze</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-400">
                    <span className="mr-4">11m 51s</span>
                    <span>(A: 2, D: 11)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-white">Prisma</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-400">
                    <span className="mr-4">2m 55s</span>
                    <span>(N: 2, M: 3)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-white">Interface</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-400">
                    <span className="mr-4">9m 03s</span>
                    <span>(O: 16, S: 16)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-white">Test</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-400">
                    <span className="mr-4">37m 18s</span>
                    <span>(F: 23)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-blue-400">Realize</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-400">
                    <span className="mr-4">7m 49s</span>
                    <span>(F: 16)</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-600 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center text-sm text-gray-400">
                    <span className="mr-2">⏱</span>
                    <span>Elapsed Time</span>
                  </div>
                  <span className="text-green-400 font-bold">1h 8m 57s</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-400">
                    <span className="mr-2">🧠</span>
                    <span>Total Tokens</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-white">4.43M</div>
                    <div className="text-xs text-gray-400">
                      in: 4.23M (51.7K cached)
                      <br />
                      out: 199.4K
                    </div>
                  </div>
                </div>
              </div>
            </a>

            {/* Reddit Example */}
            <a
              href="https://github.com/wrtnlabs/autobe-example-reddit"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/5 border border-gray-600/30 rounded-2xl p-6 hover:bg-white/10 transition-colors duration-200 block"
            >
              <div className="mb-6">
                <h3 className="text-2xl font-bold">Reddit Community</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Social discussion platform with voting system
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-white">Analyze</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-400">
                    <span className="mr-4">6m 40s</span>
                    <span>(A: 3, D: 12)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-white">Prisma</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-400">
                    <span className="mr-4">7m 57s</span>
                    <span>(N: 6, M: 20)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-white">Interface</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-400">
                    <span className="mr-4">24m 19s</span>
                    <span>(O: 101, S: 105)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-white">Test</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-400">
                    <span className="mr-4">53m 18s</span>
                    <span>(F: 127)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-blue-400">Realize</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-400">
                    <span className="mr-4">11m 02s</span>
                    <span>(F: 101)</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-600 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center text-sm text-gray-400">
                    <span className="mr-2">⏱</span>
                    <span>Elapsed Time</span>
                  </div>
                  <span className="text-green-400 font-bold">1h 43m 18s</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-400">
                    <span className="mr-2">🧠</span>
                    <span>Total Tokens</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-white">30.94M</div>
                    <div className="text-xs text-gray-400">
                      in: 29.61M (304.3K cached)
                      <br />
                      out: 1.33M
                    </div>
                  </div>
                </div>
              </div>
            </a>

            {/* Shopping Example */}
            <a
              href="https://github.com/wrtnlabs/autobe-example-shopping"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/5 border border-gray-600/30 rounded-2xl p-6 hover:bg-white/10 transition-colors duration-200 block"
            >
              <div className="mb-6">
                <h3 className="text-2xl font-bold">E-Commerce</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Full-featured online shopping platform
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-white">Analyze</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-400">
                    <span className="mr-4">7m 55s</span>
                    <span>(A: 4, D: 16)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-white">Prisma</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-400">
                    <span className="mr-4">19m 08s</span>
                    <span>(N: 10, M: 111)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-white">Interface</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-400">
                    <span className="mr-4">35m 39s</span>
                    <span>(O: 522, S: 423)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-white">Test</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-400">
                    <span className="mr-4">1h 27m 09s</span>
                    <span>(F: 507)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-blue-400">Realize</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-400">
                    <span className="mr-4">1h 6m 57s</span>
                    <span>(F: 522)</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-600 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center text-sm text-gray-400">
                    <span className="mr-2">⏱</span>
                    <span>Elapsed Time</span>
                  </div>
                  <span className="text-green-400 font-bold">3h 36m 50s</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-400">
                    <span className="mr-2">🧠</span>
                    <span>Total Tokens</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-white">256.01M</div>
                    <div className="text-xs text-gray-400">
                      in: 250.26M (2.15M cached)
                      <br />
                      out: 5.74M
                    </div>
                  </div>
                </div>
              </div>
            </a>

            {/* BBS Example */}
            <a
              href="https://github.com/wrtnlabs/autobe-example-bbs"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/5 border border-gray-600/30 rounded-2xl p-6 hover:bg-white/10 transition-colors duration-200 block"
            >
              <div className="mb-6">
                <h3 className="text-2xl font-bold">Discussion Board</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Political & economic discussion platform
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-white">Analyze</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-400">
                    <span className="mr-4">5m 52s</span>
                    <span>(A: 4, D: 11)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-white">Prisma</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-400">
                    <span className="mr-4">7m 20s</span>
                    <span>(N: 8, M: 28)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-white">Interface</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-400">
                    <span className="mr-4">31m 36s</span>
                    <span>(O: 126, S: 127)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-white">Test</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-400">
                    <span className="mr-4">1h 6m 21s</span>
                    <span>(F: 147)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-blue-400">Realize</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-400">
                    <span className="mr-4">11m 15s</span>
                    <span>(F: 126)</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-600 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center text-sm text-gray-400">
                    <span className="mr-2">⏱</span>
                    <span>Elapsed Time</span>
                  </div>
                  <span className="text-green-400 font-bold">2h 2m 26s</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-400">
                    <span className="mr-2">🧠</span>
                    <span>Total Tokens</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-white">38.93M</div>
                    <div className="text-xs text-gray-400">
                      in: 37.31M (180.0K cached)
                      <br />
                      out: 1.62M
                    </div>
                  </div>
                </div>
              </div>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

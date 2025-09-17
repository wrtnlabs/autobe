"use client";

import { useState } from "react";

import { AutoBeExperimentCollection } from "../data/AutoBeExperimentCollection";

export default function AutoBeLandingPage() {
  const [selectedModel, setSelectedModel] = useState<
    "openai/gpt-4.1" | "openai/gpt-4.1-mini" | "qwen/qwen3-next-80b-a3b"
  >("openai/gpt-4.1");
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
            Generate 100% working backends through conversation
          </p>
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto">
            Powered by AI-friendly compilers that generate error-free code
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap justify-center gap-6 mb-16">
            <a
              href="https://stackblitz.com/github/wrtnlabs/autobe-playground-stackblitz"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-lg rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25 hover:scale-105"
            >
              Try Playground
            </a>
            <a
              href="https://autobe.dev/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 border-2 border-gray-400 text-white text-lg rounded-full transition-all duration-300 hover:border-white hover:bg-white/10 hover:scale-105"
            >
              Guide Documents
            </a>
            <a
              href="https://github.com/wrtnlabs/autobe"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 border-2 border-blue-400 text-blue-400 text-lg rounded-full transition-all duration-300 hover:bg-blue-400/10 hover:shadow-lg hover:shadow-blue-400/25 hover:scale-105"
            >
              View on GitHub
            </a>
          </div>

          {/* Demo Video */}
          <div className="relative max-w-4xl mx-auto">
            <iframe
              src="https://www.youtube.com/embed/JNreQ0Rk94g"
              title="AutoBE Demonstration (Bulletin Board System)"
              width="100%"
              style={{ aspectRatio: "16/9" }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      {/* Real Examples Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6">Real Examples</h2>
            <p className="text-xl text-gray-300 mb-6">
              See what AutoBE can build with different AI models
            </p>

            {/* Model Tabs */}
            <div className="flex justify-center mb-8">
              <div className="relative bg-gray-800/50 rounded-full p-1 inline-grid grid-cols-3">
                {/* Sliding background indicator */}
                <div
                  className="absolute top-1 bottom-1 bg-blue-600 rounded-full shadow-lg transition-all duration-300 ease-out"
                  style={{
                    width: `calc(33.333% - 4px)`,
                    transform: `translateX(${Object.keys(AutoBeExperimentCollection).indexOf(selectedModel) * 100}%)`,
                    left: "4px",
                  }}
                />
                {Object.entries(AutoBeExperimentCollection).map(
                  ([key, model]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedModel(key as "openai/gpt-4.1")}
                      className={`relative z-10 px-4 py-3 rounded-full text-sm font-medium transition-all duration-200 min-w-[140px] ${
                        selectedModel === key
                          ? "text-white"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      {model.name}
                    </button>
                  ),
                )}
              </div>
            </div>
          </div>

          <div
            className="gap-6 grid grid-cols-1 lg:grid-cols-2"
            style={{
              maxWidth: "920px",
              margin: "0 auto",
            }}
          >
            {AutoBeExperimentCollection[selectedModel].examples.map(
              (example, index) => (
                <a
                  key={index}
                  href={example.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-white/5 border border-gray-600/30 rounded-2xl p-6 transition-all duration-300 hover:bg-white/10 hover:border-gray-500/50 hover:shadow-xl hover:shadow-blue-500/10 hover:scale-[1.02]"
                >
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold">{example.title}</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      {example.description}
                    </p>
                  </div>

                  <div className="mb-6">
                    <table className="w-full">
                      <tbody>
                        {example.phases.map((phase, phaseIndex) => (
                          <tr
                            key={phaseIndex}
                            className="border-b border-gray-700/30 last:border-0"
                          >
                            <td className="py-2 pr-3 w-6">
                              <div
                                className={`w-3 h-3 ${
                                  phase.success === true
                                    ? "bg-green-500"
                                    : phase.success === false
                                      ? "bg-red-500"
                                      : "bg-gray-600"
                                } rounded-full`}
                              ></div>
                            </td>
                            <td className="py-2 pr-3 text-sm w-20">
                              <span
                                className={
                                  phase.success === true
                                    ? "text-white"
                                    : phase.success === false
                                      ? "text-red-400"
                                      : "text-gray-500"
                                }
                              >
                                {phase.name}
                              </span>
                            </td>
                            <td className="py-2 pl-3 text-sm text-gray-400 whitespace-nowrap">
                              {phase.detail}
                            </td>
                            <td className="py-2 px-3 text-sm text-gray-400 text-right w-20 whitespace-nowrap hidden sm:table-cell">
                              {phase.time}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="border-t border-gray-600 pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center text-sm text-gray-400">
                        <span className="mr-2">⏱</span>
                        <span>Elapsed Time</span>
                      </div>
                      <span className="text-blue-400 font-bold">
                        {example.elapsed}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-400">
                        <span className="mr-2">🧠</span>
                        <span>Total Tokens</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-white">
                          {example.tokens}
                        </div>
                        <div className="text-xs text-gray-400">
                          {example.tokensDetail.split("\n").map((line, i) => (
                            <div key={i}>{line}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </a>
              ),
            )}
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Feature 1 */}
            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-gray-600/30 rounded-2xl p-8 transition-all duration-300 hover:from-blue-500/20 hover:to-purple-500/20 hover:border-gray-500/50 hover:shadow-xl hover:shadow-purple-500/10 hover:scale-[1.02]">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-6">
                <div className="text-blue-400 text-2xl">⚡</div>
              </div>
              <h3 className="text-2xl font-bold mb-4">Intelligent Agents</h3>
              <p className="text-gray-300 mb-4">
                40+ specialized agents collaborate
              </p>
              <p className="text-gray-400 text-sm mb-4">
                From requirements analysis to API implementation - the entire
                waterfall development process is fully automated by our
                intelligent agent system.
              </p>
              <p className="text-blue-400 text-sm font-semibold">
                • Analyze • Prisma • Interface • Test • Realize
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gradient-to-br from-pink-500/10 to-red-500/10 border border-gray-600/30 rounded-2xl p-8 transition-all duration-300 hover:from-pink-500/20 hover:to-red-500/20 hover:border-gray-500/50 hover:shadow-xl hover:shadow-pink-500/10 hover:scale-[1.02]">
              <div className="w-16 h-16 bg-pink-500/20 rounded-full flex items-center justify-center mb-6">
                <div className="text-pink-400 text-2xl">✓</div>
              </div>
              <h3 className="text-2xl font-bold mb-4">AST-Based Generation</h3>
              <p className="text-gray-300 mb-4">100% compilation guaranteed</p>
              <p className="text-gray-400 text-sm mb-4">
                AI generates Abstract Syntax Trees first, then compilers
                validate and generate code - ensuring structural correctness
                every time.
              </p>
              <p className="text-pink-400 text-sm font-semibold">
                TypeScript • Prisma • OpenAPI • Zero Errors
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-gray-600/30 rounded-2xl p-8 transition-all duration-300 hover:from-purple-500/20 hover:to-pink-500/20 hover:border-gray-500/50 hover:shadow-xl hover:shadow-purple-500/10 hover:scale-[1.02]">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-6">
                <div className="text-purple-400 text-2xl">🚀</div>
              </div>
              <h3 className="text-2xl font-bold mb-4">Modern Tech Stack</h3>
              <p className="text-gray-300 mb-4">Proven enterprise frameworks</p>
              <p className="text-gray-400 text-sm mb-4">
                Built with TypeScript, NestJS, and Prisma - the most trusted
                tools for enterprise-grade backend applications.
              </p>
              <p className="text-purple-400 text-sm font-semibold">
                PostgreSQL • SQLite • Production-Ready
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gradient-to-br from-green-500/10 to-teal-500/10 border border-gray-600/30 rounded-2xl p-8 transition-all duration-300 hover:from-green-500/20 hover:to-teal-500/20 hover:border-gray-500/50 hover:shadow-xl hover:shadow-green-500/10 hover:scale-[1.02]">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                <div className="text-green-400 text-2xl">📚</div>
              </div>
              <h3 className="text-2xl font-bold mb-4">Enterprise Ready</h3>
              <p className="text-gray-300 mb-4">
                Complete development lifecycle
              </p>
              <p className="text-gray-400 text-sm mb-4">
                Comprehensive documentation, E2E testing, and clean architecture
                that juniors can understand and seniors can extend with AI
                assistants.
              </p>
              <p className="text-green-400 text-sm font-semibold">
                Full Documentation • Testing • Maintainable Code
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-gray-600/30 rounded-2xl p-8 transition-all duration-300 hover:from-yellow-500/20 hover:to-orange-500/20 hover:border-gray-500/50 hover:shadow-xl hover:shadow-orange-500/10 hover:scale-[1.02]">
              <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mb-6">
                <div className="text-yellow-400 text-2xl">💰</div>
              </div>
              <h3 className="text-2xl font-bold mb-4">Cost Effective</h3>
              <p className="text-gray-300 mb-4">
                Reduce development time & cost
              </p>
              <p className="text-gray-400 text-sm mb-4">
                From months to hours of development time. Significantly reduce
                backend development costs while maintaining enterprise-grade
                quality.
              </p>
              <p className="text-yellow-400 text-sm font-semibold">
                Time Saving • Cost Reduction • High ROI
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-gray-600/30 rounded-2xl p-8 transition-all duration-300 hover:from-cyan-500/20 hover:to-blue-500/20 hover:border-gray-500/50 hover:shadow-xl hover:shadow-cyan-500/10 hover:scale-[1.02]">
              <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mb-6">
                <div className="text-cyan-400 text-2xl">🌐</div>
              </div>
              <h3 className="text-2xl font-bold mb-4">
                Open Source & Extensible
              </h3>
              <p className="text-gray-300 mb-4">
                Flexible and community-driven
              </p>
              <p className="text-gray-400 text-sm mb-4">
                Open source project with support for multiple LLMs (GPT-4.1,
                Qwen3), local development, and seamless integration with AI
                coding assistants.
              </p>
              <p className="text-cyan-400 text-sm font-semibold">
                Multi-LLM Support • Local Setup • AI Assistant Ready
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Innovation Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6">Technical Innovation</h2>
            <p className="text-xl text-gray-300">
              Why AutoBE achieves 100% compilation success where others fail
            </p>
          </div>

          <div className="space-y-8">
            {/* AI-Friendly Compilers */}
            <div className="bg-gradient-to-r from-blue-500/5 to-purple-500/5 border border-gray-600/30 rounded-3xl p-12">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h3 className="text-3xl font-bold mb-6">
                    AI-Friendly Compilers
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mr-4 mt-1">
                        <span className="text-white text-sm">✕</span>
                      </div>
                      <div>
                        <p className="font-semibold text-white">
                          Traditional AI Tools
                        </p>
                        <p className="text-gray-400 text-sm">
                          Generate code as text → Often contains syntax errors
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-4 mt-1">
                        <span className="text-white text-sm">✓</span>
                      </div>
                      <div>
                        <p className="font-semibold text-white">
                          AutoBE Approach
                        </p>
                        <p className="text-gray-400 text-sm">
                          AI generates AST → Compiler validates → Perfect code
                          generation
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-black/20 rounded-2xl p-6">
                  <div className="text-sm text-green-400 mb-2">
                    // AutoBE Process
                  </div>
                  <div className="text-gray-300 font-mono text-sm space-y-1">
                    <div>1. AI → Abstract Syntax Tree</div>
                    <div>2. Compiler → Validates Structure</div>
                    <div>3. Generator → Perfect TypeScript</div>
                    <div className="text-green-400 mt-2">
                      ✓ 100% Compilation Success
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Automatic SDK Generation */}
            <div className="bg-gradient-to-r from-purple-500/5 to-indigo-500/5 border border-gray-600/30 rounded-3xl p-12">
              <div className="space-y-8">
                <div>
                  <h3 className="text-3xl font-bold mb-6">
                    Automatic SDK Generation
                  </h3>
                  <p className="text-gray-300 mb-4">
                    Every backend comes with a <span className="text-purple-400 font-semibold">type-safe client SDK</span> - zero configuration, 100% type safety
                  </p>
                  <p className="text-gray-300 mb-8">
                    The SDK powers both frontend integration and E2E test generation, creating a robust feedback loop that ensures backend stability
                  </p>
                </div>
                
                <div className="bg-black/20 rounded-2xl p-6">
                  <pre className="text-gray-300 font-mono text-xs lg:text-sm">
<span className="text-blue-300">import</span> api, {"{"} <span className="text-cyan-300">IPost</span> {"}"} <span className="text-blue-300">from</span> <span className="text-green-400">"autobe-generated-sdk"</span>;{"\n"}
{"\n"}<span className="text-gray-500">// Type-safe API calls with full autocomplete</span>{"\n"}
<span className="text-blue-300">const</span> connection: <span className="text-cyan-300">api.IConnection</span> = {"{"}{"\n"}
{"  "}host: <span className="text-green-400">"http://localhost:1234"</span>,{"\n"}
{"}"};{"\n"}
<span className="text-blue-300">await</span> api.functional.users.<span className="text-yellow-300">login</span>(connection, {"{"}{"\n"}
{"  "}email: <span className="text-green-400">"user@example.com"</span>,{"\n"}
{"  "}password: <span className="text-green-400">"secure-password"</span>{"\n"}
{"}"});{"\n"}
{"\n"}<span className="text-gray-500">// TypeScript catches errors at compile time</span>{"\n"}
<span className="text-blue-300">const</span> post: <span className="text-cyan-300">IPost</span> = <span className="text-blue-300">await</span> api.functional.posts.<span className="text-yellow-300">create</span>(connection, {"{"}{"\n"}
{"  "}title: <span className="text-green-400">"Hello World"</span>,{"\n"}
{"  "}content: <span className="text-green-400">"My first post"</span>,{"\n"}
{"  "}<span className="text-gray-500">// authorId: "123" {"<-"} TypeScript error if this field is missing!</span>{"\n"}
{"}"});
                  </pre>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex items-start bg-purple-500/5 border border-purple-600/20 rounded-xl p-4 transition-all duration-300 hover:bg-purple-500/10 hover:border-purple-600/40 hover:scale-[1.02]">
                    <span className="text-purple-400 mr-3">📦</span>
                    <div>
                      <p className="font-semibold text-white">Zero Configuration</p>
                      <p className="text-gray-400 text-sm">
                        Auto-generated with your backend
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start bg-purple-500/5 border border-purple-600/20 rounded-xl p-4 transition-all duration-300 hover:bg-purple-500/10 hover:border-purple-600/40 hover:scale-[1.02]">
                    <span className="text-purple-400 mr-3">🔒</span>
                    <div>
                      <p className="font-semibold text-white">100% Type Safety</p>
                      <p className="text-gray-400 text-sm">
                        Full TypeScript support & validation
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start bg-purple-500/5 border border-purple-600/20 rounded-xl p-4 transition-all duration-300 hover:bg-purple-500/10 hover:border-purple-600/40 hover:scale-[1.02]">
                    <span className="text-purple-400 mr-3">⚡</span>
                    <div>
                      <p className="font-semibold text-white">Frontend Ready</p>
                      <p className="text-gray-400 text-sm">
                        Works with React, Vue, Angular
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start bg-purple-500/5 border border-purple-600/20 rounded-xl p-4 transition-all duration-300 hover:bg-purple-500/10 hover:border-purple-600/40 hover:scale-[1.02]">
                    <span className="text-purple-400 mr-3">🧪</span>
                    <div>
                      <p className="font-semibold text-white">E2E Test Integration</p>
                      <p className="text-gray-400 text-sm">
                        Powers AI-generated test suites
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Current Limitations Section */}
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
                    While we guarantee 100% compilation success, runtime behavior may need testing and refinement. 
                    Our v1.0 release (Q4 2025) targets 100% runtime success.
                  </p>
                </div>
              </div>
              <div className="pl-14">
                <div className="text-xs text-gray-500 font-mono bg-black/30 rounded p-2">
                  Current: 100% Compilation ✓<br/>
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
                    Complex projects require significant AI tokens. We're implementing RAG optimization 
                    to reduce token usage by up to 70%.
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
                    AI-generated designs may differ from your vision. Always review the generated 
                    specifications before implementation.
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
              Despite these limitations, AutoBE significantly accelerates backend development
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
    </div>
  );
}

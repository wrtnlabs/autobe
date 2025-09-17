"use client";

import { useState } from "react";

// @todo This is hard coded value by image scanning.
//       Therefore, it must be synchronized with experiments
//       and also must be normalized
const MODEL_DATA = {
  "openai/gpt-4.1": {
    name: "openai/gpt-4.1",
    examples: [
      {
        title: "To Do List",
        description: "Simple task management application",
        url: "https://github.com/wrtnlabs/autobe-example-todo",
        elapsed: "1h 8m 57s",
        tokens: "4.43M",
        tokensDetail: "in: 4.23M (51.7K cached)\nout: 199.4K",
        phases: [
          {
            name: "Analyze",
            time: "11m 51s",
            detail: "actors: 2, docs: 11",
            success: true,
          },
          {
            name: "Prisma",
            time: "2m 55s",
            detail: "tags: 2, models: 3",
            success: true,
          },
          {
            name: "Interface",
            time: "9m 03s",
            detail: "functions: 16, schemas: 16",
            success: true,
          },
          {
            name: "Test",
            time: "37m 18s",
            detail: "functions: 23",
            success: true,
          },
          {
            name: "Realize",
            time: "7m 49s",
            detail: "functions: 16",
            success: true,
          },
        ],
      },
      {
        title: "Reddit Community",
        description: "Social discussion platform with voting system",
        url: "https://github.com/wrtnlabs/autobe-example-reddit",
        elapsed: "1h 43m 18s",
        tokens: "30.94M",
        tokensDetail: "in: 29.61M (304.3K cached)\nout: 1.33M",
        phases: [
          {
            name: "Analyze",
            time: "6m 40s",
            detail: "actors: 3, docs: 12",
            success: true,
          },
          {
            name: "Prisma",
            time: "7m 57s",
            detail: "tags: 6, models: 20",
            success: true,
          },
          {
            name: "Interface",
            time: "24m 19s",
            detail: "functions: 101, schemas: 105",
            success: true,
          },
          {
            name: "Test",
            time: "53m 18s",
            detail: "functions: 127",
            success: true,
          },
          {
            name: "Realize",
            time: "11m 02s",
            detail: "functions: 101",
            success: true,
          },
        ],
      },
      {
        title: "Discussion Board",
        description: "Political & economic discussion platform",
        url: "https://github.com/wrtnlabs/autobe-example-bbs",
        elapsed: "2h 2m 26s",
        tokens: "38.93M",
        tokensDetail: "in: 37.31M (180.0K cached)\nout: 1.62M",
        phases: [
          {
            name: "Analyze",
            time: "5m 52s",
            detail: "actors: 4, docs: 11",
            success: true,
          },
          {
            name: "Prisma",
            time: "7m 20s",
            detail: "tags: 8, models: 28",
            success: true,
          },
          {
            name: "Interface",
            time: "31m 36s",
            detail: "functions: 126, schemas: 127",
            success: true,
          },
          {
            name: "Test",
            time: "1h 6m 21s",
            detail: "functions: 147",
            success: true,
          },
          {
            name: "Realize",
            time: "11m 15s",
            detail: "functions: 126",
            success: true,
          },
        ],
      },
      {
        title: "E-Commerce",
        description: "Full-featured online shopping platform",
        url: "https://github.com/wrtnlabs/autobe-example-shopping",
        elapsed: "3h 36m 50s",
        tokens: "256.01M",
        tokensDetail: "in: 250.26M (2.15M cached)\nout: 5.74M",
        phases: [
          {
            name: "Analyze",
            time: "7m 55s",
            detail: "actors: 4, docs: 16",
            success: true,
          },
          {
            name: "Prisma",
            time: "19m 08s",
            detail: "tags: 10, models: 111",
            success: true,
          },
          {
            name: "Interface",
            time: "35m 39s",
            detail: "functions: 522, schemas: 423",
            success: true,
          },
          {
            name: "Test",
            time: "1h 27m 09s",
            detail: "functions: 507",
            success: true,
          },
          {
            name: "Realize",
            time: "1h 6m 57s",
            detail: "functions: 522",
            success: true,
          },
        ],
      },
    ],
  },
  "openai/gpt-4.1-mini": {
    name: "openai/gpt-4.1-mini",
    examples: [
      {
        title: "To Do List",
        description: "Simple task management application",
        url: "https://github.com/wrtnlabs/autobe-example-todo-openai-gpt-4.1-mini",
        elapsed: "42m 31s",
        tokens: "9.14M",
        tokensDetail: "in: 8.79M (95.5K cached)\nout: 349.7K",
        phases: [
          {
            name: "Analyze",
            time: "2m 16s",
            detail: "actors: 3, docs: 4",
            success: true,
          },
          {
            name: "Prisma",
            time: "1m 30s",
            detail: "tags: 2, models: 4",
            success: true,
          },
          {
            name: "Interface",
            time: "16m 14s",
            detail: "functions: 31, schemas: 30",
            success: true,
          },
          {
            name: "Test",
            time: "14m 18s",
            detail: "functions: 46",
            success: true,
          },
          {
            name: "Realize",
            time: "8m 11s",
            detail: "functions: 31",
            success: true,
          },
        ],
      },
      {
        title: "Reddit Community",
        description: "Social discussion platform with voting system",
        url: "https://github.com/wrtnlabs/autobe-example-reddit-openai-gpt-4.1-mini",
        elapsed: "1h 17m 30s",
        tokens: "34.38M",
        tokensDetail: "in: 33.24M (203.3K cached)\nout: 1.14M",
        phases: [
          {
            name: "Analyze",
            time: "13m 20s",
            detail: "actors: 3, docs: 11",
            success: true,
          },
          {
            name: "Prisma",
            time: "2m 13s",
            detail: "tags: 6, models: 15",
            success: true,
          },
          {
            name: "Interface",
            time: "22m 14s",
            detail: "functions: 78, schemas: 89",
            success: true,
          },
          {
            name: "Test",
            time: "22m 45s",
            detail: "functions: 111",
            success: true,
          },
          {
            name: "Realize",
            time: "16m 56s",
            detail: "functions: 78, E: 4",
            success: true,
          },
        ],
      },
      {
        title: "Discussion Board",
        description: "Political & economic discussion platform",
        url: "https://github.com/wrtnlabs/autobe-example-bbs-openai-gpt-4.1-mini",
        elapsed: "1h 21m 47s",
        tokens: "84.18M",
        tokensDetail: "in: 82.19M (432.3K cached)\nout: 1.99M",
        phases: [
          {
            name: "Analyze",
            time: "5m 36s",
            detail: "actors: 4, docs: 10",
            success: true,
          },
          {
            name: "Prisma",
            time: "4m 00s",
            detail: "tags: 7, models: 26",
            success: true,
          },
          {
            name: "Interface",
            time: "20m 47s",
            detail: "functions: 196, schemas: 205",
            success: true,
          },
          {
            name: "Test",
            time: "31m 59s",
            detail: "functions: 239",
            success: true,
          },
          {
            name: "Realize",
            time: "19m 22s",
            detail: "functions: 196, E: 7",
            success: true,
          },
        ],
      },
      {
        title: "E-Commerce",
        description: "Full-featured online shopping platform",
        url: "https://github.com/wrtnlabs/autobe-example-shopping-openai-gpt-4.1-mini",
        elapsed: "1h 46m 34s",
        tokens: "160.81M",
        tokensDetail: "in: 157.21M (142.5K cached)\nout: 3.60M",
        phases: [
          {
            name: "Analyze",
            time: "1m 38s",
            detail: "actors: 4, docs: 12",
            success: true,
          },
          {
            name: "Prisma",
            time: "4m 54s",
            detail: "tags: 10, models: 48",
            success: true,
          },
          {
            name: "Interface",
            time: "25m 34s",
            detail: "functions: 347, schemas: 280",
            success: true,
          },
          {
            name: "Test",
            time: "48m 55s",
            detail: "functions: 433",
            success: true,
          },
          {
            name: "Realize",
            time: "15m 31s",
            detail: "functions: 347, E: 8",
            success: true,
          },
        ],
      },
    ],
  },
  "qwen/qwen3-next-80b-a3b": {
    name: "qwen/qwen3-next-80b-a3b",
    examples: [
      {
        title: "To Do List",
        description: "Simple task management application",
        url: "https://github.com/wrtnlabs/autobe-example-todo-qwen-qwen3-next-80b-a3b-instruct",
        elapsed: "1h 4m 20s",
        tokens: "10.17M",
        tokensDetail: "in: 9.78M\nout: 386.4K",
        phases: [
          {
            name: "Analyze",
            time: "6m 20s",
            detail: "actors: 1, docs: 6",
            success: true,
          },
          {
            name: "Prisma",
            time: "2m 04s",
            detail: "tags: 2, models: 3",
            success: true,
          },
          {
            name: "Interface",
            time: "24m 45s",
            detail: "functions: 11, schemas: 19",
            success: true,
          },
          {
            name: "Test",
            time: "24m 14s",
            detail: "functions: 47",
            success: true,
          },
          {
            name: "Realize",
            time: "6m 55s",
            detail: "functions: 11, E: 1",
            success: false,
          },
        ],
      },
      {
        title: "Reddit Community",
        description: "Social discussion platform with voting system",
        url: "https://github.com/wrtnlabs/autobe-example-reddit-qwen-qwen3-next-80b-a3b-instruct",
        elapsed: "2h 33m 21s",
        tokens: "30.08M",
        tokensDetail: "in: 28.50M\nout: 1.57M",
        phases: [
          {
            name: "Analyze",
            time: "15m 46s",
            detail: "actors: 3, docs: 11",
            success: true,
          },
          {
            name: "Prisma",
            time: "11m 39s",
            detail: "tags: 8, models: 14",
            success: true,
          },
          {
            name: "Interface",
            time: "52m 21s",
            detail: "functions: 60, schemas: 56",
            success: true,
          },
          {
            name: "Test",
            time: "51m 19s",
            detail: "functions: 9",
            success: true,
          },
          {
            name: "Realize",
            time: "22m 13s",
            detail: "functions: 60, E: 4",
            success: false,
          },
        ],
      },
      {
        title: "Discussion Board",
        description: "Political & economic discussion platform",
        url: "https://github.com/wrtnlabs/autobe-example-bbs-qwen-qwen3-next-80b-a3b-instruct",
        elapsed: "3h 5m 27s",
        tokens: "45.04M",
        tokensDetail: "in: 42.91M\nout: 2.12M",
        phases: [
          {
            name: "Analyze",
            time: "6m 56s",
            detail: "actors: 4, docs: 10",
            success: true,
          },
          {
            name: "Prisma",
            time: "9m 13s",
            detail: "tags: 10, models: 46",
            success: true,
          },
          {
            name: "Interface",
            time: "1h 13m 49s",
            detail: "functions: 68, schemas: 130",
            success: true,
          },
          {
            name: "Test",
            time: "54m 27s",
            detail: "functions: 26, E: 2",
            success: false,
          },
          {
            name: "Realize",
            time: "40m 59s",
            detail: "functions: 68, E: 5",
            success: false,
          },
        ],
      },
      {
        title: "E-Commerce",
        description: "Full-featured online shopping platform",
        url: "https://github.com/wrtnlabs/autobe-example-shopping-qwen-qwen3-next-80b-a3b-instruct",
        elapsed: "31m 49s",
        tokens: "3.50M",
        tokensDetail: "in: 3.26M\nout: 233.9K",
        phases: [
          {
            name: "Analyze",
            time: "6m 09s",
            detail: "actors: 5, docs: 9",
            success: true,
          },
          {
            name: "Prisma",
            time: "25m 40s",
            detail: "tags: 10, models: 57",
            success: true,
          },
          { name: "Interface", time: "-", detail: "-", success: null },
          { name: "Test", time: "-", detail: "-", success: null },
          { name: "Realize", time: "-", detail: "-", success: null },
        ],
      },
    ],
  },
};

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
            Generate 100% compilable TypeScript backends through conversation
          </p>
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto">
            Powered by AI-friendly compilers and AST-based code generation
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Feature 1 */}
            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-gray-600/30 rounded-2xl p-8">
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
            <div className="bg-gradient-to-br from-pink-500/10 to-red-500/10 border border-gray-600/30 rounded-2xl p-8">
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
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-gray-600/30 rounded-2xl p-8">
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
            <div className="bg-gradient-to-br from-green-500/10 to-teal-500/10 border border-gray-600/30 rounded-2xl p-8">
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
            <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-gray-600/30 rounded-2xl p-8">
              <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mb-6">
                <div className="text-yellow-400 text-2xl">💰</div>
              </div>
              <h3 className="text-2xl font-bold mb-4">Cost Effective</h3>
              <p className="text-gray-300 mb-4">
                Reduce development time & cost
              </p>
              <p className="text-gray-400 text-sm mb-4">
                From weeks to hours of development time. Significantly reduce
                backend development costs while maintaining enterprise-grade
                quality.
              </p>
              <p className="text-yellow-400 text-sm font-semibold">
                Time Saving • Cost Reduction • High ROI
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-gray-600/30 rounded-2xl p-8">
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
              <div className="bg-gray-800/50 rounded-full p-1">
                {Object.entries(MODEL_DATA).map(([key, model]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedModel(key as "openai/gpt-4.1")}
                    className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 ${
                      selectedModel === key
                        ? "bg-blue-600 text-white shadow-lg"
                        : "text-gray-400 hover:text-gray-300"
                    }`}
                  >
                    {model.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Legend */}
            <p className="text-sm text-gray-500 mb-8">
              A: Actors • D: Documents • N: Namespaces • M: Models • O:
              Operations • S: Schemas • F: Functions • E: Errors
            </p>
          </div>

          <div
            className="gap-6 grid grid-cols-1 md:grid-cols-2"
            style={{
              maxWidth: "920px",
              margin: "0 auto",
            }}
          >
            {MODEL_DATA[selectedModel].examples.map((example, index) => (
              <a
                key={index}
                href={example.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/5 border border-gray-600/30 rounded-2xl p-6 hover:bg-white/10 transition-colors duration-200 block"
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
                          <td className="py-2 px-3 text-sm text-gray-400 text-right w-20 whitespace-nowrap">
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
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

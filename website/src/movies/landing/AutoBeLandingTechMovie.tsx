"use client";

export default function AutoBeLandingTechMovie() {
  return (
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
                  Every backend comes with a{" "}
                  <span className="text-purple-400 font-semibold">
                    type-safe client SDK
                  </span>{" "}
                  - zero configuration, 100% type safety
                </p>
                <p className="text-gray-300 mb-8">
                  The SDK powers both frontend integration and E2E test
                  generation, creating a robust feedback loop that ensures
                  backend stability
                </p>
              </div>

              <div className="bg-black/20 rounded-2xl p-6">
                <pre className="text-gray-300 font-mono text-xs lg:text-sm">
                  <span className="text-blue-300">import</span> api, {"{"}{" "}
                  <span className="text-cyan-300">IPost</span> {"}"}{" "}
                  <span className="text-blue-300">from</span>{" "}
                  <span className="text-green-400">"autobe-generated-sdk"</span>
                  ;{"\n"}
                  {"\n"}
                  <span className="text-gray-500">
                    // Type-safe API calls with full autocomplete
                  </span>
                  {"\n"}
                  <span className="text-blue-300">const</span> connection:{" "}
                  <span className="text-cyan-300">api.IConnection</span> = {"{"}
                  {"\n"}
                  {"  "}host:{" "}
                  <span className="text-green-400">
                    "http://localhost:1234"
                  </span>
                  ,{"\n"}
                  {"}"};{"\n"}
                  <span className="text-blue-300">await</span>{" "}
                  api.functional.users.
                  <span className="text-yellow-300">
                    login
                  </span>(connection, {"{"}
                  {"\n"}
                  {"  "}body: {"{"}
                  {"\n"}
                  {"    "}email:{" "}
                  <span className="text-green-400">"user@example.com"</span>,
                  {"\n"}
                  {"    "}password:{" "}
                  <span className="text-green-400">"secure-password"</span>,
                  {"\n"}
                  {"  "}
                  {"}"},{"\n"}
                  {"}"});{"\n"}
                  {"\n"}
                  <span className="text-gray-500">
                    // TypeScript catches errors at compile time
                  </span>
                  {"\n"}
                  <span className="text-blue-300">const</span> post:{" "}
                  <span className="text-cyan-300">IPost</span> ={" "}
                  <span className="text-blue-300">await</span>{" "}
                  api.functional.posts.
                  <span className="text-yellow-300">
                    create
                  </span>(connection, {"{"}
                  {"\n"}
                  {"  "}body: {"{"}
                  {"\n"}
                  {"    "}title:{" "}
                  <span className="text-green-400">"Hello World"</span>,{"\n"}
                  {"    "}content:{" "}
                  <span className="text-green-400">"My first post"</span>,{"\n"}
                  {"    "}
                  <span className="text-gray-500">
                    // authorId: "123" {"<-"} TypeScript error if this field is
                    missing!
                  </span>
                  {"\n"}
                  {"  "}
                  {"}"},{"\n"}
                  {"}"});
                </pre>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-start bg-purple-500/5 border border-purple-600/20 rounded-xl p-4 transition-all duration-300 hover:bg-purple-500/10 hover:border-purple-600/40 hover:scale-[1.02]">
                  <span className="text-purple-400 mr-3">📦</span>
                  <div>
                    <p className="font-semibold text-white">
                      Zero Configuration
                    </p>
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
                    <p className="font-semibold text-white">
                      E2E Test Integration
                    </p>
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
  );
}

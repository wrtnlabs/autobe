"use client";

export default function AutoBeLandingHeroMovie() {
  return (
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
    </section>
  );
}

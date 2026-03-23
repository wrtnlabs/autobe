"use client";

import FadeIn from "./FadeIn";
import AutoBeDemoMovie from "./AutoBeLandingDemoMovie";
import AutoBeLandingHeroMovie from "./AutoBeLandingHeroMovie";
import AutoBeLandingLimitMovie from "./AutoBeLandingLimitMovie";
import AutoBeLandingStrengthMovie from "./AutoBeLandingStrengthMovie";
import AutoBeLandingTechMovie from "./AutoBeLandingTechMovie";

function SectionDivider() {
  return (
    <div className="max-w-5xl mx-auto px-6">
      <div className="h-px bg-gradient-to-r from-transparent via-neutral-800 to-transparent" />
    </div>
  );
}

export default function AutoBeLandingMovie() {
  return (
    <>
      <style jsx global>{`
        .nextra-content,
        .nx-container {
          padding: 0 !important;
          max-width: none !important;
        }
      `}</style>
      <div className="text-white bg-neutral-950">
        {/* Hero */}
        <AutoBeLandingHeroMovie />

        <SectionDivider />

        {/* Tech: how it works */}
        <AutoBeLandingTechMovie />

        <SectionDivider />

        {/* Demo: real examples */}
        <AutoBeDemoMovie />

        <SectionDivider />

        {/* Strength: why AutoBE */}
        <AutoBeLandingStrengthMovie />

        <SectionDivider />

        {/* Limitations */}
        <AutoBeLandingLimitMovie />

        <SectionDivider />

        {/* Bottom CTA */}
        <section className="relative py-48 px-6 text-center bg-neutral-950 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse_at_center,_rgba(59,130,246,0.05)_0%,_transparent_70%)] pointer-events-none" />
          <FadeIn>
            <div className="relative max-w-2xl mx-auto">
              <h2 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-6">
                Start talking
              </h2>
              <p className="text-base text-neutral-500 mb-14">
                Your next backend starts with a conversation.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
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
            </div>
          </FadeIn>
        </section>
      </div>
    </>
  );
}

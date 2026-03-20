"use client";

import AutoBeDemoMovie from "./AutoBeLandingDemoMovie";
import AutoBeLandingHeroMovie from "./AutoBeLandingHeroMovie";
import AutoBeLandingLimitMovie from "./AutoBeLandingLimitMovie";
import AutoBeLandingStrengthMovie from "./AutoBeLandingStrengthMovie";
import AutoBeLandingTechMovie from "./AutoBeLandingTechMovie";

export default function AutoBeLandingMovie() {
  return (
    <>
      <style jsx global>{`
        /* Landing-only layout primitives (root page) */
        .landing-container {
          width: 100%;
          max-width: 72rem; /* ~ max-w-6xl */
          margin-left: auto;
          margin-right: auto;
          padding-left: 1.5rem;
          padding-right: 1.5rem;
        }
        .landing-section {
          padding-top: 5rem;
          padding-bottom: 5rem;
        }
        @media (min-width: 768px) {
          .landing-section {
            padding-top: 7rem;
            padding-bottom: 7rem;
          }
        }
        .landing-grid {
          display: grid;
          grid-template-columns: repeat(12, minmax(0, 1fr));
          column-gap: 1.5rem;
          row-gap: 2rem;
        }
        @media (min-width: 768px) {
          .landing-grid {
            column-gap: 2rem;
          }
        }

        @media (max-width: 640px) {
          .nextra-content {
            padding: 0 !important;
            margin: 0 !important;
            max-width: none !important;
          }
          .nx-container {
            padding: 0 !important;
            margin: 0 !important;
            max-width: none !important;
          }
          .nx-mx-auto {
            margin: 0 !important;
          }
          .nx-max-w-screen-lg {
            max-width: none !important;
          }
          article {
            padding: 0 !important;
            margin: 0 !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>
      <div className="autobe-landing text-slate-50 overflow-hidden">
        <AutoBeLandingHeroMovie />
        <AutoBeDemoMovie />
        <AutoBeLandingStrengthMovie />
        <AutoBeLandingTechMovie />
        <AutoBeLandingLimitMovie />
      </div>
    </>
  );
}

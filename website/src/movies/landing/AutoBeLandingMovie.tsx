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
      <div className="text-white overflow-hidden">
        <AutoBeLandingHeroMovie />
        <AutoBeDemoMovie />
        <AutoBeLandingStrengthMovie />
        <AutoBeLandingTechMovie />
        <AutoBeLandingLimitMovie />
      </div>
    </>
  );
}

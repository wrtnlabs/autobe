"use client";

import AutoBeDemoMovie from "./AutoBeLandingDemoMovie";
import AutoBeLandingHeroMovie from "./AutoBeLandingHeroMovie";
import AutoBeLandingLimitMovie from "./AutoBeLandingLimitMovie";
import AutoBeLandingStrengthMovie from "./AutoBeLandingStrengthMovie";
import AutoBeLandingTechMovie from "./AutoBeLandingTechMovie";

export default function AutoBeLandingMovie() {
  return (
    <div className="text-white overflow-hidden">
      <AutoBeLandingHeroMovie />
      <AutoBeDemoMovie />
      <AutoBeLandingStrengthMovie />
      <AutoBeLandingTechMovie />
      <AutoBeLandingLimitMovie />
    </div>
  );
}

"use client";

import AutoBeLandingHeroMovie from "./AutoBeLandingHeroMovie";
import AutoBeLandingDemoMovie from "./AutoBeLandingDemoMovie";
import AutoBeLandingStrengthMovie from "./AutoBeLandingStrengthMovie";
import AutoBeLandingTechMovie from "./AutoBeLandingTechMovie";
import AutoBeLandingLimitMovie from "./AutoBeLandingLimitMovie";

export default function AutoBeLandingMovie() {
  return (
    <div className="text-white overflow-hidden">
      <AutoBeLandingHeroMovie />
      <AutoBeLandingDemoMovie />
      <AutoBeLandingStrengthMovie />
      <AutoBeLandingTechMovie />
      <AutoBeLandingLimitMovie />
    </div>
  );
}
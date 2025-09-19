"use client";

import AutoBeLandingHeroMovie from "./AutoBeLandingHeroMovie";
import AutoBeLandingDemoReplayMovie from "./AutoBeLandingDemoReplayMovie";
import AutoBeLandingStrengthMovie from "./AutoBeLandingStrengthMovie";
import AutoBeLandingTechMovie from "./AutoBeLandingTechMovie";
import AutoBeLandingLimitMovie from "./AutoBeLandingLimitMovie";

export default function AutoBeLandingMovie() {
  return (
    <div className="text-white overflow-hidden">
      <AutoBeLandingHeroMovie />
      <AutoBeLandingDemoReplayMovie />
      <AutoBeLandingStrengthMovie />
      <AutoBeLandingTechMovie />
      <AutoBeLandingLimitMovie />
    </div>
  );
}
import { StringUtil } from "@autobe/utils";

import { AutoBeState } from "../context/AutoBeState";

/** Pipeline phase names in waterfall order. */
type StepName = "analyze" | "prisma" | "interface" | "test" | "realize";

/**
 * Validates pipeline state before executing a phase, returning user-friendly
 * error message if prerequisites are missing or outdated.
 *
 * Enforces the waterfall dependency structure: each phase requires all previous
 * phases to be completed with matching step counters. When requirements change
 * (analyze step increments), downstream phases become invalid through step
 * mismatch, and this function generates clear messages guiding users to
 * regenerate affected phases.
 *
 * This is the gatekeeper preventing users from executing phases out of order or
 * with stale dependencies, ensuring generated artifacts always reflect current
 * requirements. Without this validation, users could generate API
 * implementations based on outdated database schemas, causing subtle bugs.
 *
 * @param state Current pipeline state
 * @param future Phase attempting to execute
 * @returns Error message if validation fails, null if valid to proceed
 */
export const predicateStateMessage = (
  state: AutoBeState,
  future: StepName,
): string | null => {
  if (future === "analyze") return null;
  if (future === "prisma") return predicatePrisma(state);

  const futureIndex: number = STEP_ORDER.indexOf(future);
  for (const key of STEP_ORDER.slice(0, futureIndex))
    if (state[key] === null) return buildMissingStepsMessage(future, key);

  const prevStepName: StepName = STEP_ORDER[futureIndex - 1];
  if (state.analyze!.step !== state[prevStepName]!.step)
    return buildOutdatedMessage(prevStepName, "analyze", state);
  return null;
};

/** Generates error message listing steps needed to reach current phase. */
const buildMissingStepsMessage = (
  current: StepName,
  missing: StepName,
): string => {
  const currentIndex: number = STEP_ORDER.indexOf(current);
  const missingIndex: number = STEP_ORDER.indexOf(missing);
  const remainingSteps: string = STEP_ORDER.slice(
    missingIndex,
    currentIndex + 1,
  )
    .map((step, index) => `${index + 1}. ${STEP_DESCRIPTIONS[step]}`)
    .join("\n    ");

  const currentAction = ACTION_NAMES[current];

  return StringUtil.trim`
    ${STEP_DESCRIPTIONS[missing]} not completed yet.

    To ${currentAction}, complete these steps:
    
    ${remainingSteps}

    Start with step ${missingIndex + 1}.
  `;
};

/**
 * Generates error message indicating phase is outdated due to requirements
 * change.
 */
const buildOutdatedMessage = (
  outdatedStep: StepName,
  currentStep: StepName,
  state: AutoBeState,
): string => {
  const outdatedVersion = state[outdatedStep]?.step;
  const currentVersion = state[currentStep]?.step;

  return StringUtil.trim`
    ${STEP_NAMES[outdatedStep]} is outdated (step ${outdatedVersion}).
    
    Requirements are now at step ${currentVersion}.
    
    Please update ${outdatedStep} to match current requirements.
  `;
};

/** Special validation for Prisma phase requiring only analyze completion. */
const predicatePrisma = (state: AutoBeState): string | null => {
  if (state.analyze !== null) return null;
  return StringUtil.trim`
    Requirements analysis not started.
    
    Discuss your project with AI to generate requirements analysis.
    Database design will follow after requirements are ready.
  `;
};

const STEP_DESCRIPTIONS: Record<StepName, string> = {
  analyze: "Requirements analysis",
  prisma: "Database design",
  interface: "API interface design",
  test: "E2E test creation",
  realize: "Implementation",
};

const STEP_NAMES: Record<StepName, string> = {
  analyze: "Requirements analysis",
  prisma: "Database schema",
  interface: "API interface",
  test: "Test functions",
  realize: "Implementation",
};

const ACTION_NAMES: Record<StepName, string> = {
  analyze: "analyze requirements",
  prisma: "design database",
  interface: "design API interface",
  test: "create tests",
  realize: "implement the program",
};

const STEP_ORDER: StepName[] = [
  "analyze",
  "prisma",
  "interface",
  "test",
  "realize",
];

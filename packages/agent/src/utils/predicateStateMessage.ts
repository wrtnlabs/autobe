import { StringUtil } from "@autobe/utils";

import { AutoBeState } from "../context/AutoBeState";

type StepName = "analyze" | "prisma" | "interface" | "test" | "realize";

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

const buildMissingStepsMessage = (
  current: StepName,
  future: StepName,
): string => {
  const currentIndex: number = STEP_ORDER.indexOf(current);
  const missingIndex: number = STEP_ORDER.indexOf(future);
  const remainingSteps: string = STEP_ORDER.slice(
    missingIndex,
    currentIndex + 1,
  )
    .map((step, index) => `${index + 1}. ${STEP_DESCRIPTIONS[step]}`)
    .map((str) => `    ${str}`)
    .join("\n");
  const actionName: string =
    current === "realize"
      ? "implement the main program"
      : current === "test"
        ? "create test functions"
        : current === "interface"
          ? "create API interface design"
          : "continue";
  return StringUtil.trim`
    ${STEP_DESCRIPTIONS[future].replace(/^[A-Z]/, (c) => c.toLowerCase())} has not been proceeded yet.

    To ${actionName}, you need to complete these ${missingIndex === 0 ? "steps" : "remaining steps"} in order:
    
    ${remainingSteps.trimStart()}

    Please ${missingIndex === 0 ? "start with the requirement analysis first" : "continue with the " + future + " step"}.
  `;
};

const buildOutdatedMessage = (
  outdatedStep: StepName,
  currentStep: StepName,
  state: AutoBeState,
): string => {
  const outdatedVersion = state[outdatedStep]?.step;
  const currentVersion = state[currentStep]?.step;

  return StringUtil.trim`
    ${STEP_DESCRIPTIONS[outdatedStep]} is outdated compared to ${STEP_DESCRIPTIONS[currentStep].toLowerCase()}.

    The ${outdatedStep} (step ${outdatedVersion}) is behind the 
    ${currentStep} (step ${currentVersion}).

    Please update the ${outdatedStep} to match the latest requirements.
  `;
};

const predicatePrisma = (state: AutoBeState): string | null => {
  if (state.analyze !== null) return null;
  return StringUtil.trim`
    Requirement analysis has not been proceeded yet.

    Debate what you want to make with AI, so let the AI to write 
    the requirement analysis report about the subject.

    Designing database can be resumed after the requirement analysis 
    is completed.
  `;
};

const STEP_DESCRIPTIONS: Record<StepName, string> = {
  analyze:
    "Debate what you want to make with AI and write requirement analysis report",
  prisma: "Design database schema (Prisma) based on the requirements",
  interface: "Create API interface specification",
  test: "Create e2e test functions",
  realize: "Implement the main program",
};

const STEP_ORDER: StepName[] = [
  "analyze",
  "prisma",
  "interface",
  "test",
  "realize",
];

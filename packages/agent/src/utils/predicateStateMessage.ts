import { StringUtil } from "@autobe/utils";

import { AutoBeState } from "../context/AutoBeState";

type StepName = "analyze" | "prisma" | "interface" | "test" | "realize";

export const predicateStateMessage = (
  state: AutoBeState,
  future: "analyze" | "prisma" | "interface" | "test" | "realize",
): string | null => {
  if (future === "analyze") return null;
  else if (future === "prisma") return predicatePrisma(state);
  else if (future === "interface") return predicateInterface(state);
  else if (future === "test") return predicateTest(state);
  else if (future === "realize") return predicateRealize(state);
  future satisfies never;
  throw new Error("Unknown current state");
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

const predicateInterface = (state: AutoBeState): string | null => {
  if (state.analyze === null)
    return buildMissingStepsMessage("interface", "analyze");
  else if (state.prisma === null)
    return buildMissingStepsMessage("interface", "prisma");
  else if (state.analyze.step !== state.prisma.step)
    return buildOutdatedMessage("prisma", "analyze", state);
  return null;
};

const predicateTest = (state: AutoBeState): string | null => {
  if (state.analyze === null)
    return buildMissingStepsMessage("test", "analyze");
  else if (state.prisma === null)
    return buildMissingStepsMessage("test", "prisma");
  else if (state.interface === null)
    return buildMissingStepsMessage("test", "interface");
  else if (state.analyze.step !== state.interface.step)
    return buildOutdatedMessage("interface", "analyze", state);
  return null;
};

const predicateRealize = (state: AutoBeState): string | null => {
  if (state.analyze === null)
    return buildMissingStepsMessage("realize", "analyze");
  else if (state.prisma === null)
    return buildMissingStepsMessage("realize", "prisma");
  else if (state.interface === null)
    return buildMissingStepsMessage("realize", "interface");
  else if (state.test === null)
    return buildMissingStepsMessage("realize", "test");
  else if (state.analyze.step !== state.test.step)
    return buildOutdatedMessage("test", "analyze", state);
  return null;
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

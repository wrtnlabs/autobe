import { StringUtil } from "@autobe/utils";

import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../context/AutoBeState";

export function transformFacadeStateMessage(state: AutoBeState): string {
  const currentState: ICurrentState = getCurrentState(state);
  return AutoBeSystemPromptConstant.FACADE.replace(
    "{% STATE %}",
    StringUtil.trim`
      ## Current State

      The current execution status of each functional agent is shown below. 
      Each agent can be in one of three states: "none" (never executed), 
      "up-to-date" (successfully executed with current output), 
      or "out-of-date" (previously executed but needs updating due to 
      changes in earlier stages).

      An agent cannot be executed if any of its prerequisite agents have 
      a status of "none" or "out-of-date". In such cases, you must complete or 
      update the earlier stages first. Additionally, re-executing an "up-to-date" 
      agent will cause all subsequent agents to become "out-of-date", as they 
      depend on the updated output.

      - analyze: ${currentState.analyze}
      - prisma: ${currentState.prisma}
      - interface: ${currentState.interface}
      - test: ${currentState.test}
      - realize: ${currentState.realize}
    `,
  );
}

function getCurrentState(state: AutoBeState): ICurrentState {
  const value = (
    obj: {
      step: number;
    } | null,
  ) => {
    if (state.analyze === null || obj === null) return "none";
    else if (state.analyze.step === obj.step) return "up-to-date";
    else return "out-of-date";
  };
  return {
    analyze: state.analyze === null ? "none" : "up-to-date",
    prisma: value(state.prisma),
    interface: value(state.interface),
    test: value(state.test),
    realize: value(state.realize),
  };
}

interface ICurrentState {
  analyze: "up-to-date" | "none";
  prisma: "up-to-date" | "out-of-date" | "none";
  interface: "up-to-date" | "out-of-date" | "none";
  test: "up-to-date" | "out-of-date" | "none";
  realize: "up-to-date" | "out-of-date" | "none";
}

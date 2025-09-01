import { AutoBeState } from "@autobe/agent/src/context/AutoBeState";
import { predicateStateMessage } from "@autobe/agent/src/utils/predicateStateMessage";
import { TestValidator } from "@nestia/e2e";
import typia from "typia";

type Step = "analyze" | "prisma" | "interface" | "test" | "realize";

export const test_predicate_state_message = (): void => {
  typia.misc.literals<Step>().forEach((y) => {
    const state: AutoBeState = {
      analyze: null,
      prisma: null,
      interface: null,
      test: null,
      realize: null,
    };
    const message: string | null = predicateStateMessage(state, y);
    const expected: boolean = y === "analyze";
    const actual: boolean = message === null;
    TestValidator.equals(`null -> ${y}`, expected, actual);
  });

  typia.misc.literals<Step>().forEach((x, i, array) => {
    typia.misc.literals<Step>().forEach((y, j) => {
      const state: AutoBeState = {
        analyze: null,
        prisma: null,
        interface: null,
        test: null,
        realize: null,
      };
      for (const key of array.slice(0, i + 1)) state[key] = { step: 0 } as any;
      const message: string | null = predicateStateMessage(state, y);
      const expected: boolean = i >= j - 1;
      const actual: boolean = message === null;
      TestValidator.equals(`${x} -> ${y}`, expected, actual);
    });
  });
};

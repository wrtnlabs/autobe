import { AutoBeState } from "@autobe/agent/src/context/AutoBeState";
import { predicateStateMessage } from "@autobe/agent/src/utils/predicateStateMessage";
import { AutoBePhase } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia from "typia";

export const test_predicate_state_message = (): void => {
  typia.misc.literals<AutoBePhase>().forEach((y) => {
    const state: AutoBeState = {
      analyze: null,
      database: null,
      interface: null,
      test: null,
      realize: null,
      previousAnalyze: null,
      previousDatabase: null,
      previousInterface: null,
      previousTest: null,
      previousRealize: null,
    };
    const message: string | null = predicateStateMessage(state, y);
    const expected: boolean = y === "analyze";
    const actual: boolean = message === null;
    TestValidator.equals(`null -> ${y}`, expected, actual);
  });

  typia.misc.literals<AutoBePhase>().forEach((x, i, array) => {
    typia.misc.literals<AutoBePhase>().forEach((y, j) => {
      const state: AutoBeState = {
        analyze: null,
        database: null,
        interface: null,
        test: null,
        realize: null,
        previousAnalyze: null,
        previousDatabase: null,
        previousInterface: null,
        previousTest: null,
        previousRealize: null,
      };
      for (const key of array.slice(0, i + 1)) state[key] = { step: 0 } as any;
      const message: string | null = predicateStateMessage(state, y);
      const expected: boolean = i >= j - 1;
      const actual: boolean = message === null;
      TestValidator.equals(`${x} -> ${y}`, expected, actual);
    });
  });
};

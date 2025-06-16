import { AutoBeTest } from "../test";
import { AutoBeEventBase } from "./AutoBeEventBase";

export interface AutoBeTestScenarioEvent
  extends AutoBeEventBase<"testScenario"> {
  scenarios: AutoBeTest.IScenario[];
  completed: number;
  total: number;
  step: number;
}

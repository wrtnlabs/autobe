import { AgenticaExecuteHistory } from "@agentica/core";

export const throwExecuteFailure = (history: AgenticaExecuteHistory): never => {
  if (history.success === true)
    throw new Error("Cannot throw execute success history");
  else if (history.value instanceof Error) throw history.value;
  else if (typeof history.value === "object" && history.value !== null) {
    const error: Error = new Error();
    Object.assign(error, history.value);
    throw error;
  }
  throw history.value;
};

import { AutoBeHistory } from "@autobe/interface";

import { AutoBeState } from "../context/AutoBeState";

export const createAutoBeState = (histories: AutoBeHistory[]): AutoBeState => {
  const reversed = histories.slice().reverse();
  return {
    analyze: reversed.find((h) => h.type === "analyze") ?? null,
    prisma: reversed.find((h) => h.type === "prisma") ?? null,
    interface: reversed.find((h) => h.type === "interface") ?? null,
    test: reversed.find((h) => h.type === "test") ?? null,
    realize: reversed.find((h) => h.type === "realize") ?? null,
  };
};

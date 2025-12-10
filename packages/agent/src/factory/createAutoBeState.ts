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
    previousAnalyze: reversed.filter((h) => h.type === "analyze")[1] ?? null,
    previousPrisma: reversed.filter((h) => h.type === "prisma")[1] ?? null,
    previousInterface:
      reversed.filter((h) => h.type === "interface")[1] ?? null,
    previousTest: reversed.filter((h) => h.type === "test")[1] ?? null,
    previousRealize: reversed.filter((h) => h.type === "realize")[1] ?? null,
  };
};

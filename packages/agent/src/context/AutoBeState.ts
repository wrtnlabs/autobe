import {
  AutoBeAnalyzeHistory,
  AutoBeInterfaceHistory,
  AutoBePrismaHistory,
  AutoBeRealizeHistory,
  AutoBeTestHistory,
} from "@autobe/interface";

export interface AutoBeState {
  analyze: AutoBeAnalyzeHistory | null;
  prisma: AutoBePrismaHistory | null;
  interface: AutoBeInterfaceHistory | null;
  test: AutoBeTestHistory | null;
  realize: AutoBeRealizeHistory | null;
}

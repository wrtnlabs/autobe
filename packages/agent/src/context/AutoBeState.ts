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
  previousAnalyze: AutoBeAnalyzeHistory | null;
  previousPrisma: AutoBePrismaHistory | null;
  previousInterface: AutoBeInterfaceHistory | null;
  previousTest: AutoBeTestHistory | null;
  previousRealize: AutoBeRealizeHistory | null;
}

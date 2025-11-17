import {
  AutoBeAnalyzeHistory,
  AutoBeDescribeHistory,
  AutoBeInterfaceHistory,
  AutoBePrismaHistory,
  AutoBeRealizeHistory,
  AutoBeTestHistory,
} from "@autobe/interface";

export interface AutoBeState {
  describe: AutoBeDescribeHistory | null;
  analyze: AutoBeAnalyzeHistory | null;
  prisma: AutoBePrismaHistory | null;
  interface: AutoBeInterfaceHistory | null;
  test: AutoBeTestHistory | null;
  realize: AutoBeRealizeHistory | null;
}

import {
  AutoBeHistory,
  AutoBeUserMessageContent,
  IAutoBeGetFilesOptions,
  IAutoBeRpcListener,
  IAutoBeRpcService,
  IAutoBeTokenUsageJson,
} from "@autobe/interface";

import analyzeSnapshots from "./mock/analyze.snapshots.json";
import histories from "./mock/histories.json";
import interfaceSnapshots from "./mock/interface.snapshots.json";
import prismaSnapshots from "./mock/prisma.snapshots.json";
import testSnapshots from "./mock/test.snapshots.json";

export class AutoBeRpcMockService implements IAutoBeRpcService {
  private readonly listener_: IAutoBeRpcListener;
  private readonly state_:
    | null
    | "analyze"
    | "prisma"
    | "interface"
    | "test"
    | "realize" = null;

  public constructor(listener: IAutoBeRpcListener) {
    this.listener_ = listener;
    this.state_ = null;
  }

  public async conversate(
    content: string | AutoBeUserMessageContent | AutoBeUserMessageContent[],
  ): Promise<AutoBeHistory[]> {
    if (this.state_ === null) {
    } else if (this.state_ === "analyze") {
    } else if (this.state_ === "prisma") {
    } else if (this.state_ === "interface") {
    } else if (this.state_ === "test") {
    } else if (this.state_ === "realize") {
    }
  }

  public async getFiles(
    options?: Partial<IAutoBeGetFilesOptions>,
  ): Promise<Record<string, string>> {
    return {};
  }

  public async getHistories(): Promise<AutoBeHistory[]> {}

  public async getTokenUsage(): Promise<IAutoBeTokenUsageJson> {}
}

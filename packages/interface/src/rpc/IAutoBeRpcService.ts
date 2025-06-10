import { AutoBeHistory } from "../histories/AutoBeHistory";
import { AutoBeUserMessageContent } from "../histories/contents/AutoBeUserMessageContent";
import { IAutoBeTokenUsageJson } from "../json/IAutoBeTokenUsageJson";

export interface IAutoBeRpcService {
  conversate(
    content: string | AutoBeUserMessageContent | AutoBeUserMessageContent[],
  ): Promise<AutoBeHistory[]>;

  getFiles(): Promise<Record<string, string>>;
  getHistories(): Promise<AutoBeHistory[]>;
  getTokenUsage(): Promise<IAutoBeTokenUsageJson>;
}

import { IActionToConfig } from "./action-to-config.dto";
import { IRequestConversateChatSession } from "./conversate-chat-session.dto";
import {
  IRequestCreateChatSession,
  IResponseCreateChatSession,
} from "./create-chat-session.dto";
import { IRequestGetConfig, IResponseGetConfig } from "./get-config.dto";
import {
  IRequestGetSessionDetail,
  IResponseGetSessionDetail,
} from "./get-session-detail.dto";
import {
  IRequestGetSessionList,
  IResponseGetSessionList,
} from "./get-session-list.dto";
import { IOnEventAutoBe } from "./on-event-auto-be.dto";
import { IOnEventUpdateTokenUsage } from "./on-event-update-token-usage.dto";
import { IOnHistoryAutoBe } from "./on-history-auto-be.dto";
import { IRequestRemoveSession } from "./remove-session.dto";
import { IRequestSaveFiles, IResponseSaveFiles } from "./save-files.dto";
import { IRequestSetConfig } from "./set-config.dto";

export type IAutoBeWebviewMessage =
  | IRequestGetConfig
  | IResponseGetConfig
  | IRequestSetConfig
  | IRequestCreateChatSession
  | IResponseCreateChatSession
  | IOnHistoryAutoBe
  | IOnEventAutoBe
  | IOnEventUpdateTokenUsage
  | IRequestConversateChatSession
  | IActionToConfig
  | IRequestSaveFiles
  | IResponseSaveFiles
  | IRequestRemoveSession
  | IRequestGetSessionList
  | IResponseGetSessionList
  | IRequestGetSessionDetail
  | IResponseGetSessionDetail;

export * from "./get-config.dto";
export * from "./set-config.dto";
export * from "./create-chat-session.dto";
export * from "./on-history-auto-be.dto";
export * from "./on-event-auto-be.dto";
export * from "./on-event-update-token-usage.dto";
export * from "./conversate-chat-session.dto";
export * from "./action-to-config.dto";
export * from "./save-files.dto";
export * from "./remove-session.dto";
export * from "./get-session-list.dto";
export * from "./get-session-detail.dto";

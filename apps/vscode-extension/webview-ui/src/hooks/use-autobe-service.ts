import {
  AutoBeHistory,
  IAutoBeGetFilesOptions,
  IAutoBeRpcService,
  IAutoBeTokenUsageJson,
} from "@autobe/interface";
import { IAutoBeWebviewMessage } from "@autobe/vscode-extension/interface";
import { useState } from "react";

import useVsCode from "./use-vscode";

export const useAutoBeService = () => {
  const vscode = useVsCode();
  const [sessionId, setSessionId] = useState<string | null>(null);

  const service = {
    conversate: async (contents) => {
      const nonce = globalThis.crypto.randomUUID();

      if (sessionId === null) {
        const history = new Promise<AutoBeHistory[]>((resolve) => {
          const conversateFn = (message: IAutoBeWebviewMessage) => {
            if (
              message.type !== "res_create_chat_session" ||
              message.data.nonce !== nonce
            ) {
              return;
            }
            vscode.offMessage(conversateFn);
            setSessionId(message.data.sessionId);
            resolve(message.data.history);
          };
          vscode.onMessage(conversateFn);
          vscode.postMessage({
            type: "req_create_chat_session",
            data: {
              message: contents,
              nonce,
            },
          });
        });
        return await history;
      }
      const history = new Promise<AutoBeHistory[]>((resolve) => {
        const conversateFn = (message: IAutoBeWebviewMessage) => {
          if (
            message.type !== "res_conversate_chat_session" ||
            message.data.nonce !== nonce
          ) {
            return;
          }
          vscode.offMessage(conversateFn);
          resolve(message.data.history);
        };
        vscode.onMessage(conversateFn);
        vscode.postMessage({
          type: "req_conversate_chat_session",
          data: {
            sessionId: sessionId,
            message: contents,
            nonce,
          },
        });
      });
      return await history;
    },
    getFiles: async (options?: Partial<IAutoBeGetFilesOptions>) => {
      if (sessionId === null) {
        throw new Error("Session ID is not set");
      }
      const nonce = globalThis.crypto.randomUUID();
      const files = new Promise<Record<string, string>>((resolve) => {
        const getFilesFn = (message: IAutoBeWebviewMessage) => {
          if (
            message.type !== "res_get_files" ||
            message.data.nonce !== nonce
          ) {
            return;
          }
          vscode.offMessage(getFilesFn);
          resolve(message.data.files);
        };
        vscode.onMessage(getFilesFn);
        vscode.postMessage({
          type: "req_get_files",
          data: {
            sessionId: sessionId,
            options,
            nonce,
          },
        });
      });
      return await files;
    },
    getHistories: async () => {
      if (sessionId === null) {
        throw new Error("Session ID is not set");
      }
      const nonce = globalThis.crypto.randomUUID();
      const histories = new Promise<AutoBeHistory[]>((resolve) => {
        const getHistoriesFn = (message: IAutoBeWebviewMessage) => {
          if (
            message.type !== "res_get_session_detail" ||
            message.data.nonce !== nonce
          ) {
            return;
          }
          vscode.offMessage(getHistoriesFn);
          resolve(message.data.history);
        };
        vscode.onMessage(getHistoriesFn);
        vscode.postMessage({
          type: "req_get_session_detail",
          data: {
            sessionId: sessionId!,
            nonce,
          },
        });
      });
      return await histories;
    },
    getTokenUsage: async () => {
      if (sessionId === null) {
        throw new Error("Session ID is not set");
      }
      const nonce = globalThis.crypto.randomUUID();
      const tokenUsage = new Promise<IAutoBeTokenUsageJson>((resolve) => {
        const getTokenUsageFn = (message: IAutoBeWebviewMessage) => {
          if (
            message.type !== "res_get_session_detail" ||
            message.data.nonce !== nonce
          ) {
            return;
          }
          vscode.offMessage(getTokenUsageFn);
          resolve(message.data.tokenUsage);
        };
        vscode.onMessage(getTokenUsageFn);
        vscode.postMessage({
          type: "req_get_session_detail",
          data: {
            sessionId: sessionId!,
            nonce,
          },
        });
      });
      return await tokenUsage;
    },
  } satisfies IAutoBeRpcService;

  return service;
};

import { IAutoBePlaygroundHeader, IAutoBeRpcListener } from "@autobe/interface";
import {
  AutoBeAgentProvider,
  AutoBeAgentSessionStorageStrategy,
  AutoBeChatMain,
  AutoBeListener,
  IAutoBeConfig,
} from "@autobe/ui";
import { useEffect, useState } from "react";
import { useServiceFactory } from "src/hooks/use-service-factory";

import useVsCode from "../hooks/use-vscode";

const Chat = () => {
  const [, setError] = useState<Error | null>(null);
  const serviceFactory = useServiceFactory();

  return (
    <div className="flex flex-col h-full">
      {/* 채팅 영역 */}
      <div className="flex-1 overflow-hidden h-full mx-1">
        <AutoBeAgentProvider
          storageStrategy={new AutoBeAgentSessionStorageStrategy()}
          serviceFactory={serviceFactory}
        >
          <AutoBeChatMain
            isMobile={true}
            setError={setError}
            className="h-full"
          />
        </AutoBeAgentProvider>
      </div>
    </div>
  );
};

export default Chat;

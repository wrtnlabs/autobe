import {
  AutoBeAgentProvider,
  AutoBeAgentSessionStorageStrategy,
  AutoBeChatMain,
} from "@autobe/ui";
import { useState } from "react";

import { useServiceFactory } from "../hooks/use-service-factory";

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

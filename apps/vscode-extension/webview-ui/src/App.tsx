import { useState } from "react";

import useVsCode from "./hooks/use-vscode";
import Chat from "./pages/Chat";
import Config from "./pages/Config";

const App = () => {
  const [page, setPage] = useState<"chat" | "config">("chat");
  const vscode = useVsCode();

  vscode.onMessage((message) => {
    if (message.type !== "action_to_config") {
      return;
    }
    setPage("config");
  });

  switch (page) {
    case "chat":
      return <Chat />;
    case "config":
      return <Config onDone={() => setPage("chat")} />;
  }
};

export default App;

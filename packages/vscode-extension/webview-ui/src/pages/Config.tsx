import { useState } from "react";

import useVsCode from "../hooks/use-vscode";

interface IConfigProps {
  onDone: () => void;
}

const Config = (props: IConfigProps) => {
  const { onDone } = props;
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [concurrencyRequest, setConcurrencyRequest] = useState(16);

  const vscode = useVsCode();

  vscode.onMessage(async (message) => {
    if (message.type !== "res_get_api_key") {
      return;
    }
    const { apiKey, model, baseUrl, concurrencyRequest } = message.data;

    setApiKey(apiKey);
    setModel(model);
    setBaseUrl(baseUrl);
    setConcurrencyRequest(concurrencyRequest);
  });

  return (
    <div className="flex items-center h-full w-full flex-col justify-center gap-4">
      <div className="flex flex-col gap-2">
        <label>API Key</label>
        <input
          type="password"
          placeholder="API Key is required!"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label>Model</label>
        <input
          type="text"
          placeholder="Model is optional!"
          value={model}
          onChange={(e) => setModel(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label>Base URL</label>
        <input
          type="text"
          placeholder="Base URL is optional"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label>Concurrency Request</label>
        <input
          type="number"
          placeholder="Optional"
          value={concurrencyRequest}
          onChange={(e) => setConcurrencyRequest(Number(e.target.value))}
        />
      </div>
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded-md"
        onClick={() => {
          vscode.postMessage({
            type: "req_set_config",
            data: { apiKey, model, baseUrl, concurrencyRequest },
          });
          onDone();
        }}
      >
        Done
      </button>
    </div>
  );
};

export default Config;

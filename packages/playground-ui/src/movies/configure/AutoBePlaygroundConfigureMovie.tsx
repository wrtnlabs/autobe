import {
  IAutoBeRpcHeader,
  IAutoBeRpcListener,
  IAutoBeRpcService,
  IAutoBeRpcVendor,
} from "@autobe/interface";
import {
  Button,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";
import { ILlmSchema } from "@samchon/openapi";
import { useEffect, useState } from "react";
import { WebSocketConnector } from "tgrid";

import { AutoBePlaygroundListener } from "../../structures/AutoBePlaygroundListener";
import { AutoBePlaygroundConfigureValidator } from "../../utils/AutoBePlaygroundConfigureValidator";
import { AutoBePlaygroundChatMovie } from "../chat/AutoBePlaygroundChatMovie";
import { AutoBePlaygroundConfigureVendorMovie } from "./AutoBePlaygroundConfigureVendorMovie";

export function AutoBePlaygroundConfigureMovie(
  props: AutoBePlaygroundConfigureMovie.IProps,
) {
  const [serverURL, setServerURL] = useState<string>("http://localhost:5890");
  const [locale, setLocale] = useState(window.navigator.language);
  const [model, setModel] =
    useState<Exclude<ILlmSchema.Model, "gemini" | "3.0">>("chatgpt");
  const [supportAudio, setSupportAudio] = useState<boolean>(false);
  const [vendorConfig, setVendorConfig] = useState<IAutoBeRpcVendor>({
    model: "gpt-4.1",
    apiKey: "",
    semaphore: 16,
  });

  const [progress, setProgress] = useState(false);
  const isReady = () =>
    AutoBePlaygroundConfigureValidator.isValidURL(serverURL) &&
    locale.length > 0 &&
    vendorConfig.apiKey.length > 0 &&
    AutoBePlaygroundConfigureValidator.isValidURL(
      vendorConfig.baseURL || "http://localhost:8000",
    );
  const start = async () => {
    if (progress === true || isReady() === false) return;
    setProgress(true);
    try {
      const header: IAutoBeRpcHeader<ILlmSchema.Model> = {
        model,
        vendor: vendorConfig,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        locale,
      };
      const listener: AutoBePlaygroundListener = new AutoBePlaygroundListener();
      const connector: WebSocketConnector<
        IAutoBeRpcHeader<ILlmSchema.Model>,
        IAutoBeRpcListener,
        IAutoBeRpcService
      > = new WebSocketConnector(header, listener.getListener());
      await connector.connect(serverURL);
      props.onNext({
        header,
        listener,
        service: connector.getDriver(),
        supportAudio,
      });
    } catch (error) {
      alert((error as Error)?.message);
      setProgress(false);
    }
  };

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.code === "Enter" || event.code === "NumpadEnter")
        start().catch(() => {});
    };
    document.addEventListener("keyup", listener);
    return () => {
      document.removeEventListener("keyup", listener);
    };
  }, [start]);

  return (
    <FormControl
      style={{
        width: "calc(100% - 60px)",
        padding: 15,
        margin: 15,
      }}
    >
      <Typography variant="h4">AutoBE Playground</Typography>
      <Divider />
      <br />
      <Typography variant="h5">Connection</Typography>
      <Divider />
      <br />
      <TextField
        label="Server URL"
        size="small"
        defaultValue={serverURL}
        onChange={(e) => setServerURL(e.target.value)}
        fullWidth
        error={
          AutoBePlaygroundConfigureValidator.isValidURL(serverURL) === false
        }
      />
      <br />
      <TextField
        label="Locale"
        size="small"
        defaultValue={locale}
        onChange={(e) => setLocale(e.target.value)}
        fullWidth
        error={locale.length === 0}
      />
      <br />
      <FormLabel>Schema Model (Gemini not supported)</FormLabel>
      <RadioGroup
        value={model}
        onChange={(_, value) => setModel(value as "chatgpt")}
        style={{ paddingLeft: 15 }}
      >
        {SCHEMA_MODELS.map((model) => (
          <FormControlLabel
            control={<Radio size="small" />}
            label={model.label}
            value={model.value}
          />
        ))}
      </RadioGroup>
      <FormLabel>Support Audio</FormLabel>
      <RadioGroup
        value={supportAudio ? "true" : "false"}
        onChange={(_, value) => setSupportAudio(value === "true")}
        style={{ paddingLeft: 15 }}
      >
        <FormControlLabel
          control={<Radio size="small" />}
          label="Support Audio Prompt"
          value="true"
        />
        <FormControlLabel
          control={<Radio size="small" />}
          label="No Audio Prompt"
          value="false"
        />
      </RadioGroup>
      <br />
      <AutoBePlaygroundConfigureVendorMovie
        config={vendorConfig}
        onChange={setVendorConfig}
      />
      <br />
      <Button
        fullWidth
        variant="contained"
        color="info"
        size="large"
        disabled={progress === true || isReady() === false}
        onClick={() => void start().catch(() => {})}
      >
        {progress === false
          ? "Start AI Vibe Coding"
          : "Connecting to WebSocket Server"}
      </Button>
    </FormControl>
  );
}
export namespace AutoBePlaygroundConfigureMovie {
  export interface IProps {
    onNext: (props: AutoBePlaygroundChatMovie.IProps) => void;
  }
}

const SCHEMA_MODELS = [
  { label: "OpenAI ChatGPT", value: "chatgpt" },
  {
    label: "Anthropic Claude / Meta Llama / HF DeepSeek, ...",
    value: "claude",
  },
];

import { IAutoBeRpcVendor } from "@autobe/interface";
import { Divider, TextField, Typography } from "@mui/material";
import { useState } from "react";

import { AutoBePlaygroundConfigureValidator } from "../../utils/AutoBePlaygroundConfigureValidator";

export function AutoBePlaygroundConfigureVendorMovie(
  props: AutoBePlaygroundConfigureVendorMovie.IProps,
) {
  const [apiKey, setApiKey] = useState<string>(props.config.apiKey);
  const [model, setModel] = useState<string>(props.config.model);
  const [baseURL, setBaseURL] = useState<string>(props.config.baseURL ?? "");

  const handleApiKey = (value: string) => {
    setApiKey(value);
    props.onChange({
      model,
      baseURL,
      apiKey: value,
    });
  };
  const handleModel = (value: string) => {
    setModel(value);
    props.onChange({
      baseURL,
      apiKey,
      model: value,
    });
  };
  const handleBaseURL = (value: string) => {
    setBaseURL(value);
    props.onChange({
      model,
      apiKey,
      baseURL: value.length !== 0 ? value : undefined,
    });
  };

  return (
    <>
      <Typography variant="h5">AI Vendor</Typography>
      <Divider />
      <br />
      <TextField
        label="AI Model"
        defaultValue={model}
        onChange={(e) => handleModel(e.target.value)}
        fullWidth
        error={model.length === 0}
      />
      <br />
      <TextField
        label="Your OpenAI (or other vendor) API Key"
        defaultValue={apiKey}
        onChange={(e) => handleApiKey(e.target.value)}
        fullWidth
        error={apiKey.length === 0}
      />
      <br />
      <TextField
        label="Base URL (empty: OpenAI)"
        defaultValue={baseURL}
        onChange={(e) => handleBaseURL(e.target.value)}
        fullWidth
        error={
          AutoBePlaygroundConfigureValidator.isValidURL(
            baseURL || "http://localhost:8000",
          ) === false
        }
      />
    </>
  );
}
export namespace AutoBePlaygroundConfigureVendorMovie {
  export interface IProps {
    config: IAutoBeRpcVendor;
    onChange: (config: IAutoBeRpcVendor) => void;
  }
}

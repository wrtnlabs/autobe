import {
  IAutoBePlaygroundHeader,
  IAutoBePlaygroundVendor,
  IAutoBeRpcService,
} from "@autobe/interface";
import pApi from "@autobe/playground-api";
import {
  AutoBeAgentProvider,
  AutoBeChatMain,
  AutoBeListener,
  IAutoBeUploadConfig,
  createAutoBeConfigFields,
} from "@autobe/ui";
import { IAutoBeConfig } from "@autobe/ui";
import { useMediaQuery } from "@autobe/ui/hooks";
import { AppBar, Toolbar, Typography } from "@mui/material";
import { ILlmSchema } from "@samchon/openapi";
import { useState } from "react";

export function AutoBePlaygroundChatMovie(
  props: AutoBePlaygroundChatMovie.IProps,
) {
  //----
  // VARIABLES
  //----
  // STATES
  const [, setError] = useState<Error | null>(null);
  const [service, setService] = useState<IAutoBeRpcService | null>(null);
  const [uploadConfig, setUploadConfig] = useState<IAutoBeUploadConfig | null>(
    null,
  );

  // Configuration fields for AutoBE Playground (adds serverUrl to defaults)
  const configFields = createAutoBeConfigFields(["serverUrl"]);

  // Service factory function
  const serviceFactory = async (config: IAutoBeConfig) => {
    const vendorConfig: IAutoBePlaygroundVendor = {
      model: config.aiModel || "gpt-4.1",
      apiKey: config.openApiKey || "",
      baseURL: config.baseUrl || undefined,
      semaphore: config.semaphore || 16,
    };

    const headers: IAutoBePlaygroundHeader<ILlmSchema.Model> = {
      model: (config.schemaModel || "chatgpt") as Exclude<
        ILlmSchema.Model,
        "gemini" | "3.0"
      >,
      vendor: vendorConfig,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: config.locale || window.navigator.language,
    };

    const autoBeListener: AutoBeListener = new AutoBeListener();
    const { driver: rpcService } =
      await pApi.functional.autobe.playground.start(
        {
          host: config.serverUrl,
          headers: headers as unknown as Record<string, string>,
        },
        autoBeListener.getListener(),
      );

    return {
      service: rpcService,
      listener: autoBeListener,
      header: headers,
      uploadConfig: {
        supportAudio: config.supportAudioEnable || false,
      },
    };
  };

  // Handle service creation
  const handleServiceReady = (serviceData: unknown) => {
    // Type guard to ensure serviceData has expected properties
    if (
      serviceData &&
      typeof serviceData === "object" &&
      "service" in serviceData &&
      "uploadConfig" in serviceData
    ) {
      setService((serviceData as { service: IAutoBeRpcService }).service);
      setUploadConfig(
        (serviceData as { uploadConfig: IAutoBeUploadConfig }).uploadConfig,
      );
    }
  };

  //----
  // RENDERERS
  //----

  const isMinWidthLg = useMediaQuery(useMediaQuery.MIN_WIDTH_LG);
  const isMobile = !isMinWidthLg;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      <AppBar position="relative" component="div">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {props.title ?? "AutoBE Playground"}
          </Typography>
        </Toolbar>
      </AppBar>
      <div
        style={{
          width: "100%",
          flexGrow: 1,
          display: "flex",
          flexDirection: "row",
          overflow: "hidden",
        }}
      >
        <AutoBeAgentProvider serviceFactory={serviceFactory}>
          <AutoBeChatMain
            isMobile={isMobile}
            conversate={async (contents) => {
              // Service will be available through context
              if (service) {
                await service.conversate(contents);
              }
            }}
            setError={setError}
            uploadConfig={uploadConfig || undefined}
            configFields={configFields}
            onServiceReady={handleServiceReady}
            style={{
              backgroundColor: "lightblue",
            }}
          />
        </AutoBeAgentProvider>
      </div>
    </div>
  );
}
export namespace AutoBePlaygroundChatMovie {
  export interface IProps {
    title?: string;
  }
}

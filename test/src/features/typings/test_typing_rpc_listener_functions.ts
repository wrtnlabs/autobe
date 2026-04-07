import { AutoBeEvent, IAutoBeRpcListener } from "@autobe/interface";

export const test_typing_rpc_listener_functions = () => {
  // biome-ignore lint: intended
  let x: Exclude<keyof IAutoBeRpcListener, "enable"> = "analyzeComplete" as any;

  // biome-ignore-start lint: intended
  let y: Exclude<
    AutoBeEvent.Type,
    | "vendorRequest"
    | "vendorResponse"
    | "vendorTimeout"
    | "jsonValidateError"
    | "jsonParseError"
    | "consentFunctionCall"
    | "preliminaryAcquire"
    | "preliminaryRewrite"
  > = "interfaceSchema" as any;
  // biome-ignore-end lint: intended

  x = y;
  y = x;
};

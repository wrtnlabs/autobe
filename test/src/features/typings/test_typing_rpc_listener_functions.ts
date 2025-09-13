import { AutoBeEvent, IAutoBeRpcListener } from "@autobe/interface";

export const test_typing_rpc_listener_functions = () => {
  let x: keyof IAutoBeRpcListener = "analyzeComplete" as any;
  let y: Exclude<
    AutoBeEvent.Type,
    | "vendorRequest"
    | "vendorResponse"
    | "vendorTimeout"
    | "jsonValidateError"
    | "jsonParseError"
    | "consentFunctionCall"
  > = "interfaceSchemas" as any;
  x = y;
  y = x;
};

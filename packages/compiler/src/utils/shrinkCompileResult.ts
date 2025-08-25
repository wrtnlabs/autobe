import { IAutoBeTypeScriptCompileResult } from "@autobe/interface";
import { IEmbedTypeScriptResult } from "embed-typescript";

export const shrinkCompileResult = (
  result: IEmbedTypeScriptResult,
): IAutoBeTypeScriptCompileResult => {
  if (result.type === "exception") return result;
  else if (result.type === "success")
    return {
      type: "success",
    };
  return {
    type: "failure",
    diagnostics: result.diagnostics,
  };
};

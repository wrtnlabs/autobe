import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";

export const transformInterfaceEndpointAuthorizationSection = (
  operations: AutoBeOpenApi.IOperation[],
): string => {
  if (operations.length === 0) return "";

  const table: string = [
    "| Actor | Endpoint | Authorization Type | Request Body | Response Body |",
    "|-------|----------|--------------------|--------------|---------------|",
    ...operations
      .filter(
        (op) =>
          op.authorizationActor !== null &&
          op.requestBody !== null &&
          op.responseBody !== null,
      )
      .map((op) =>
        [
          op.authorizationActor ?? "",
          `${op.method.toUpperCase()} ${op.path}`,
          op.authorizationType ?? "",
          op.requestBody?.typeName ?? "",
          op.responseBody?.typeName ?? "",
        ].join(" | "),
      ),
  ].join("\n");

  return StringUtil.trim`
    ## Already Generated Authorization Operations (DO NOT DUPLICATE)

    The following authorization operations have already been generated 
    by the Authorization Agent.
    
    Do NOT create any endpoints that duplicate these operations. All 
    authentication-related operations are handled exclusively by 
    the Authorization Agent. This is not your responsibility.

    ${table}
  `;
};

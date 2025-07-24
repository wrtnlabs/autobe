import { AutoBeRealizeDecoratorEvent } from "../../events";
import { AutoBeOpenApi } from "../../openapi";

/** @author Kakasoo */
export interface AutoBeRealizeFunction {
  /** Role */
  role: AutoBeRealizeDecoratorEvent["role"] | null;

  /** Endpoint */
  endpoint: AutoBeOpenApi.IEndpoint;

  /**
   * Src/providers/${name}.ts
   *
   * Example: "src/providers/delete__discussionBoard_administrators_$id.ts"
   */
  location: string;

  /** Example: "delete__discussionBoard_administrators_$id" */
  name: string;

  /** Code */
  content: string;
}

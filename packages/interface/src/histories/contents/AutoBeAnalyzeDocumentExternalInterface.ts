import { ITraceable } from "./AutoBeAnalyzeDocumentTraceable";

/**
 * SRS Section 3: External Interface Requirements.
 *
 * Defines external system, data store, and communication protocol requirements.
 * API endpoint/DTO-level specifications are delegated to the Interface Phase
 * (excluded from Analyze).
 *
 * Optional category: can be omitted for projects without external integrations.
 *
 * @author Juntak
 */
export interface AutoBeAnalyzeDocumentExternalInterface {
  /** External system integration list */
  integrations: Array<
    {
      /** External system name */
      systemName: string;
      /** Integration description */
      description: string;
      /** Communication protocol (e.g., REST, gRPC, WebSocket) */
      protocol: string;
      /** Data exchange format (e.g., JSON, XML, Protocol Buffers) */
      dataFormat: string;
    } & ITraceable
  >;
}

import { tags } from "typia";

/**
 * SRS Section 3 — External Interface Requirements.
 *
 * Describes interfaces with external systems, databases/data stores, and
 * communication protocols. This section corresponds to the "External
 * Interface Requirements" clause of ISO/IEC/IEEE 29148:2018.
 *
 * API endpoint/DTO specifications are explicitly excluded from this
 * section; those belong to the Interface Phase.
 *
 * @author juntak
 */
export interface AutoBeAnalyzeDocumentExternalInterface {
  /**
   * Interfaces with external software systems.
   */
  systemInterfaces: AutoBeAnalyzeDocumentExternalInterface.SystemInterface[];

  /**
   * Database and data store interface requirements.
   */
  dataInterfaces: AutoBeAnalyzeDocumentExternalInterface.DataInterface[];

  /**
   * Communication protocol requirements (e.g., REST, gRPC, AMQP).
   */
  communicationInterfaces:
    AutoBeAnalyzeDocumentExternalInterface.CommunicationInterface[];

  /**
   * Traceability link back to the evidence layer.
   *
   * MUST contain at least one sectionId. Validated as FAIL
   * (`EMPTY_SOURCE_SECTION_IDS`) if empty.
   */
  sourceSectionIds: string[] & tags.MinItems<1>;
}
export namespace AutoBeAnalyzeDocumentExternalInterface {
  /**
   * Interface with an external software system.
   */
  export interface SystemInterface {
    /**
     * Stable identifier.
     *
     * @example "SI-001"
     */
    interfaceId: string & tags.MinLength<1>;

    /**
     * Name of the external system.
     */
    name: string;

    /**
     * Description of the interface and data exchanged.
     */
    description: string;

    /**
     * Type of external system.
     */
    type:
      | "externalAPI"
      | "authProvider"
      | "paymentGateway"
      | "messageBroker"
      | "storageService"
      | "other";

    /**
     * Traceability link back to the evidence layer.
     *
     * MUST contain at least one sectionId.
     */
    sourceSectionIds: string[] & tags.MinItems<1>;
  }

  /**
   * Database / data store interface requirement.
   */
  export interface DataInterface {
    /**
     * Stable identifier.
     *
     * @example "DI-001"
     */
    interfaceId: string & tags.MinLength<1>;

    /**
     * Name of the data store.
     *
     * @example "PostgreSQL", "Redis", "S3"
     */
    name: string;

    /**
     * Description of how the system uses this data store.
     */
    description: string;

    /**
     * Type of data store.
     */
    type:
      | "relationalDB"
      | "documentDB"
      | "cache"
      | "objectStorage"
      | "fileSystem"
      | "other";

    /**
     * Traceability link back to the evidence layer.
     *
     * MUST contain at least one sectionId.
     */
    sourceSectionIds: string[] & tags.MinItems<1>;
  }

  /**
   * Communication protocol interface requirement.
   */
  export interface CommunicationInterface {
    /**
     * Stable identifier.
     *
     * @example "CI-001"
     */
    interfaceId: string & tags.MinLength<1>;

    /**
     * Protocol name.
     *
     * @example "REST/HTTP", "gRPC", "WebSocket", "AMQP"
     */
    protocol: string;

    /**
     * Description of the communication pattern and purpose.
     */
    description: string;

    /**
     * Data format used over this protocol.
     *
     * @example "JSON", "Protobuf", "XML"
     */
    dataFormat: string;

    /**
     * Traceability link back to the evidence layer.
     *
     * MUST contain at least one sectionId.
     */
    sourceSectionIds: string[] & tags.MinItems<1>;
  }
}

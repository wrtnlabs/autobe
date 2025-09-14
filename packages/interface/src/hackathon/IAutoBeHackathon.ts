import { tags } from "typia";

/**
 * Interface representing a hackathon event in the AutoBE system.
 *
 * This interface defines the structure and metadata for hackathon events where
 * participants can engage in collaborative vibe coding sessions using the AutoBE
 * platform. Hackathons provide a competitive or collaborative environment for
 * generating backend applications through natural language requirements and AI
 * assistance.
 *
 * The hackathon system enables organized events with defined timeframes, unique
 * identification, and structured participation tracking for managing multiple
 * concurrent development sessions and participant interactions.
 *
 * @author Samchon
 */
export interface IAutoBeHackathon extends IAutoBeHackathon.ISummary {}
export namespace IAutoBeHackathon {
  /**
   * Complete hackathon information including system-generated metadata.
   *
   * Extends the creation properties with system-generated fields that uniquely
   * identify the hackathon and track its creation timestamp. This interface
   * represents the full hackathon entity as stored and retrieved from the system.
   */
  export interface ISummary extends ICreate {
    /**
     * Unique identifier for the hackathon event.
     *
     * A UUID that uniquely identifies this hackathon instance across the entire
     * AutoBE platform, enabling precise tracking and reference of specific events.
     */
    id: string & tags.Format<"uuid">;
    
    /**
     * Timestamp when the hackathon was created in the system.
     *
     * ISO 8601 formatted date-time string indicating when this hackathon event
     * was registered in the AutoBE platform, useful for audit trails and event
     * management.
     */
    created_at: string & tags.Format<"date-time">;
  }

  /**
   * Input properties required to create a new hackathon event.
   *
   * Defines the essential information needed to register and configure a new
   * hackathon in the AutoBE system, including identification, naming, and
   * scheduling parameters.
   */
  export interface ICreate {
    /**
     * Unique code identifier for the hackathon.
     *
     * A human-readable code that serves as an alternative identifier for the
     * hackathon, often used for participant registration, URL routing, or
     * event references.
     */
    code: string;
    
    /**
     * Display name of the hackathon event.
     *
     * The human-friendly title of the hackathon that appears in user interfaces,
     * event listings, and participant communications.
     */
    name: string;
    
    /**
     * Scheduled start time for the hackathon.
     *
     * ISO 8601 formatted date-time string indicating when the hackathon event
     * officially begins and participants can start their development sessions.
     */
    opened_at: string & tags.Format<"date-time">;
    
    /**
     * Scheduled end time for the hackathon.
     *
     * ISO 8601 formatted date-time string indicating when the hackathon event
     * officially concludes and new submissions are no longer accepted.
     */
    closed_at: string & tags.Format<"date-time">;
  }
}

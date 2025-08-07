import { tags } from "typia";

import { AutoBeUserMessageContentBase } from "./AutoBeUserMessageContentBase";

/**
 * User message content for image uploads.
 * 
 * Handles image attachments in user messages, supporting both base64-encoded
 * images and URL references. Used for sharing UI mockups, diagrams,
 * screenshots, and other visual materials.
 *
 * @author Samchon
 */
export interface AutoBeUserMessageImageContent
  extends AutoBeUserMessageContentBase<"image"> {
  /**
   * Image content data.
   * 
   * Either base64-encoded image data or a URL reference.
   */
  image:
    | AutoBeUserMessageImageContent.IBase64
    | AutoBeUserMessageImageContent.IUrl;

  /**
   * Image analysis detail level.
   * 
   * - "auto": Automatic detail selection
   * - "high": Detailed analysis for complex images
   * - "low": Fast processing for simple images
   */
  detail?: "auto" | "high" | "low" | undefined;
}
export namespace AutoBeUserMessageImageContent {
  /**
   * Direct image upload with base64-encoded data.
   */
  export interface IBase64 {
    /** Discriminator for base64 type. */
    type: "base64";
    
    /** Base64-encoded image data. */
    data: string;
  }
  
  /**
   * Image reference by URL.
   */
  export interface IUrl {
    /** Discriminator for URL type. */
    type: "url";
    
    /** Image URL with format validation. */
    url: string & tags.Format<"url">;
  }
}

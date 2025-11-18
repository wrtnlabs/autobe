import { tags } from "typia";

import { AutoBeUserConversateContentBase } from "./AutoBeUserConversateContentBase";

/**
 * Content type representing image input from users in the conversation.
 *
 * Enables users to share visual references, UI mockups, diagrams, screenshots,
 * or other visual materials as part of their development requirements. Image
 * content supports both base64-encoded image data and URL references, providing
 * flexibility for different use cases and integration scenarios.
 */
export interface AutoBeUserImageConversateContent
  extends AutoBeUserConversateContentBase<"image"> {
  /**
   * Image content data.
   *
   * Either base64-encoded image data or a URL reference.
   */
  image:
    | AutoBeUserImageConversateContent.IBase64
    | AutoBeUserImageConversateContent.IUrl;

  /**
   * Image analysis detail level.
   *
   * - "auto": Automatic detail selection
   * - "high": Detailed analysis for complex images
   * - "low": Fast processing for simple images
   */
  detail?: "auto" | "high" | "low" | undefined;
}

export namespace AutoBeUserImageConversateContent {
  export interface IBase64 {
    /** Discriminator for base64 type. */
    type: "base64";

    /** Base64-encoded image data. */
    data: string;
  }

  /** Image reference by URL. */
  export interface IUrl {
    /** Discriminator for URL type. */
    type: "url";

    /** Image URL with format validation. */
    url: string & tags.Format<"url">;
  }
}

import { AutoBeUserConversateContentBase } from "./AutoBeUserConversateContentBase";

/**
 * Content type representing file input from users in the conversation.
 *
 * Enables users to share documents, specifications, code files, or other
 * resources as part of their development requirements. File content supports
 * both direct file data and file references, providing flexibility for
 * different use cases and integration scenarios.
 */
export interface AutoBeUserFileConversateContent
  extends AutoBeUserConversateContentBase<"file"> {
  /**
   * File content data.
   *
   * Either base64-encoded file data or a reference ID to a previously uploaded
   * file.
   */
  file:
    | AutoBeUserFileConversateContent.IBase64
    | AutoBeUserFileConversateContent.IId;
}

export namespace AutoBeUserFileConversateContent {
  /** Direct file upload with base64-encoded data. */
  export interface IBase64 {
    /** Discriminator indicating this contains direct file data. */
    type: "base64";

    /** Original filename. */
    name: string;

    /** Base64-encoded file content. */
    data: string;
  }

  /** File reference by ID. */
  export interface IId {
    /** Discriminator indicating this is a file reference. */
    type: "id";

    /** File ID for retrieving previously uploaded file. */
    id: string;
  }
}

import { AutoBeUserMessageContentBase } from "./AutoBeUserMessageContentBase";

/**
 * User message content for file uploads.
 * 
 * Handles file attachments in user messages, supporting both direct file data
 * and file references. Used when users need to share documents, specifications,
 * code files, or other resources as part of their development requirements.
 *
 * @author Samchon
 */
export interface AutoBeUserMessageFileContent
  extends AutoBeUserMessageContentBase<"file"> {
  /**
   * File content data.
   * 
   * Either base64-encoded file data or a reference ID to a previously
   * uploaded file.
   */
  file: AutoBeUserMessageFileContent.IBase64 | AutoBeUserMessageFileContent.IId;
}

export namespace AutoBeUserMessageFileContent {
  /**
   * Direct file upload with base64-encoded data.
   */
  export interface IBase64 {
    /** Discriminator indicating this contains direct file data. */
    type: "base64";

    /**
     * Original filename.
     */
    name: string;

    /**
     * Base64-encoded file content.
     */
    data: string;
  }

  /**
   * File reference by ID.
   */
  export interface IId {
    /** Discriminator indicating this is a file reference. */
    type: "id";

    /**
     * File ID for retrieving previously uploaded file.
     */
    id: string;
  }
}

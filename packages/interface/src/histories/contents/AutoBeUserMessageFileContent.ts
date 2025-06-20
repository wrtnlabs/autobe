import { AutoBeUserMessageContentBase } from "./AutoBeUserMessageContentBase";

/**
 * Content type representing file uploads from users in the conversation.
 *
 * Enables users to share documents, specifications, existing code files, design
 * documents, or any other file-based resources that provide context for their
 * development requirements. File uploads significantly enhance the vibe coding
 * experience by allowing users to provide existing documentation, reference
 * materials, or examples that inform the development process.
 *
 * The file content can be handled in two ways: as direct data for immediate
 * processing or as references to previously uploaded files for efficient
 * storage and reuse across multiple conversations and development phases.
 *
 * @author Samchon
 */
export interface AutoBeUserMessageFileContent
  extends AutoBeUserMessageContentBase<"file"> {
  /**
   * File content represented either as a direct data upload or a reference to a
   * previously stored file.
   *
   * This union allows for flexible file handling strategies depending on file
   * size, reuse patterns, and storage optimization needs. Direct data uploads
   * are suitable for immediate processing, while references enable efficient
   * handling of large files and reuse of previously uploaded materials.
   */
  file:
    | AutoBeUserMessageFileContent.IReference
    | AutoBeUserMessageFileContent.IData;
}

export namespace AutoBeUserMessageFileContent {
  /**
   * Reference to a previously uploaded file stored in the system.
   *
   * Enables efficient reuse of files that have been uploaded in previous
   * conversations or development phases. This approach reduces data
   * duplication, improves performance for large files, and allows users to
   * reference the same documentation or specifications across multiple
   * development iterations.
   */
  export interface IReference {
    /** Discriminator indicating this is a file reference. */
    type: "reference";

    /**
     * Unique identifier of the previously uploaded file.
     *
     * References a file that has been stored in the system, allowing for
     * efficient retrieval and processing without re-uploading the content. This
     * ID enables the system to locate and access the file data when needed for
     * requirements analysis or development tasks.
     */
    id: string;
  }

  /**
   * Direct file data uploaded as part of the message.
   *
   * Contains the actual file content for immediate processing and analysis.
   * This approach is suitable for new files, smaller documents, or when
   * immediate file processing is required without the overhead of file storage
   * and reference management.
   */
  export interface IData {
    /** Discriminator indicating this contains direct file data. */
    type: "data";

    /**
     * Original filename of the uploaded file.
     *
     * Preserves the user's original filename for context, file type
     * identification, and user experience consistency. The filename provides
     * important metadata about the file's purpose and format, helping the AI
     * assistant understand the content context.
     */
    name: string;

    /**
     * Base64 encoded file content.
     *
     * Contains the actual file data encoded in Base64 format for safe
     * transmission and storage. This encoding ensures that binary files,
     * documents, and other file types can be processed reliably within the
     * message system while maintaining data integrity.
     */
    data: string;
  }
}

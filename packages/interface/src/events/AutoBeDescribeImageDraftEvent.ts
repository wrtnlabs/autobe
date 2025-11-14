import { AutoBeDescribeImageDraftMetadata } from "../histories/contents/AutoBeDescribeImageDraft";
import { AutoBeAggregateEventBase } from "./base/AutoBeAggregateEventBase";
import { AutoBeEventBase } from "./base/AutoBeEventBase";
import { AutoBeProgressEventBase } from "./base/AutoBeProgressEventBase";

/**
 * Event fired when the Describe agent generates planning drafts from image
 * analysis.
 *
 * This event occurs when the Describe agent analyzes batches of UI screenshots,
 * mockups, wireframes, or design documents to generate comprehensive planning
 * drafts for backend application development. Each draft includes extracted
 * requirements, data structures, API endpoints, and metadata for clustering.
 *
 * The event provides progress tracking as multiple batches of images are
 * processed and contains the generated drafts with their associated metadata
 * for subsequent grouping and consolidation.
 */
export interface AutoBeDescribeImageDraftEvent
  extends AutoBeEventBase<"describeImageDraft">,
    AutoBeProgressEventBase,
    AutoBeAggregateEventBase {
  /**
   * A comprehensive planning document generated from analyzing a batch of
   * images.
   *
   * Contains detailed requirements, entities, API endpoints, business logic,
   * and workflow descriptions extracted from UI screenshots, mockups, or design
   * documents. This draft serves as the foundation for generating backend
   * application specifications.
   */
  draft: string;

  /**
   * Metadata for clustering and organization of image drafts.
   *
   * Used to group related drafts together based on their functional area,
   * enabling efficient organization of large sets of image-based requirements.
   */
  metadata: AutoBeDescribeImageDraftMetadata;
}

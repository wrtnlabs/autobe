import { tags } from "typia";

export interface IAutoBeInterfaceSchemaReviewApplication {
  review(input: IAutoBeInterfaceSchemaReviewApplication.IProps): void;
}

export namespace IAutoBeInterfaceSchemaReviewApplication {
  export interface IProps {
    reviews: IReview[];
  }

  export interface IReview {
    /**
     * Reread the schema you want to review as below. This action is to review
     * the schema by rereading it and find out if there are any problems.
     *
     * ```json
     * {
     *   "IDiscussionBoardCategoryTag": {
     *     "type": "object",
     *     "properties": {
     *       "id": {
     *         "type": "string",
     *         "format": "uuid",
     *         "description": "<descritpion>"
     *       },
     *       "discussion_board_category_id": {
     *         "type": "string",
     *         "format": "uuid",
     *         "description": "<descritpion>"
     *       },
     *       "discussion_board_tag_id": {
     *         "type": "string",
     *         "format": "uuid",
     *         "description": "<descritpion>"
     *       },
     *       "created_at": {
     *         "type": "string",
     *         "format": "date-time",
     *         "description": "<descritpion>"
     *       }
     *     },
     *     "required": [
     *       "id",
     *       "discussion_board_category_id",
     *       "discussion_board_tag_id",
     *       "created_at"
     *     ],
     *     "description": "<descritpion>"
     *   }
     * }
     * ```
     */
    schemaDescriptive: string;

    /**
     * Name.
     *
     * For the schema below, the name is "IDiscussionBoardCategoryTag".
     *
     * ```json
     * {
     *   "IDiscussionBoardCategoryTag": {
     *     "type": "object",
     *     "properties": {
     *       "id": {
     *         "type": "string",
     *         "format": "uuid",
     *         "description": "<descritpion>"
     *       },
     *       "discussion_board_category_id": {
     *         "type": "string",
     *         "format": "uuid",
     *         "description": "<descritpion>"
     *       },
     *       "discussion_board_tag_id": {
     *         "type": "string",
     *         "format": "uuid",
     *         "description": "<descritpion>"
     *       },
     *       "created_at": {
     *         "type": "string",
     *         "format": "date-time",
     *         "description": "<descritpion>"
     *       }
     *     },
     *     "required": [
     *       "id",
     *       "discussion_board_category_id",
     *       "discussion_board_tag_id",
     *       "created_at"
     *     ],
     *     "description": "<descritpion>"
     *   }
     * }
     * ```
     */
    name: string;

    /** Review Passed */
    passed: boolean;

    /** IF review result is failure, you must write detailed reason about it. */
    reason: (string & tags.MinLength<10>) | null;
  }
}

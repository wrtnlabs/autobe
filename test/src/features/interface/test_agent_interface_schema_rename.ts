import { orchestrateInterfaceSchemaRename } from "@autobe/agent/src/orchestrate/interface/orchestrateInterfaceSchemaRename";
import { AutoBeOpenApi } from "@autobe/interface";
import { missedOpenApiSchemas } from "@autobe/utils";
import typia, { tags } from "typia";

export const test_agent_interface_schema_rename = (): void => {
  const document: AutoBeOpenApi.IDocument = {
    operations: [
      {
        ...typia.random<AutoBeOpenApi.IOperation>(),
        method: "get",
        path: "/bbs/articles",
        responseBody: {
          typeName: "IPageIArticle.ISummary",
          description: "A paginated list of article summaries",
        },
      },
      {
        ...typia.random<AutoBeOpenApi.IOperation>(),
        method: "get",
        path: "/bbs/articles/:articleId/comments",
        responseBody: {
          typeName: "IPageIArticleComment",
          description: "A paginated list of comments for an article",
        },
      },
      {
        ...typia.random<AutoBeOpenApi.IOperation>(),
        method: "post",
        path: "/bbs/articles",
        requestBody: {
          typeName: "IArticle.ICreate",
          description: "Create a new article",
        },
        responseBody: {
          typeName: "IArticle",
          description: "The created article",
        },
      },
      {
        ...typia.random<AutoBeOpenApi.IOperation>(),
        method: "post",
        path: "/bbs/articles/:articleId/comments",
        requestBody: {
          typeName: "IArticleComment.ICreate",
          description: "Create a new comment on an article",
        },
        responseBody: {
          typeName: "IArticleComment",
          description: "The created comment",
        },
      },
    ],
    components: {
      schemas: typia.json.schemas<
        [
          IPageIArticle.ISummary,
          IPageIArticleComment,
          IArticle,
          IArticle.ICreate,
          IArticle.ISummary,
          IArticleComment,
          IArticleComment.ICreate,
        ]
      >().components.schemas as any,
      authorizations: [],
    },
  };
  orchestrateInterfaceSchemaRename.rename(document, [
    { from: "IArticle", to: "IBbsArticle" },
    { from: "IArticleComment", to: "IBbsArticleComment" },
  ]);
  console.log(JSON.stringify(document, null, 2));
  console.log(missedOpenApiSchemas(document));
};

namespace IPageIArticle {
  export interface ISummary {
    data: IArticle.ISummary[];
  }
}
interface IPageIArticleComment {
  data: IArticleComment[];
}

/** The article. */
interface IArticle extends IArticle.ISummary {
  /** Body content of the article. */
  body: string;
  comments: IArticleComment[];
}
namespace IArticle {
  /** Summary information of the article. */
  export interface ISummary {
    /** Primary Key. */
    id: string & tags.Format<"uuid">;

    /** Title of the article. */
    title: string;

    /** Creation timestamp. */
    created_at: string & tags.Format<"date-time">;

    /** Last update timestamp. */
    updated_at: string & tags.Format<"date-time">;
  }

  /** Interface for creating a new article. */
  export interface ICreate {
    /** Title of the article. */
    title: string;

    /** Body content of the article. */
    body: string;
  }
}

/** Comment on an article. */
interface IArticleComment {
  /** Primary Key. */
  id: string & tags.Format<"uuid">;

  /** Content of the comment. */
  body: string;

  /** Timestamp when the comment was created. */
  created_at: string & tags.Format<"date-time">;

  /** Timestamp when the comment was last updated. */
  updated_at: string & tags.Format<"date-time">;
}
namespace IArticleComment {
  /** Interface for creating a new comment. */
  export interface ICreate {
    /** Content of the comment. */
    body: string;
  }
}

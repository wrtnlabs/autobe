import { AutoBeOpenApi } from "@autobe/interface";
import { tags } from "typia";

import { IAutoBePreliminaryGetAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetAnalysisFiles";
import { IAutoBePreliminaryGetPreviousAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisFiles";
import { IAutoBePreliminaryGetPreviousInterfaceOperations } from "../../common/structures/IAutoBePreliminaryGetPreviousInterfaceOperations";
import { IAutoBePreliminaryGetPreviousPrismaSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousPrismaSchemas";
import { IAutoBePreliminaryGetPrismaSchemas } from "../../common/structures/IAutoBePreliminaryGetPrismaSchemas";

export interface IAutoBeInterfaceActionEndpointApplication {
  /**
   * Process action endpoint generation task or preliminary data requests.
   *
   * Creates non-CRUD business logic endpoints such as analytics, dashboards,
   * search, reports, and enriched data views. These endpoints are derived from
   * requirements analysis rather than direct table mappings.
   *
   * @param props Request containing either preliminary data request or complete
   *   task
   */
  process(props: IAutoBeInterfaceActionEndpointApplication.IProps): void;
}

export namespace IAutoBeInterfaceActionEndpointApplication {
  export interface IProps {
    /**
     * Think before you act.
     *
     * Before requesting preliminary data or completing your task, reflect on
     * your current state and explain your reasoning:
     *
     * For preliminary requests (getAnalysisFiles, getPrismaSchemas, etc.):
     *
     * - What critical information is missing that you don't already have?
     * - Why do you need it specifically right now?
     * - Be brief - state the gap, don't list everything you have.
     *
     * For completion (complete):
     *
     * - What key assets did you acquire?
     * - What did you accomplish?
     * - Why is it sufficient to complete?
     * - Summarize - don't enumerate every single item.
     *
     * This reflection helps you avoid duplicate requests and premature
     * completion.
     */
    thinking: string;

    /**
     * Type discriminator for the request.
     *
     * Determines which action to perform: preliminary data retrieval
     * (getAnalysisFiles, getPrismaSchemas) or final endpoint generation
     * (complete). When preliminary returns empty array, that type is removed
     * from the union, physically preventing repeated calls.
     */
    request:
      | IComplete
      | IAutoBePreliminaryGetAnalysisFiles
      | IAutoBePreliminaryGetPrismaSchemas
      | IAutoBePreliminaryGetPreviousAnalysisFiles
      | IAutoBePreliminaryGetPreviousPrismaSchemas
      | IAutoBePreliminaryGetPreviousInterfaceOperations;
  }

  /**
   * Request to generate action (non-CRUD) API endpoints.
   *
   * Creates business logic endpoints that go beyond standard CRUD operations.
   * These endpoints are discovered from requirements analysis and serve
   * specific business needs such as:
   *
   * ## Endpoint Categories
   *
   * - **Analytics**: `/statistics/*`, `/analytics/*` - Aggregated data views
   * - **Dashboards**: `/dashboard/*`, `/overview/*` - Multi-source summaries
   * - **Search**: `/search/*` - Cross-entity search functionality
   * - **Reports**: `/reports/*` - Business intelligence outputs
   * - **Enriched Views**: `/entities/enriched`, `/entities/{id}/complete`
   * - **Computed Metrics**: `/entities/{id}/metrics`, `/entities/{id}/analytics`
   *
   * ## Discovery Keywords
   *
   * Look for these keywords in requirements to identify action endpoints:
   *
   * - Analytics: "analyze", "trends", "summary", "total", "average"
   * - Dashboard: "dashboard", "overview", "at a glance", "KPIs"
   * - Search: "search across", "global search", "unified search"
   * - Reports: "report", "export", "download report"
   * - Enriched: "with details", "complete information", "in one call"
   *
   * ## HTTP Method Selection
   *
   * - **GET**: Simple computed data without complex request body
   * - **PATCH**: Complex filtering/search criteria in request body
   * - **POST/PUT/DELETE**: Rarely used for action endpoints (read-only nature)
   *
   * ## Security Considerations
   *
   * Action endpoints should NOT expose:
   *
   * - Raw sensitive data (passwords, tokens, PII)
   * - Internal system metrics not intended for users
   * - Audit logs meant only for system administrators
   */
  export interface IComplete {
    /**
     * Type discriminator for the request.
     *
     * Determines which action to perform: preliminary data retrieval or actual
     * task execution. Value "complete" indicates this is the final task
     * execution request.
     */
    type: "complete";

    /**
     * Array of action endpoints to generate.
     *
     * Each endpoint represents a non-CRUD business logic operation discovered
     * from requirements analysis. These endpoints provide:
     *
     * - Aggregated/computed data views
     * - Cross-entity search functionality
     * - Dashboard and overview summaries
     * - Business reports and analytics
     * - Enriched data responses
     *
     * ## Path Patterns (Hierarchical Structure)
     *
     * - `/statistics/sales/monthly` - Time-based analytics
     * - `/analytics/customer/behavior` - Behavioral analysis
     * - `/dashboard/admin/overview` - Multi-metric dashboard
     * - `/search/global` - Unified search (PATCH method)
     * - `/reports/revenue/summary` - Business reports
     * - `/customers/{customerId}/metrics` - Entity-specific computed data
     * - `/products/enriched` - Denormalized views (PATCH method)
     *
     * ## Validation Rules
     *
     * - Must NOT duplicate existing CRUD endpoints
     * - Must NOT duplicate authorization endpoints
     * - Must use hierarchical `/` structure (NOT camelCase concatenation)
     * - Must start with `/`
     * - Must NOT include domain prefixes (`/shopping/`, `/bbs/`)
     */
    endpoints: IEndpoint[] & tags.MinItems<0>;
  }

  export interface IEndpoint {
    /** The endpoint definition containing path and HTTP method. */
    endpoint: AutoBeOpenApi.IEndpoint;

    /**
     * Explanation of why this endpoint was created.
     *
     * Describes the business requirement, use case, or workflow that this
     * endpoint fulfills. This context helps the EndpointReview agent to:
     *
     * - Verify the endpoint serves a real business need
     * - Identify redundant endpoints that could be consolidated
     * - Ensure the path/method aligns with the intended purpose
     * - Validate that the endpoint is derived from actual requirements
     */
    description: string;
  }
}

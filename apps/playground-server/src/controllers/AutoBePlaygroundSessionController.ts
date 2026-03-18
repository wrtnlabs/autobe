import { IAutoBePlaygroundSession, IPage } from "@autobe/interface";
import { TypedBody, TypedParam, TypedRoute } from "@nestia/core";
import { Controller, Get } from "@nestjs/common";
import { tags } from "typia";

import { AutoBePlaygroundSessionProvider } from "../providers/sessions/AutoBePlaygroundSessionProvider";

@Controller("autobe/playground/sessions")
export class AutoBePlaygroundSessionController {
  /**
   * List sessions with pagination.
   *
   * Returns a paginated list of session summaries sorted by creation date in
   * descending order. Soft-deleted sessions are excluded.
   *
   * @author Samchon
   * @param body Search and pagination request parameters
   * @returns Paginated session summary list
   * @tag Session
   */
  @TypedRoute.Patch()
  public async index(
    @TypedBody() body: IAutoBePlaygroundSession.IRequest,
  ): Promise<IPage<IAutoBePlaygroundSession.ISummary>> {
    return AutoBePlaygroundSessionProvider.index({ body });
  }

  /**
   * Get a session by ID with full detail.
   *
   * Returns the complete session record including all conversation histories
   * and event snapshots.
   *
   * @author Samchon
   * @param id Target session's {@link IAutoBePlaygroundSession.id}
   * @returns Session with histories and snapshots
   * @tag Session
   */
  @Get(":id")
  public async at(
    @TypedParam("id") id: string & tags.Format<"uuid">,
  ): Promise<IAutoBePlaygroundSession> {
    return AutoBePlaygroundSessionProvider.at({ id });
  }

  /**
   * Create a new vibe coding session.
   *
   * Initializes a session bound to the specified vendor configuration. An
   * aggregate record for tracking phase progress and token usage is
   * automatically created alongside the session.
   *
   * @author Samchon
   * @param body Session creation properties
   * @returns Newly created session with full detail
   * @tag Session
   */
  @TypedRoute.Post()
  public async create(
    @TypedBody() body: IAutoBePlaygroundSession.ICreate,
  ): Promise<IAutoBePlaygroundSession> {
    return AutoBePlaygroundSessionProvider.create({ body });
  }

  /**
   * Update a session's metadata.
   *
   * Currently supports updating the session title only.
   *
   * @author Samchon
   * @param id Target session's {@link IAutoBePlaygroundSession.id}
   * @param body Fields to update
   * @tag Session
   */
  @TypedRoute.Put(":id")
  public async update(
    @TypedParam("id") id: string & tags.Format<"uuid">,
    @TypedBody() body: IAutoBePlaygroundSession.IUpdate,
  ): Promise<void> {
    await AutoBePlaygroundSessionProvider.update({ id, body });
  }

  /**
   * Soft-delete a session.
   *
   * Marks the session as deleted without physically removing the record or its
   * associated histories, events, and connections.
   *
   * @author Samchon
   * @param id Target session's {@link IAutoBePlaygroundSession.id}
   * @tag Session
   */
  @TypedRoute.Delete(":id")
  public async erase(
    @TypedParam("id") id: string & tags.Format<"uuid">,
  ): Promise<void> {
    await AutoBePlaygroundSessionProvider.erase({ id });
  }
}

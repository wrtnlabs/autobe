import { HttpRunner } from "./http-runner";
import {
  type ScenarioResult,
  fail,
  pass,
  randomEmail,
  randomPassword,
} from "./scenario-helpers";
import { type RouteInfo, findEndpoint } from "./url-resolver";

export type { ScenarioResult };

export async function runTodoScenarios(
  routes: RouteInfo[],
  http: HttpRunner,
): Promise<ScenarioResult[]> {
  const results: ScenarioResult[] = [];

  const email = randomEmail();
  const password = randomPassword();
  let todoId: string | null = null;

  // 1. User signup
  const joinEndpoint = findEndpoint(routes, {
    pathKeywords: ["join"],
    method: "POST",
  });
  if (!joinEndpoint) {
    results.push(fail(1, "User signup", "endpoint not found", "auth"));
  } else {
    const res = await http.post(joinEndpoint.url, {
      email,
      password,
      display_name: "Test User",
    });
    results.push(
      res.ok
        ? pass(1, "User signup", "auth")
        : fail(1, "User signup", `status ${res.status}`, "auth"),
    );
  }

  // 2. User login
  const loginEndpoint = findEndpoint(routes, {
    pathKeywords: ["login"],
    method: "POST",
  });
  if (!loginEndpoint) {
    results.push(fail(2, "User login", "endpoint not found", "auth"));
  } else {
    const res = await http.post(loginEndpoint.url, { email, password });
    if (res.ok) {
      const token =
        res.body?.token?.access || res.body?.access_token || res.body?.token;
      const tokenStr =
        typeof token === "string" ? token : token?.access || token;
      if (tokenStr) {
        http.setToken(tokenStr);
        results.push(pass(2, "User login", "auth"));
      } else {
        results.push(fail(2, "User login", "no token in response", "auth"));
      }
    } else {
      results.push(fail(2, "User login", `status ${res.status}`, "auth"));
    }
  }

  // 3. User withdrawal
  const withdrawEmail = randomEmail();
  const withdrawPassword = randomPassword();
  if (joinEndpoint && loginEndpoint) {
    await http.post(joinEndpoint.url, {
      email: withdrawEmail,
      password: withdrawPassword,
      display_name: "Withdraw User",
    });
    const wLogin = await http.post(loginEndpoint.url, {
      email: withdrawEmail,
      password: withdrawPassword,
    });
    const wToken =
      wLogin.body?.token?.access ||
      wLogin.body?.access_token ||
      wLogin.body?.token;
    const wRunner = new HttpRunner();
    if (wToken)
      wRunner.setToken(
        typeof wToken === "string" ? wToken : wToken?.access || wToken,
      );
    const withdrawEndpoint =
      findEndpoint(routes, {
        pathKeywords: ["withdraw", "leave", "secede", "deactivate"],
        method: "DELETE",
      }) || findEndpoint(routes, { pathKeywords: ["users"], method: "PATCH" });
    const wRes = withdrawEndpoint
      ? await wRunner.delete(withdrawEndpoint.url, true)
      : null;
    results.push(
      wRes?.ok
        ? pass(3, "User withdrawal", "cleanup")
        : fail(
            3,
            "User withdrawal",
            withdrawEndpoint ? `status ${wRes?.status}` : "endpoint not found",
            "cleanup",
          ),
    );
  } else {
    results.push(fail(3, "User withdrawal", "setup failed", "cleanup"));
  }

  // 4. Password change
  const pwEndpoint =
    findEndpoint(routes, {
      pathKeywords: ["password", "passwd", "password-resets"],
      method: "PATCH",
    }) ||
    findEndpoint(routes, {
      pathKeywords: ["password", "passwd"],
      method: "PUT",
    });
  if (!pwEndpoint) {
    results.push(fail(4, "Password change", "endpoint not found", "auth"));
  } else {
    const res = await http.patch(
      pwEndpoint.url,
      {
        current_password: password,
        new_password: randomPassword(),
        password,
        newPassword: randomPassword(),
      },
      true,
    );
    results.push(
      res.ok
        ? pass(4, "Password change", "auth")
        : fail(4, "Password change", `status ${res.status}`, "auth"),
    );
  }

  // 5. Update display name
  const profileEndpoint =
    findEndpoint(routes, { pathKeywords: ["profile"], method: "PATCH" }) ||
    findEndpoint(routes, { pathKeywords: ["profile"], method: "PUT" }) ||
    findEndpoint(routes, {
      pathKeywords: ["profile/edits", "profile"],
      method: "PATCH",
    });
  if (!profileEndpoint) {
    results.push(fail(5, "Update display name", "endpoint not found", "crud"));
  } else {
    const res = await http.patch(
      profileEndpoint.url,
      { display_name: "Updated Name", displayName: "Updated Name" },
      true,
    );
    results.push(
      res.ok
        ? pass(5, "Update display name", "crud")
        : fail(5, "Update display name", `status ${res.status}`, "crud"),
    );
  }

  // 6. Create todo (title required, description/start_date/due_date optional)
  const todoCreateEndpoint = findEndpoint(routes, {
    pathKeywords: ["todos"],
    method: "POST",
  });
  if (!todoCreateEndpoint) {
    results.push(fail(6, "Create todo", "endpoint not found", "crud"));
  } else {
    const res = await http.post(
      todoCreateEndpoint.url,
      {
        title: "Golden Set Test Todo",
        description: "optional description",
      },
      true,
    );
    if (res.ok) {
      todoId = res.body?.id || res.body?.data?.id || null;
      results.push(pass(6, "Create todo", "crud"));
    } else {
      results.push(fail(6, "Create todo", `status ${res.status}`, "crud"));
    }
  }

  // 7. List todos with pagination
  const todoListEndpoint =
    findEndpoint(routes, { pathKeywords: ["todos"], method: "GET" }) ||
    findEndpoint(routes, { pathKeywords: ["todos"], method: "PATCH" });
  if (!todoListEndpoint) {
    results.push(
      fail(7, "List todos with pagination", "endpoint not found", "query"),
    );
  } else {
    const res =
      todoListEndpoint.method === "PATCH"
        ? await http.patch(todoListEndpoint.url, { page: 1, limit: 10 }, true)
        : await http.get(todoListEndpoint.url, true);
    const hasData =
      res.ok &&
      (Array.isArray(res.body) ||
        Array.isArray(res.body?.data) ||
        res.body?.pagination ||
        res.body?.page);
    results.push(
      hasData
        ? pass(7, "List todos with pagination", "query")
        : fail(
            7,
            "List todos with pagination",
            `status ${res.status}`,
            "query",
          ),
    );
  }

  // 8. Toggle todo completion
  const toggleEndpoint =
    findEndpoint(routes, {
      pathKeywords: ["toggle", "completion", "complete"],
      method: "POST",
    }) ||
    findEndpoint(routes, {
      pathKeywords: ["toggle", "completion", "complete"],
      method: "PATCH",
    }) ||
    findEndpoint(routes, {
      pathKeywords: ["completion", "complete"],
      method: "PUT",
    });
  if (!toggleEndpoint || !todoId) {
    results.push(
      fail(
        8,
        "Toggle todo completion",
        toggleEndpoint ? "no todoId" : "endpoint not found",
        "crud",
      ),
    );
  } else {
    const url = http.resolvePath(toggleEndpoint.url, { todoId });
    const res = await http.post(url, {}, true);
    const res2 = res.ok
      ? res
      : await http.patch(url, { completed: true }, true);
    results.push(
      res2.ok
        ? pass(8, "Toggle todo completion", "crud")
        : fail(8, "Toggle todo completion", `status ${res2.status}`, "crud"),
    );
  }

  // 9. Edit history auto-created on todo update
  const todoUpdateEndpoint = findEndpoint(routes, {
    pathKeywords: ["todos"],
    method: "PATCH",
  });
  const historyEndpoint =
    findEndpoint(routes, {
      pathKeywords: ["histories", "editHistories", "edit-history"],
      mustContain: "todo",
      method: "GET",
    }) ||
    findEndpoint(routes, {
      pathKeywords: ["histories", "editHistories", "edit-history"],
      mustContain: "todo",
      method: "PATCH",
    }) ||
    findEndpoint(routes, {
      pathKeywords: ["histories"],
      mustContain: "todo",
      method: "GET",
    });
  if (!todoUpdateEndpoint || !historyEndpoint || !todoId) {
    results.push(
      fail(
        9,
        "Edit history auto-created on update",
        !todoId
          ? "no todoId"
          : !todoUpdateEndpoint
            ? "update endpoint not found"
            : "history endpoint not found",
        "workflow",
      ),
    );
  } else {
    const updateUrl = http.resolvePath(todoUpdateEndpoint.url, { todoId });
    await http.patch(
      updateUrl,
      { title: "Updated Title for History Test" },
      true,
    );
    const historyUrl = http.resolvePath(historyEndpoint.url, { todoId });
    const res =
      historyEndpoint.method === "PATCH"
        ? await http.patch(historyUrl, { page: 1, limit: 10 }, true)
        : await http.get(historyUrl, true);
    const histories = Array.isArray(res.body) ? res.body : res.body?.data;
    results.push(
      res.ok && Array.isArray(histories) && histories.length >= 1
        ? pass(9, "Edit history auto-created on update", "workflow")
        : fail(
            9,
            "Edit history auto-created on update",
            `histories length: ${histories?.length}`,
            "workflow",
          ),
    );
  }

  // 10. Get edit history in chronological order
  if (!historyEndpoint || !todoId) {
    results.push(
      fail(10, "Get edit history", "endpoint not found or no todoId", "query"),
    );
  } else {
    const historyUrl = http.resolvePath(historyEndpoint.url, { todoId });
    const res =
      historyEndpoint.method === "PATCH"
        ? await http.patch(historyUrl, { page: 1, limit: 10 }, true)
        : await http.get(historyUrl, true);
    results.push(
      res.ok
        ? pass(10, "Get edit history", "query")
        : fail(10, "Get edit history", `status ${res.status}`, "query"),
    );
  }

  // 11. Delete todo moves it to trash (soft delete)
  const todoDeleteEndpoint = findEndpoint(routes, {
    pathKeywords: ["todos"],
    method: "DELETE",
  });
  if (!todoDeleteEndpoint || !todoId) {
    results.push(
      fail(
        11,
        "Delete todo moves to trash",
        todoDeleteEndpoint ? "no todoId" : "endpoint not found",
        "crud",
      ),
    );
  } else {
    const deleteUrl = http.resolvePath(todoDeleteEndpoint.url, { todoId });
    const res = await http.delete(deleteUrl, true);
    results.push(
      res.ok
        ? pass(11, "Delete todo moves to trash", "crud")
        : fail(
            11,
            "Delete todo moves to trash",
            `status ${res.status}`,
            "crud",
          ),
    );
  }

  // 12. List trash
  const trashListEndpoint =
    findEndpoint(routes, { pathKeywords: ["trash"], method: "GET" }) ||
    findEndpoint(routes, { pathKeywords: ["trash"], method: "PATCH" });
  if (!trashListEndpoint) {
    results.push(fail(12, "List trash", "endpoint not found", "query"));
  } else {
    const res =
      trashListEndpoint.method === "PATCH"
        ? await http.patch(trashListEndpoint.url, { page: 1, limit: 10 }, true)
        : await http.get(trashListEndpoint.url, true);
    results.push(
      res.ok
        ? pass(12, "List trash", "query")
        : fail(12, "List trash", `status ${res.status}`, "query"),
    );
  }

  // 13. Restore todo from trash
  let trashTodoId: string | null = null;
  if (todoCreateEndpoint && todoDeleteEndpoint) {
    const createRes = await http.post(
      todoCreateEndpoint.url,
      { title: "Todo for Restore Test" },
      true,
    );
    trashTodoId = createRes.body?.id || createRes.body?.data?.id || null;
    if (trashTodoId) {
      const delUrl = http.resolvePath(todoDeleteEndpoint.url, {
        todoId: trashTodoId,
      });
      await http.delete(delUrl, true);
    }
  }
  const restoreEndpoint =
    findEndpoint(routes, { pathKeywords: ["restore"], method: "POST" }) ||
    findEndpoint(routes, { pathKeywords: ["restore"], method: "PATCH" }) ||
    findEndpoint(routes, { pathKeywords: ["restore"], method: "PUT" });
  if (!restoreEndpoint || !trashTodoId) {
    results.push(
      fail(
        13,
        "Restore todo from trash",
        restoreEndpoint ? "no trashTodoId" : "endpoint not found",
        "crud",
      ),
    );
  } else {
    const restoreUrl = http.resolvePath(restoreEndpoint.url, {
      todoId: trashTodoId,
      trashItemId: trashTodoId,
      id: trashTodoId,
    });
    const res = await http.post(restoreUrl, {}, true);
    const res2 = res.ok ? res : await http.patch(restoreUrl, {}, true);
    results.push(
      res2.ok
        ? pass(13, "Restore todo from trash", "crud")
        : fail(13, "Restore todo from trash", `status ${res2.status}`, "crud"),
    );
  }

  // 14. Cannot access another user's todo
  if (!joinEndpoint || !loginEndpoint || !todoId) {
    results.push(
      fail(14, "Cannot access another user's todo", "setup failed", "negative"),
    );
  } else {
    const otherEmail = randomEmail();
    const otherPassword = randomPassword();
    await http.post(joinEndpoint.url, {
      email: otherEmail,
      password: otherPassword,
      display_name: "Other User",
    });
    const otherLogin = await http.post(loginEndpoint.url, {
      email: otherEmail,
      password: otherPassword,
    });
    const otherToken =
      otherLogin.body?.token?.access ||
      otherLogin.body?.access_token ||
      otherLogin.body?.token;
    const otherHttp = new HttpRunner();
    if (otherToken)
      otherHttp.setToken(
        typeof otherToken === "string"
          ? otherToken
          : otherToken?.access || otherToken,
      );
    const getTodoEndpoint = findEndpoint(routes, {
      pathKeywords: ["todos"],
      method: "GET",
    });
    if (getTodoEndpoint) {
      const url = otherHttp.resolvePath(getTodoEndpoint.url, { todoId });
      const res = await otherHttp.get(url, true);
      results.push(
        res.status === 403 || res.status === 404
          ? pass(14, "Cannot access another user's todo", "negative")
          : fail(
              14,
              "Cannot access another user's todo",
              `expected 403/404 but got ${res.status}`,
              "negative",
            ),
      );
    } else {
      results.push(
        fail(
          14,
          "Cannot access another user's todo",
          "get todo endpoint not found",
          "negative",
        ),
      );
    }
  }

  // ── Negative Tests ─────────────────────────────────────

  // 15. Unauthenticated access returns 401
  if (todoCreateEndpoint) {
    const anonHttp = new HttpRunner();
    const res = await anonHttp.post(
      todoCreateEndpoint.url,
      { title: "Should Fail" },
      false,
    );
    results.push(
      res.status === 401
        ? pass(15, "Unauthenticated create returns 401", "negative")
        : fail(
            15,
            "Unauthenticated create returns 401",
            `expected 401 but got ${res.status}`,
            "negative",
          ),
    );
  } else {
    results.push(
      fail(
        15,
        "Unauthenticated create returns 401",
        "endpoint not found",
        "negative",
      ),
    );
  }

  // 16. Invalid login credentials return 401/403
  if (loginEndpoint) {
    const res = await http.post(loginEndpoint.url, {
      email: "nonexistent@invalid.test",
      password: "WrongPassword123!",
    });
    results.push(
      res.status === 401 || res.status === 403 || res.status === 404
        ? pass(16, "Invalid login returns error status", "negative")
        : fail(
            16,
            "Invalid login returns error status",
            `expected 401/403/404 but got ${res.status}`,
            "negative",
          ),
    );
  } else {
    results.push(
      fail(
        16,
        "Invalid login returns error status",
        "endpoint not found",
        "negative",
      ),
    );
  }

  // 17. Create todo with empty body returns 400/422
  if (todoCreateEndpoint) {
    const res = await http.post(todoCreateEndpoint.url, {}, true);
    results.push(
      res.status === 400 || res.status === 422 || res.status === 403
        ? pass(
            17,
            "Create todo with empty body returns validation error",
            "negative",
          )
        : fail(
            17,
            "Create todo with empty body returns validation error",
            `expected 400/422 but got ${res.status}`,
            "negative",
          ),
    );
  } else {
    results.push(
      fail(
        17,
        "Create todo with empty body returns validation error",
        "endpoint not found",
        "negative",
      ),
    );
  }

  // 18. Get non-existent todo returns 404
  {
    const getTodoEndpoint = findEndpoint(routes, {
      pathKeywords: ["todos"],
      method: "GET",
    });
    if (getTodoEndpoint) {
      const fakeId = "00000000-0000-0000-0000-000000000000";
      const url = http.resolvePath(getTodoEndpoint.url, {
        todoId: fakeId,
        id: fakeId,
      });
      const res = await http.get(url, true);
      results.push(
        res.status === 404
          ? pass(18, "Get non-existent todo returns 404", "negative")
          : fail(
              18,
              "Get non-existent todo returns 404",
              `expected 404 but got ${res.status}`,
              "negative",
            ),
      );
    } else {
      results.push(
        fail(
          18,
          "Get non-existent todo returns 404",
          "endpoint not found",
          "negative",
        ),
      );
    }
  }

  return results;
}

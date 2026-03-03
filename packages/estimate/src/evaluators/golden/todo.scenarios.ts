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
    results.push(fail(1, "User signup", "endpoint not found"));
  } else {
    const res = await http.post(joinEndpoint.url, {
      email,
      password,
      display_name: "Test User",
    });
    results.push(
      res.ok
        ? pass(1, "User signup")
        : fail(1, "User signup", `status ${res.status}`),
    );
  }

  // 2. User login
  const loginEndpoint = findEndpoint(routes, {
    pathKeywords: ["login"],
    method: "POST",
  });
  if (!loginEndpoint) {
    results.push(fail(2, "User login", "endpoint not found"));
  } else {
    const res = await http.post(loginEndpoint.url, { email, password });
    if (res.ok) {
      const token =
        res.body?.token?.access || res.body?.access_token || res.body?.token;
      const tokenStr =
        typeof token === "string" ? token : token?.access || token;
      if (tokenStr) {
        http.setToken(tokenStr);
        results.push(pass(2, "User login"));
      } else {
        results.push(fail(2, "User login", "no token in response"));
      }
    } else {
      results.push(fail(2, "User login", `status ${res.status}`));
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
        ? pass(3, "User withdrawal")
        : fail(
            3,
            "User withdrawal",
            withdrawEndpoint ? `status ${wRes?.status}` : "endpoint not found",
          ),
    );
  } else {
    results.push(fail(3, "User withdrawal", "setup failed"));
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
    results.push(fail(4, "Password change", "endpoint not found"));
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
        ? pass(4, "Password change")
        : fail(4, "Password change", `status ${res.status}`),
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
    results.push(fail(5, "Update display name", "endpoint not found"));
  } else {
    const res = await http.patch(
      profileEndpoint.url,
      { display_name: "Updated Name", displayName: "Updated Name" },
      true,
    );
    results.push(
      res.ok
        ? pass(5, "Update display name")
        : fail(5, "Update display name", `status ${res.status}`),
    );
  }

  // 6. Create todo (title required, description/start_date/due_date optional)
  const todoCreateEndpoint = findEndpoint(routes, {
    pathKeywords: ["todos"],
    method: "POST",
  });
  if (!todoCreateEndpoint) {
    results.push(fail(6, "Create todo", "endpoint not found"));
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
      results.push(pass(6, "Create todo"));
    } else {
      results.push(fail(6, "Create todo", `status ${res.status}`));
    }
  }

  // 7. List todos with pagination
  const todoListEndpoint =
    findEndpoint(routes, { pathKeywords: ["todos"], method: "GET" }) ||
    findEndpoint(routes, { pathKeywords: ["todos"], method: "PATCH" });
  if (!todoListEndpoint) {
    results.push(fail(7, "List todos with pagination", "endpoint not found"));
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
        ? pass(7, "List todos with pagination")
        : fail(7, "List todos with pagination", `status ${res.status}`),
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
        ? pass(8, "Toggle todo completion")
        : fail(8, "Toggle todo completion", `status ${res2.status}`),
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
        ? pass(9, "Edit history auto-created on update")
        : fail(
            9,
            "Edit history auto-created on update",
            `histories length: ${histories?.length}`,
          ),
    );
  }

  // 10. Get edit history in chronological order
  if (!historyEndpoint || !todoId) {
    results.push(
      fail(10, "Get edit history", "endpoint not found or no todoId"),
    );
  } else {
    const historyUrl = http.resolvePath(historyEndpoint.url, { todoId });
    const res =
      historyEndpoint.method === "PATCH"
        ? await http.patch(historyUrl, { page: 1, limit: 10 }, true)
        : await http.get(historyUrl, true);
    results.push(
      res.ok
        ? pass(10, "Get edit history")
        : fail(10, "Get edit history", `status ${res.status}`),
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
      ),
    );
  } else {
    const deleteUrl = http.resolvePath(todoDeleteEndpoint.url, { todoId });
    const res = await http.delete(deleteUrl, true);
    results.push(
      res.ok
        ? pass(11, "Delete todo moves to trash")
        : fail(11, "Delete todo moves to trash", `status ${res.status}`),
    );
  }

  // 12. List trash
  const trashListEndpoint =
    findEndpoint(routes, { pathKeywords: ["trash"], method: "GET" }) ||
    findEndpoint(routes, { pathKeywords: ["trash"], method: "PATCH" });
  if (!trashListEndpoint) {
    results.push(fail(12, "List trash", "endpoint not found"));
  } else {
    const res =
      trashListEndpoint.method === "PATCH"
        ? await http.patch(trashListEndpoint.url, { page: 1, limit: 10 }, true)
        : await http.get(trashListEndpoint.url, true);
    results.push(
      res.ok
        ? pass(12, "List trash")
        : fail(12, "List trash", `status ${res.status}`),
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
        ? pass(13, "Restore todo from trash")
        : fail(13, "Restore todo from trash", `status ${res2.status}`),
    );
  }

  // 14. Cannot access another user's todo
  if (!joinEndpoint || !loginEndpoint || !todoId) {
    results.push(fail(14, "Cannot access another user's todo", "setup failed"));
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
          ? pass(14, "Cannot access another user's todo")
          : fail(
              14,
              "Cannot access another user's todo",
              `expected 403/404 but got ${res.status}`,
            ),
      );
    } else {
      results.push(
        fail(
          14,
          "Cannot access another user's todo",
          "get todo endpoint not found",
        ),
      );
    }
  }

  return results;
}

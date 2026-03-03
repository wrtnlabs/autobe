import { HttpRunner } from "./http-runner";
import {
  type ScenarioResult,
  fail,
  pass,
  randomEmail,
  randomPassword,
} from "./scenario-helpers";
import { type RouteInfo, findEndpoint } from "./url-resolver";

export async function runBbsScenarios(
  routes: RouteInfo[],
  http: HttpRunner,
): Promise<ScenarioResult[]> {
  const results: ScenarioResult[] = [];

  const email = randomEmail();
  const password = randomPassword();
  let articleId: string | null = null;
  let commentId: string | null = null;
  let sectionId: string | null = null;

  // ── Auth ─────────────────────────────────────────────────

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
      display_name: "BBS User",
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

  // 3. Update profile
  const profileEndpoint =
    findEndpoint(routes, { pathKeywords: ["profile"], method: "PATCH" }) ||
    findEndpoint(routes, { pathKeywords: ["profile"], method: "PUT" });
  if (!profileEndpoint) {
    results.push(fail(3, "Update profile", "endpoint not found"));
  } else {
    const res = await http.patch(
      profileEndpoint.url,
      { display_name: "Updated BBS User", bio: "Hello" },
      true,
    );
    results.push(
      res.ok
        ? pass(3, "Update profile")
        : fail(3, "Update profile", `status ${res.status}`),
    );
  }

  // ── Sections ─────────────────────────────────────────────

  // 4. List sections
  const sectionListEndpoint = findEndpoint(routes, {
    pathKeywords: ["sections"],
    method: "GET",
  });
  if (!sectionListEndpoint) {
    results.push(fail(4, "List sections", "endpoint not found"));
  } else {
    const res = await http.get(sectionListEndpoint.url, true);
    results.push(
      res.ok
        ? pass(4, "List sections")
        : fail(4, "List sections", `status ${res.status}`),
    );
  }

  // 5. Create section (may require admin, try anyway)
  const sectionCreateEndpoint = findEndpoint(routes, {
    pathKeywords: ["sections"],
    method: "POST",
  });
  if (!sectionCreateEndpoint) {
    results.push(fail(5, "Create section", "endpoint not found"));
  } else {
    const res = await http.post(
      sectionCreateEndpoint.url,
      {
        name: "Golden Test Section",
        description: "Section for golden set testing",
      },
      true,
    );
    if (res.ok) {
      sectionId = res.body?.id || res.body?.data?.id || null;
      results.push(pass(5, "Create section"));
    } else {
      results.push(fail(5, "Create section", `status ${res.status}`));
    }
  }

  // ── Articles ─────────────────────────────────────────────

  // 6. Create article
  const articleCreateEndpoint = findEndpoint(routes, {
    pathKeywords: ["articles"],
    method: "POST",
  });
  if (!articleCreateEndpoint) {
    results.push(fail(6, "Create article", "endpoint not found"));
  } else {
    const body: Record<string, unknown> = {
      title: "Golden Set Test Article",
      content: "This is a test article for golden set evaluation.",
    };
    if (sectionId) body.section_id = sectionId;
    const res = await http.post(articleCreateEndpoint.url, body, true);
    if (res.ok) {
      articleId = res.body?.id || res.body?.data?.id || null;
      results.push(pass(6, "Create article"));
    } else {
      results.push(fail(6, "Create article", `status ${res.status}`));
    }
  }

  // 7. Get article detail
  const articleGetEndpoint = findEndpoint(routes, {
    pathKeywords: ["articles"],
    method: "GET",
  });
  if (!articleGetEndpoint || !articleId) {
    results.push(
      fail(
        7,
        "Get article detail",
        articleGetEndpoint ? "no articleId" : "endpoint not found",
      ),
    );
  } else {
    const url = http.resolvePath(articleGetEndpoint.url, {
      id: articleId,
      articleId,
    });
    const res = await http.get(url, true);
    results.push(
      res.ok
        ? pass(7, "Get article detail")
        : fail(7, "Get article detail", `status ${res.status}`),
    );
  }

  // 8. Edit article
  const articleEditEndpoint = findEndpoint(routes, {
    pathKeywords: ["articles"],
    method: "PATCH",
  });
  if (!articleEditEndpoint || !articleId) {
    results.push(
      fail(
        8,
        "Edit article",
        articleEditEndpoint ? "no articleId" : "endpoint not found",
      ),
    );
  } else {
    const url = http.resolvePath(articleEditEndpoint.url, {
      id: articleId,
      articleId,
    });
    const res = await http.patch(url, { title: "Updated Article Title" }, true);
    results.push(
      res.ok
        ? pass(8, "Edit article")
        : fail(8, "Edit article", `status ${res.status}`),
    );
  }

  // 9. Search articles
  const searchEndpoint =
    findEndpoint(routes, {
      pathKeywords: ["search"],
      mustContain: "article",
      method: "GET",
    }) ||
    findEndpoint(routes, {
      pathKeywords: ["articles", "search"],
      method: "GET",
    });
  if (!searchEndpoint) {
    results.push(fail(9, "Search articles", "endpoint not found"));
  } else {
    const res = await http.get(
      `${searchEndpoint.url}?q=Golden&keyword=Golden`,
      true,
    );
    results.push(
      res.ok
        ? pass(9, "Search articles")
        : fail(9, "Search articles", `status ${res.status}`),
    );
  }

  // ── Comments ─────────────────────────────────────────────

  // 10. Write comment
  const commentCreateEndpoint = findEndpoint(routes, {
    pathKeywords: ["comments"],
    method: "POST",
  });
  if (!commentCreateEndpoint || !articleId) {
    results.push(
      fail(
        10,
        "Write comment",
        commentCreateEndpoint ? "no articleId" : "endpoint not found",
      ),
    );
  } else {
    const url = http.resolvePath(commentCreateEndpoint.url, {
      id: articleId,
      articleId,
    });
    const res = await http.post(
      url,
      { content: "Golden set test comment" },
      true,
    );
    if (res.ok) {
      commentId = res.body?.id || res.body?.data?.id || null;
      results.push(pass(10, "Write comment"));
    } else {
      results.push(fail(10, "Write comment", `status ${res.status}`));
    }
  }

  // 11. Edit comment
  const commentEditEndpoint = findEndpoint(routes, {
    pathKeywords: ["comments"],
    method: "PATCH",
  });
  if (!commentEditEndpoint || !articleId || !commentId) {
    results.push(
      fail(
        11,
        "Edit comment",
        !commentEditEndpoint ? "endpoint not found" : "no IDs",
      ),
    );
  } else {
    const url = http.resolvePath(commentEditEndpoint.url, {
      id: articleId,
      articleId,
      commentId,
    });
    const res = await http.patch(url, { content: "Updated comment" }, true);
    results.push(
      res.ok
        ? pass(11, "Edit comment")
        : fail(11, "Edit comment", `status ${res.status}`),
    );
  }

  // 12. Delete comment
  const commentDeleteEndpoint = findEndpoint(routes, {
    pathKeywords: ["comments"],
    method: "DELETE",
  });
  if (!commentDeleteEndpoint || !articleId || !commentId) {
    results.push(
      fail(
        12,
        "Delete comment",
        !commentDeleteEndpoint ? "endpoint not found" : "no IDs",
      ),
    );
  } else {
    const url = http.resolvePath(commentDeleteEndpoint.url, {
      id: articleId,
      articleId,
      commentId,
    });
    const res = await http.delete(url, true);
    results.push(
      res.ok
        ? pass(12, "Delete comment")
        : fail(12, "Delete comment", `status ${res.status}`),
    );
  }

  // 13. Delete article (soft delete)
  const articleDeleteEndpoint = findEndpoint(routes, {
    pathKeywords: ["articles"],
    method: "DELETE",
  });
  if (!articleDeleteEndpoint || !articleId) {
    results.push(
      fail(
        13,
        "Delete article",
        articleDeleteEndpoint ? "no articleId" : "endpoint not found",
      ),
    );
  } else {
    const url = http.resolvePath(articleDeleteEndpoint.url, {
      id: articleId,
      articleId,
    });
    const res = await http.delete(url, true);
    results.push(
      res.ok
        ? pass(13, "Delete article")
        : fail(13, "Delete article", `status ${res.status}`),
    );
  }

  // 14. User withdrawal
  const withdrawEndpoint = findEndpoint(routes, {
    pathKeywords: ["withdraw", "leave", "secede", "deactivate"],
    method: "DELETE",
  });
  if (!withdrawEndpoint) {
    results.push(fail(14, "User withdrawal", "endpoint not found"));
  } else {
    // Create a separate user for withdrawal test
    const wEmail = randomEmail();
    const wPassword = randomPassword();
    if (joinEndpoint && loginEndpoint) {
      await http.post(joinEndpoint.url, {
        email: wEmail,
        password: wPassword,
        display_name: "Withdraw User",
      });
      const wLogin = await http.post(loginEndpoint.url, {
        email: wEmail,
        password: wPassword,
      });
      const wToken =
        wLogin.body?.token?.access ||
        wLogin.body?.access_token ||
        wLogin.body?.token;
      const wHttp = new HttpRunner();
      if (wToken)
        wHttp.setToken(
          typeof wToken === "string" ? wToken : wToken?.access || wToken,
        );
      const res = await wHttp.delete(withdrawEndpoint.url, true);
      results.push(
        res.ok
          ? pass(14, "User withdrawal")
          : fail(14, "User withdrawal", `status ${res.status}`),
      );
    } else {
      results.push(fail(14, "User withdrawal", "auth endpoints missing"));
    }
  }

  return results;
}

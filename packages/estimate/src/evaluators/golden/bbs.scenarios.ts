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
    results.push(fail(1, "User signup", "endpoint not found", "auth"));
  } else {
    const res = await http.post(joinEndpoint.url, {
      email,
      password,
      display_name: "BBS User",
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

  // 3. Change password
  const pwEndpoint =
    findEndpoint(routes, {
      pathKeywords: ["password", "passwd"],
      method: "PATCH",
    }) ||
    findEndpoint(routes, {
      pathKeywords: ["password", "passwd"],
      method: "PUT",
    });
  if (!pwEndpoint) {
    results.push(fail(3, "Change password", "endpoint not found", "auth"));
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
        ? pass(3, "Change password", "auth")
        : fail(3, "Change password", `status ${res.status}`, "auth"),
    );
  }

  // 4. Get user profile
  const profileGetEndpoint = findEndpoint(routes, {
    pathKeywords: ["profile"],
    method: "GET",
  });
  if (!profileGetEndpoint) {
    results.push(fail(4, "Get user profile", "endpoint not found", "auth"));
  } else {
    const res = await http.get(profileGetEndpoint.url, true);
    results.push(
      res.ok
        ? pass(4, "Get user profile", "auth")
        : fail(4, "Get user profile", `status ${res.status}`, "auth"),
    );
  }

  // 5. Update profile
  const profileEndpoint =
    findEndpoint(routes, { pathKeywords: ["profile"], method: "PATCH" }) ||
    findEndpoint(routes, { pathKeywords: ["profile"], method: "PUT" });
  if (!profileEndpoint) {
    results.push(fail(5, "Update profile", "endpoint not found", "auth"));
  } else {
    const res = await http.patch(
      profileEndpoint.url,
      { display_name: "Updated BBS User", bio: "Hello" },
      true,
    );
    results.push(
      res.ok
        ? pass(5, "Update profile", "auth")
        : fail(5, "Update profile", `status ${res.status}`, "auth"),
    );
  }

  // ── Sections ─────────────────────────────────────────────

  // 6. List sections
  const sectionListEndpoint = findEndpoint(routes, {
    pathKeywords: ["sections"],
    method: "GET",
  });
  if (!sectionListEndpoint) {
    results.push(fail(6, "List sections", "endpoint not found", "crud"));
  } else {
    const res = await http.get(sectionListEndpoint.url, true);
    results.push(
      res.ok
        ? pass(6, "List sections", "crud")
        : fail(6, "List sections", `status ${res.status}`, "crud"),
    );
  }

  // 7. Create section
  const sectionCreateEndpoint = findEndpoint(routes, {
    pathKeywords: ["sections"],
    method: "POST",
  });
  if (!sectionCreateEndpoint) {
    results.push(fail(7, "Create section", "endpoint not found", "crud"));
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
      results.push(pass(7, "Create section", "crud"));
    } else {
      results.push(fail(7, "Create section", `status ${res.status}`, "crud"));
    }
  }

  // 8. Edit section
  const sectionEditEndpoint = findEndpoint(routes, {
    pathKeywords: ["sections"],
    method: "PATCH",
  });
  if (!sectionEditEndpoint || !sectionId) {
    results.push(
      fail(
        8,
        "Edit section",
        sectionEditEndpoint ? "no sectionId" : "endpoint not found",
        "crud",
      ),
    );
  } else {
    const url = http.resolvePath(sectionEditEndpoint.url, {
      id: sectionId,
      sectionId,
    });
    const res = await http.patch(
      url,
      { name: "Updated Section", description: "Updated description" },
      true,
    );
    results.push(
      res.ok
        ? pass(8, "Edit section", "crud")
        : fail(8, "Edit section", `status ${res.status}`, "crud"),
    );
  }

  // 9. List articles in section
  const sectionArticlesEndpoint = findEndpoint(routes, {
    pathKeywords: ["articles"],
    mustContain: "section",
    method: "GET",
  });
  if (!sectionArticlesEndpoint || !sectionId) {
    results.push(
      fail(
        9,
        "List articles in section",
        sectionArticlesEndpoint ? "no sectionId" : "endpoint not found",
        "crud",
      ),
    );
  } else {
    const url = http.resolvePath(sectionArticlesEndpoint.url, {
      id: sectionId,
      sectionId,
    });
    const res = await http.get(url, true);
    results.push(
      res.ok
        ? pass(9, "List articles in section", "crud")
        : fail(9, "List articles in section", `status ${res.status}`, "crud"),
    );
  }

  // ── Articles ─────────────────────────────────────────────

  // 10. Create article
  const articleCreateEndpoint = findEndpoint(routes, {
    pathKeywords: ["articles"],
    method: "POST",
  });
  if (!articleCreateEndpoint) {
    results.push(fail(10, "Create article", "endpoint not found", "crud"));
  } else {
    const body: Record<string, unknown> = {
      title: "Golden Set Test Article",
      content: "This is a test article for golden set evaluation.",
    };
    if (sectionId) body.section_id = sectionId;
    const res = await http.post(articleCreateEndpoint.url, body, true);
    if (res.ok) {
      articleId = res.body?.id || res.body?.data?.id || null;
      results.push(pass(10, "Create article", "crud"));
    } else {
      results.push(fail(10, "Create article", `status ${res.status}`, "crud"));
    }
  }

  // 11. Get article detail
  const articleGetEndpoint = findEndpoint(routes, {
    pathKeywords: ["articles"],
    method: "GET",
  });
  if (!articleGetEndpoint || !articleId) {
    results.push(
      fail(
        11,
        "Get article detail",
        articleGetEndpoint ? "no articleId" : "endpoint not found",
        "query",
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
        ? pass(11, "Get article detail", "query")
        : fail(11, "Get article detail", `status ${res.status}`, "query"),
    );
  }

  // 12. Edit article
  const articleEditEndpoint = findEndpoint(routes, {
    pathKeywords: ["articles"],
    method: "PATCH",
  });
  if (!articleEditEndpoint || !articleId) {
    results.push(
      fail(
        12,
        "Edit article",
        articleEditEndpoint ? "no articleId" : "endpoint not found",
        "crud",
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
        ? pass(12, "Edit article", "crud")
        : fail(12, "Edit article", `status ${res.status}`, "crud"),
    );
  }

  // 13. Search articles
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
    results.push(fail(13, "Search articles", "endpoint not found", "query"));
  } else {
    const res = await http.get(
      `${searchEndpoint.url}?q=Golden&keyword=Golden`,
      true,
    );
    results.push(
      res.ok
        ? pass(13, "Search articles", "query")
        : fail(13, "Search articles", `status ${res.status}`, "query"),
    );
  }

  // ── Comments ─────────────────────────────────────────────

  // 14. Write comment
  const commentCreateEndpoint = findEndpoint(routes, {
    pathKeywords: ["comments"],
    method: "POST",
  });
  if (!commentCreateEndpoint || !articleId) {
    results.push(
      fail(
        14,
        "Write comment",
        commentCreateEndpoint ? "no articleId" : "endpoint not found",
        "crud",
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
      results.push(pass(14, "Write comment", "crud"));
    } else {
      results.push(fail(14, "Write comment", `status ${res.status}`, "crud"));
    }
  }

  // 15. Edit comment
  const commentEditEndpoint = findEndpoint(routes, {
    pathKeywords: ["comments"],
    method: "PATCH",
  });
  if (!commentEditEndpoint || !articleId || !commentId) {
    results.push(
      fail(
        15,
        "Edit comment",
        !commentEditEndpoint ? "endpoint not found" : "no IDs",
        "crud",
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
        ? pass(15, "Edit comment", "crud")
        : fail(15, "Edit comment", `status ${res.status}`, "crud"),
    );
  }

  // 16. Delete comment
  const commentDeleteEndpoint = findEndpoint(routes, {
    pathKeywords: ["comments"],
    method: "DELETE",
  });
  if (!commentDeleteEndpoint || !articleId || !commentId) {
    results.push(
      fail(
        16,
        "Delete comment",
        !commentDeleteEndpoint ? "endpoint not found" : "no IDs",
        "crud",
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
        ? pass(16, "Delete comment", "crud")
        : fail(16, "Delete comment", `status ${res.status}`, "crud"),
    );
  }

  // 17. Delete article (soft delete)
  const articleDeleteEndpoint = findEndpoint(routes, {
    pathKeywords: ["articles"],
    method: "DELETE",
  });
  if (!articleDeleteEndpoint || !articleId) {
    results.push(
      fail(
        17,
        "Delete article",
        articleDeleteEndpoint ? "no articleId" : "endpoint not found",
        "crud",
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
        ? pass(17, "Delete article", "crud")
        : fail(17, "Delete article", `status ${res.status}`, "crud"),
    );
  }

  // ── Admin ──────────────────────────────────────────────────

  // 18. Submit admin request
  const adminRequestEndpoint = findEndpoint(routes, {
    pathKeywords: ["admin", "request"],
    method: "POST",
  });
  if (!adminRequestEndpoint) {
    results.push(
      fail(18, "Submit admin request", "endpoint not found", "workflow"),
    );
  } else {
    const res = await http.post(
      adminRequestEndpoint.url,
      { reason: "I want to moderate the board" },
      true,
    );
    results.push(
      res.ok
        ? pass(18, "Submit admin request", "workflow")
        : fail(18, "Submit admin request", `status ${res.status}`, "workflow"),
    );
  }

  // 19. List admin requests
  const adminRequestListEndpoint = findEndpoint(routes, {
    pathKeywords: ["admin", "request"],
    method: "GET",
  });
  if (!adminRequestListEndpoint) {
    results.push(
      fail(19, "List admin requests", "endpoint not found", "workflow"),
    );
  } else {
    const res = await http.get(adminRequestListEndpoint.url, true);
    results.push(
      res.ok
        ? pass(19, "List admin requests", "workflow")
        : fail(19, "List admin requests", `status ${res.status}`, "workflow"),
    );
  }

  // 20. Ban user
  const banEndpoint = findEndpoint(routes, {
    pathKeywords: ["ban"],
    method: "POST",
  });
  if (!banEndpoint) {
    results.push(fail(20, "Ban user", "endpoint not found", "workflow"));
  } else {
    // Create a target user to ban
    const banEmail = randomEmail();
    const banPassword = randomPassword();
    if (joinEndpoint) {
      const signupRes = await http.post(joinEndpoint.url, {
        email: banEmail,
        password: banPassword,
        display_name: "Ban Target",
      });
      const targetId = signupRes.body?.id || signupRes.body?.data?.id;
      if (targetId) {
        const url = http.resolvePath(banEndpoint.url, {
          id: targetId,
          userId: targetId,
        });
        const res = await http.post(url, { reason: "Test ban" }, true);
        results.push(
          res.ok
            ? pass(20, "Ban user", "workflow")
            : fail(20, "Ban user", `status ${res.status}`, "workflow"),
        );
      } else {
        results.push(
          fail(20, "Ban user", "could not get target user ID", "workflow"),
        );
      }
    } else {
      results.push(fail(20, "Ban user", "join endpoint missing", "workflow"));
    }
  }

  // 21. List banned users
  const bannedListEndpoint = findEndpoint(routes, {
    pathKeywords: ["banned"],
    method: "GET",
  });
  if (!bannedListEndpoint) {
    results.push(
      fail(21, "List banned users", "endpoint not found", "workflow"),
    );
  } else {
    const res = await http.get(bannedListEndpoint.url, true);
    results.push(
      res.ok
        ? pass(21, "List banned users", "workflow")
        : fail(21, "List banned users", `status ${res.status}`, "workflow"),
    );
  }

  // 22. Delete section
  const sectionDeleteEndpoint = findEndpoint(routes, {
    pathKeywords: ["sections"],
    method: "DELETE",
  });
  if (!sectionDeleteEndpoint || !sectionId) {
    results.push(
      fail(
        22,
        "Delete section",
        sectionDeleteEndpoint ? "no sectionId" : "endpoint not found",
        "workflow",
      ),
    );
  } else {
    const url = http.resolvePath(sectionDeleteEndpoint.url, {
      id: sectionId,
      sectionId,
    });
    const res = await http.delete(url, true);
    results.push(
      res.ok
        ? pass(22, "Delete section", "workflow")
        : fail(22, "Delete section", `status ${res.status}`, "workflow"),
    );
  }

  // 23. User withdrawal
  const withdrawEndpoint = findEndpoint(routes, {
    pathKeywords: ["withdraw", "leave", "secede", "deactivate"],
    method: "DELETE",
  });
  if (!withdrawEndpoint) {
    results.push(fail(23, "User withdrawal", "endpoint not found", "workflow"));
  } else {
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
          ? pass(23, "User withdrawal", "workflow")
          : fail(23, "User withdrawal", `status ${res.status}`, "workflow"),
      );
    } else {
      results.push(
        fail(23, "User withdrawal", "auth endpoints missing", "workflow"),
      );
    }
  }

  // ── Negative Tests ─────────────────────────────────────

  // 24. Unauthenticated article create returns 401
  if (articleCreateEndpoint) {
    const anonHttp = new HttpRunner();
    const res = await anonHttp.post(
      articleCreateEndpoint.url,
      { title: "Should Fail", content: "Anon" },
      false,
    );
    results.push(
      res.status === 401
        ? pass(24, "Unauthenticated article create returns 401", "negative")
        : fail(
            24,
            "Unauthenticated article create returns 401",
            `expected 401 but got ${res.status}`,
            "negative",
          ),
    );
  } else {
    results.push(
      fail(
        24,
        "Unauthenticated article create returns 401",
        "endpoint not found",
        "negative",
      ),
    );
  }

  // 25. Invalid login returns error status
  if (loginEndpoint) {
    const res = await http.post(loginEndpoint.url, {
      email: "nonexistent@invalid.test",
      password: "WrongPassword123!",
    });
    results.push(
      res.status === 401 || res.status === 403 || res.status === 404
        ? pass(25, "Invalid login returns error status", "negative")
        : fail(
            25,
            "Invalid login returns error status",
            `expected 401/403/404 but got ${res.status}`,
            "negative",
          ),
    );
  } else {
    results.push(
      fail(
        25,
        "Invalid login returns error status",
        "endpoint not found",
        "negative",
      ),
    );
  }

  // 26. Get non-existent article returns 404
  {
    const getEndpoint = findEndpoint(routes, {
      pathKeywords: ["articles"],
      method: "GET",
    });
    if (getEndpoint) {
      const fakeId = "00000000-0000-0000-0000-000000000000";
      const url = http.resolvePath(getEndpoint.url, {
        id: fakeId,
        articleId: fakeId,
      });
      const res = await http.get(url, true);
      results.push(
        res.status === 404
          ? pass(26, "Get non-existent article returns 404", "negative")
          : fail(
              26,
              "Get non-existent article returns 404",
              `expected 404 but got ${res.status}`,
              "negative",
            ),
      );
    } else {
      results.push(
        fail(
          26,
          "Get non-existent article returns 404",
          "endpoint not found",
          "negative",
        ),
      );
    }
  }

  return results;
}

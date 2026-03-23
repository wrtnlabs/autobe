import { HttpRunner } from "./http-runner";
import {
  type ScenarioResult,
  fail,
  pass,
  randomEmail,
  randomPassword,
  randomUsername,
} from "./scenario-helpers";
import { type RouteInfo, findEndpoint } from "./url-resolver";

export async function runRedditScenarios(
  routes: RouteInfo[],
  http: HttpRunner,
): Promise<ScenarioResult[]> {
  const results: ScenarioResult[] = [];

  const email = randomEmail();
  const password = randomPassword();
  const username = randomUsername();
  let communityId: string | null = null;
  let postId: string | null = null;
  let commentId: string | null = null;
  let otherUserId: string | null = null;

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
      username,
      display_name: "Reddit User",
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
      { display_name: "Updated Reddit User", bio: "Hello Reddit" },
      true,
    );
    results.push(
      res.ok
        ? pass(5, "Update profile", "auth")
        : fail(5, "Update profile", `status ${res.status}`, "auth"),
    );
  }

  // Create a second user for moderator/ban tests
  const otherEmail = randomEmail();
  const otherPassword = randomPassword();
  const otherHttp = new HttpRunner();
  if (joinEndpoint && loginEndpoint) {
    const signupRes = await http.post(joinEndpoint.url, {
      email: otherEmail,
      password: otherPassword,
      username: randomUsername(),
      display_name: "Other User",
    });
    otherUserId = signupRes.body?.id || signupRes.body?.data?.id || null;
    const otherLogin = await http.post(loginEndpoint.url, {
      email: otherEmail,
      password: otherPassword,
    });
    const otherToken =
      otherLogin.body?.token?.access ||
      otherLogin.body?.access_token ||
      otherLogin.body?.token;
    if (otherToken)
      otherHttp.setToken(
        typeof otherToken === "string"
          ? otherToken
          : otherToken?.access || otherToken,
      );
  }

  // ── Communities ──────────────────────────────────────────

  // 6. Create community
  const communityCreateEndpoint = findEndpoint(routes, {
    pathKeywords: ["communities"],
    method: "POST",
  });
  if (!communityCreateEndpoint) {
    results.push(fail(6, "Create community", "endpoint not found", "crud"));
  } else {
    const res = await http.post(
      communityCreateEndpoint.url,
      {
        name: `golden_test_${Date.now()}`,
        description: "Golden set test community",
      },
      true,
    );
    if (res.ok) {
      communityId = res.body?.id || res.body?.data?.id || null;
      results.push(pass(6, "Create community", "crud"));
    } else {
      results.push(fail(6, "Create community", `status ${res.status}`, "crud"));
    }
  }

  // 7. List communities
  const communityListEndpoint = findEndpoint(routes, {
    pathKeywords: ["communities"],
    method: "GET",
  });
  if (!communityListEndpoint) {
    results.push(fail(7, "List communities", "endpoint not found", "query"));
  } else {
    const res = await http.get(communityListEndpoint.url, true);
    results.push(
      res.ok
        ? pass(7, "List communities", "query")
        : fail(7, "List communities", `status ${res.status}`, "query"),
    );
  }

  // 8. Get community detail
  if (!communityListEndpoint || !communityId) {
    results.push(
      fail(8, "Get community detail", "no communityId or endpoint", "query"),
    );
  } else {
    const url = http.resolvePath(communityListEndpoint.url, {
      id: communityId,
      communityId,
    });
    const res = await http.get(url, true);
    results.push(
      res.ok
        ? pass(8, "Get community detail", "query")
        : fail(8, "Get community detail", `status ${res.status}`, "query"),
    );
  }

  // 9. Subscribe to community
  const subscribeEndpoint = findEndpoint(routes, {
    pathKeywords: ["subscribe", "subscription"],
    method: "POST",
  });
  if (!subscribeEndpoint || !communityId) {
    results.push(
      fail(
        9,
        "Subscribe to community",
        subscribeEndpoint ? "no communityId" : "endpoint not found",
        "crud",
      ),
    );
  } else {
    const url = http.resolvePath(subscribeEndpoint.url, {
      id: communityId,
      communityId,
    });
    const res = await http.post(url, {}, true);
    results.push(
      res.ok
        ? pass(9, "Subscribe to community", "crud")
        : fail(9, "Subscribe to community", `status ${res.status}`, "crud"),
    );
  }

  // 10. Unsubscribe from community
  const unsubscribeEndpoint = findEndpoint(routes, {
    pathKeywords: ["subscribe", "subscription"],
    method: "DELETE",
  });
  if (!unsubscribeEndpoint || !communityId) {
    results.push(
      fail(
        10,
        "Unsubscribe from community",
        unsubscribeEndpoint ? "no communityId" : "endpoint not found",
        "crud",
      ),
    );
  } else {
    const url = http.resolvePath(unsubscribeEndpoint.url, {
      id: communityId,
      communityId,
    });
    const res = await http.delete(url, true);
    // Re-subscribe for later tests
    if (subscribeEndpoint) {
      const resubUrl = http.resolvePath(subscribeEndpoint.url, {
        id: communityId,
        communityId,
      });
      await http.post(resubUrl, {}, true);
    }
    results.push(
      res.ok
        ? pass(10, "Unsubscribe from community", "crud")
        : fail(
            10,
            "Unsubscribe from community",
            `status ${res.status}`,
            "crud",
          ),
    );
  }

  // 11. Add moderator
  const modAddEndpoint = findEndpoint(routes, {
    pathKeywords: ["moderator"],
    method: "POST",
  });
  if (!modAddEndpoint || !communityId || !otherUserId) {
    results.push(
      fail(
        11,
        "Add moderator",
        !modAddEndpoint ? "endpoint not found" : "no IDs",
        "crud",
      ),
    );
  } else {
    const url = http.resolvePath(modAddEndpoint.url, {
      id: communityId,
      communityId,
    });
    const res = await http.post(url, { user_id: otherUserId }, true);
    results.push(
      res.ok
        ? pass(11, "Add moderator", "crud")
        : fail(11, "Add moderator", `status ${res.status}`, "crud"),
    );
  }

  // 12. List moderators
  const modListEndpoint = findEndpoint(routes, {
    pathKeywords: ["moderator"],
    method: "GET",
  });
  if (!modListEndpoint || !communityId) {
    results.push(
      fail(
        12,
        "List moderators",
        modListEndpoint ? "no communityId" : "endpoint not found",
        "query",
      ),
    );
  } else {
    const url = http.resolvePath(modListEndpoint.url, {
      id: communityId,
      communityId,
    });
    const res = await http.get(url, true);
    results.push(
      res.ok
        ? pass(12, "List moderators", "query")
        : fail(12, "List moderators", `status ${res.status}`, "query"),
    );
  }

  // 13. Remove moderator
  const modRemoveEndpoint = findEndpoint(routes, {
    pathKeywords: ["moderator"],
    method: "DELETE",
  });
  if (!modRemoveEndpoint || !communityId || !otherUserId) {
    results.push(
      fail(
        13,
        "Remove moderator",
        !modRemoveEndpoint ? "endpoint not found" : "no IDs",
        "crud",
      ),
    );
  } else {
    const url = http.resolvePath(modRemoveEndpoint.url, {
      id: communityId,
      communityId,
      userId: otherUserId,
    });
    const res = await http.delete(url, true);
    results.push(
      res.ok
        ? pass(13, "Remove moderator", "crud")
        : fail(13, "Remove moderator", `status ${res.status}`, "crud"),
    );
  }

  // 14. Ban user from community
  const banEndpoint = findEndpoint(routes, {
    pathKeywords: ["ban"],
    method: "POST",
  });
  if (!banEndpoint || !communityId || !otherUserId) {
    results.push(
      fail(
        14,
        "Ban user from community",
        !banEndpoint ? "endpoint not found" : "no IDs",
        "crud",
      ),
    );
  } else {
    const url = http.resolvePath(banEndpoint.url, {
      id: communityId,
      communityId,
    });
    const res = await http.post(
      url,
      { user_id: otherUserId, reason: "Test ban" },
      true,
    );
    results.push(
      res.ok
        ? pass(14, "Ban user from community", "crud")
        : fail(14, "Ban user from community", `status ${res.status}`, "crud"),
    );
  }

  // 15. Unban user from community
  const unbanEndpoint = findEndpoint(routes, {
    pathKeywords: ["ban"],
    method: "DELETE",
  });
  if (!unbanEndpoint || !communityId || !otherUserId) {
    results.push(
      fail(
        15,
        "Unban user",
        !unbanEndpoint ? "endpoint not found" : "no IDs",
        "crud",
      ),
    );
  } else {
    const url = http.resolvePath(unbanEndpoint.url, {
      id: communityId,
      communityId,
      userId: otherUserId,
    });
    const res = await http.delete(url, true);
    results.push(
      res.ok
        ? pass(15, "Unban user", "crud")
        : fail(15, "Unban user", `status ${res.status}`, "crud"),
    );
  }

  // ── Posts ────────────────────────────────────────────────

  // 16. Create post
  const postCreateEndpoint = findEndpoint(routes, {
    pathKeywords: ["posts"],
    method: "POST",
  });
  if (!postCreateEndpoint) {
    results.push(fail(16, "Create post", "endpoint not found", "crud"));
  } else {
    const body: Record<string, unknown> = {
      title: "Golden Set Test Post",
      content: "This is a test post for golden set.",
      type: "text",
    };
    if (communityId) body.community_id = communityId;
    const res = await http.post(postCreateEndpoint.url, body, true);
    if (res.ok) {
      postId = res.body?.id || res.body?.data?.id || null;
      results.push(pass(16, "Create post", "crud"));
    } else {
      results.push(fail(16, "Create post", `status ${res.status}`, "crud"));
    }
  }

  // 17. Get post detail
  const postGetEndpoint = findEndpoint(routes, {
    pathKeywords: ["posts"],
    method: "GET",
  });
  if (!postGetEndpoint || !postId) {
    results.push(
      fail(
        17,
        "Get post detail",
        postGetEndpoint ? "no postId" : "endpoint not found",
        "query",
      ),
    );
  } else {
    const url = http.resolvePath(postGetEndpoint.url, { id: postId, postId });
    const res = await http.get(url, true);
    results.push(
      res.ok
        ? pass(17, "Get post detail", "query")
        : fail(17, "Get post detail", `status ${res.status}`, "query"),
    );
  }

  // 18. Community feed
  const communityFeedEndpoint = findEndpoint(routes, {
    pathKeywords: ["posts"],
    mustContain: "community",
    method: "GET",
  });
  if (!communityFeedEndpoint || !communityId) {
    results.push(
      fail(
        18,
        "Community feed",
        communityFeedEndpoint ? "no communityId" : "endpoint not found",
        "query",
      ),
    );
  } else {
    const url = http.resolvePath(communityFeedEndpoint.url, {
      id: communityId,
      communityId,
    });
    const res = await http.get(url, true);
    results.push(
      res.ok
        ? pass(18, "Community feed", "query")
        : fail(18, "Community feed", `status ${res.status}`, "query"),
    );
  }

  // 19. Edit post
  const postEditEndpoint = findEndpoint(routes, {
    pathKeywords: ["posts"],
    method: "PATCH",
  });
  if (!postEditEndpoint || !postId) {
    results.push(
      fail(
        19,
        "Edit post",
        postEditEndpoint ? "no postId" : "endpoint not found",
        "crud",
      ),
    );
  } else {
    const url = http.resolvePath(postEditEndpoint.url, { id: postId, postId });
    const res = await http.patch(url, { title: "Updated Post Title" }, true);
    results.push(
      res.ok
        ? pass(19, "Edit post", "crud")
        : fail(19, "Edit post", `status ${res.status}`, "crud"),
    );
  }

  // 20. Vote on post
  const postVoteEndpoint =
    findEndpoint(routes, {
      pathKeywords: ["votes", "vote"],
      mustContain: "post",
      method: "POST",
    }) || findEndpoint(routes, { pathKeywords: ["votes"], method: "POST" });
  if (!postVoteEndpoint || !postId) {
    results.push(
      fail(
        20,
        "Vote on post",
        postVoteEndpoint ? "no postId" : "endpoint not found",
        "crud",
      ),
    );
  } else {
    const url = http.resolvePath(postVoteEndpoint.url, { id: postId, postId });
    const res = await http.post(url, { value: 1 }, true);
    results.push(
      res.ok
        ? pass(20, "Vote on post", "crud")
        : fail(20, "Vote on post", `status ${res.status}`, "crud"),
    );
  }

  // 21. Remove vote from post
  const postVoteRemoveEndpoint =
    findEndpoint(routes, {
      pathKeywords: ["votes", "vote"],
      mustContain: "post",
      method: "DELETE",
    }) || findEndpoint(routes, { pathKeywords: ["votes"], method: "DELETE" });
  if (!postVoteRemoveEndpoint || !postId) {
    results.push(
      fail(
        21,
        "Remove vote",
        postVoteRemoveEndpoint ? "no postId" : "endpoint not found",
        "crud",
      ),
    );
  } else {
    const url = http.resolvePath(postVoteRemoveEndpoint.url, {
      id: postId,
      postId,
    });
    const res = await http.delete(url, true);
    results.push(
      res.ok
        ? pass(21, "Remove vote", "crud")
        : fail(21, "Remove vote", `status ${res.status}`, "crud"),
    );
  }

  // ── Comments ─────────────────────────────────────────────

  // 22. Write comment on post
  const commentCreateEndpoint = findEndpoint(routes, {
    pathKeywords: ["comments"],
    method: "POST",
  });
  if (!commentCreateEndpoint || !postId) {
    results.push(
      fail(
        22,
        "Write comment",
        commentCreateEndpoint ? "no postId" : "endpoint not found",
        "crud",
      ),
    );
  } else {
    const url = http.resolvePath(commentCreateEndpoint.url, {
      id: postId,
      postId,
    });
    const res = await http.post(
      url,
      { content: "Golden set test comment" },
      true,
    );
    if (res.ok) {
      commentId = res.body?.id || res.body?.data?.id || null;
      results.push(pass(22, "Write comment", "crud"));
    } else {
      results.push(fail(22, "Write comment", `status ${res.status}`, "crud"));
    }
  }

  // 23. Vote on comment
  const commentVoteEndpoint = findEndpoint(routes, {
    pathKeywords: ["votes", "vote"],
    mustContain: "comment",
    method: "POST",
  });
  if (!commentVoteEndpoint || !postId || !commentId) {
    results.push(
      fail(
        23,
        "Vote on comment",
        !commentVoteEndpoint ? "endpoint not found" : "no IDs",
        "crud",
      ),
    );
  } else {
    const url = http.resolvePath(commentVoteEndpoint.url, {
      id: postId,
      postId,
      commentId,
    });
    const res = await http.post(url, { value: 1 }, true);
    results.push(
      res.ok
        ? pass(23, "Vote on comment", "crud")
        : fail(23, "Vote on comment", `status ${res.status}`, "crud"),
    );
  }

  // 24. Edit comment
  const commentEditEndpoint = findEndpoint(routes, {
    pathKeywords: ["comments"],
    method: "PATCH",
  });
  if (!commentEditEndpoint || !postId || !commentId) {
    results.push(
      fail(
        24,
        "Edit comment",
        !commentEditEndpoint ? "endpoint not found" : "no IDs",
        "crud",
      ),
    );
  } else {
    const url = http.resolvePath(commentEditEndpoint.url, {
      id: postId,
      postId,
      commentId,
    });
    const res = await http.patch(url, { content: "Updated comment" }, true);
    results.push(
      res.ok
        ? pass(24, "Edit comment", "crud")
        : fail(24, "Edit comment", `status ${res.status}`, "crud"),
    );
  }

  // 25. Delete comment
  const commentDeleteEndpoint = findEndpoint(routes, {
    pathKeywords: ["comments"],
    method: "DELETE",
  });
  if (!commentDeleteEndpoint || !postId || !commentId) {
    results.push(
      fail(
        25,
        "Delete comment",
        !commentDeleteEndpoint ? "endpoint not found" : "no IDs",
        "crud",
      ),
    );
  } else {
    const url = http.resolvePath(commentDeleteEndpoint.url, {
      id: postId,
      postId,
      commentId,
    });
    const res = await http.delete(url, true);
    results.push(
      res.ok
        ? pass(25, "Delete comment", "crud")
        : fail(25, "Delete comment", `status ${res.status}`, "crud"),
    );
  }

  // ── Feeds ────────────────────────────────────────────────

  // 26. Home feed
  const homeFeedEndpoint = findEndpoint(routes, {
    pathKeywords: ["home", "feed"],
    method: "GET",
  });
  if (!homeFeedEndpoint) {
    results.push(fail(26, "Home feed", "endpoint not found", "query"));
  } else {
    const res = await http.get(homeFeedEndpoint.url, true);
    results.push(
      res.ok
        ? pass(26, "Home feed", "query")
        : fail(26, "Home feed", `status ${res.status}`, "query"),
    );
  }

  // 27. Popular feed
  const popularFeedEndpoint = findEndpoint(routes, {
    pathKeywords: ["popular"],
    method: "GET",
  });
  if (!popularFeedEndpoint) {
    results.push(fail(27, "Popular feed", "endpoint not found", "query"));
  } else {
    const res = await http.get(popularFeedEndpoint.url, true);
    results.push(
      res.ok
        ? pass(27, "Popular feed", "query")
        : fail(27, "Popular feed", `status ${res.status}`, "query"),
    );
  }

  // ── Reports ──────────────────────────────────────────────

  // 28. Report post
  const reportEndpoint = findEndpoint(routes, {
    pathKeywords: ["report"],
    method: "POST",
  });
  if (!reportEndpoint || !postId) {
    results.push(
      fail(
        28,
        "Report post",
        reportEndpoint ? "no postId" : "endpoint not found",
        "workflow",
      ),
    );
  } else {
    const res = await otherHttp.post(
      reportEndpoint.url,
      {
        target_type: "post",
        target_id: postId,
        post_id: postId,
        reason: "Test report",
      },
      true,
    );
    results.push(
      res.ok
        ? pass(28, "Report post", "workflow")
        : fail(28, "Report post", `status ${res.status}`, "workflow"),
    );
  }

  // 29. List reports (moderator)
  const reportListEndpoint = findEndpoint(routes, {
    pathKeywords: ["report"],
    method: "GET",
  });
  if (!reportListEndpoint || !communityId) {
    results.push(
      fail(
        29,
        "List reports",
        reportListEndpoint ? "no communityId" : "endpoint not found",
        "workflow",
      ),
    );
  } else {
    const url = http.resolvePath(reportListEndpoint.url, {
      id: communityId,
      communityId,
    });
    const res = await http.get(url, true);
    results.push(
      res.ok
        ? pass(29, "List reports", "workflow")
        : fail(29, "List reports", `status ${res.status}`, "workflow"),
    );
  }

  // ── Cleanup ──────────────────────────────────────────────

  // 30. Delete post
  const postDeleteEndpoint = findEndpoint(routes, {
    pathKeywords: ["posts"],
    method: "DELETE",
  });
  if (!postDeleteEndpoint || !postId) {
    results.push(
      fail(
        30,
        "Delete post",
        postDeleteEndpoint ? "no postId" : "endpoint not found",
        "cleanup",
      ),
    );
  } else {
    const url = http.resolvePath(postDeleteEndpoint.url, {
      id: postId,
      postId,
    });
    const res = await http.delete(url, true);
    results.push(
      res.ok
        ? pass(30, "Delete post", "cleanup")
        : fail(30, "Delete post", `status ${res.status}`, "cleanup"),
    );
  }

  // 31. User withdrawal
  const withdrawEndpoint = findEndpoint(routes, {
    pathKeywords: ["withdraw", "leave", "secede", "deactivate"],
    method: "DELETE",
  });
  if (!withdrawEndpoint) {
    results.push(fail(31, "User withdrawal", "endpoint not found", "cleanup"));
  } else {
    const wEmail = randomEmail();
    const wPassword = randomPassword();
    if (joinEndpoint && loginEndpoint) {
      await http.post(joinEndpoint.url, {
        email: wEmail,
        password: wPassword,
        username: randomUsername(),
        display_name: "Withdraw",
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
          ? pass(31, "User withdrawal", "cleanup")
          : fail(31, "User withdrawal", `status ${res.status}`, "cleanup"),
      );
    } else {
      results.push(
        fail(31, "User withdrawal", "auth endpoints missing", "cleanup"),
      );
    }
  }

  // ── Negative Tests ─────────────────────────────────────

  // 32. Unauthenticated post create returns 401
  if (postCreateEndpoint) {
    const anonHttp = new HttpRunner();
    const res = await anonHttp.post(
      postCreateEndpoint.url,
      { title: "Should Fail", content: "Anon" },
      false,
    );
    results.push(
      res.status === 401
        ? pass(32, "Unauthenticated post create returns 401", "negative")
        : fail(
            32,
            "Unauthenticated post create returns 401",
            `expected 401 but got ${res.status}`,
            "negative",
          ),
    );
  } else {
    results.push(
      fail(
        32,
        "Unauthenticated post create returns 401",
        "endpoint not found",
        "negative",
      ),
    );
  }

  // 33. Invalid login returns error status
  if (loginEndpoint) {
    const res = await http.post(loginEndpoint.url, {
      email: "nonexistent@invalid.test",
      password: "WrongPassword123!",
    });
    results.push(
      res.status === 401 || res.status === 403 || res.status === 404
        ? pass(33, "Invalid login returns error status", "negative")
        : fail(
            33,
            "Invalid login returns error status",
            `expected 401/403/404 but got ${res.status}`,
            "negative",
          ),
    );
  } else {
    results.push(
      fail(
        33,
        "Invalid login returns error status",
        "endpoint not found",
        "negative",
      ),
    );
  }

  // 34. Get non-existent post returns 404
  {
    const postGetEndpoint = findEndpoint(routes, {
      pathKeywords: ["posts"],
      method: "GET",
    });
    if (postGetEndpoint) {
      const fakeId = "00000000-0000-0000-0000-000000000000";
      const url = http.resolvePath(postGetEndpoint.url, {
        id: fakeId,
        postId: fakeId,
      });
      const res = await http.get(url, true);
      results.push(
        res.status === 404
          ? pass(34, "Get non-existent post returns 404", "negative")
          : fail(
              34,
              "Get non-existent post returns 404",
              `expected 404 but got ${res.status}`,
              "negative",
            ),
      );
    } else {
      results.push(
        fail(
          34,
          "Get non-existent post returns 404",
          "endpoint not found",
          "negative",
        ),
      );
    }
  }

  return results;
}

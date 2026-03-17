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
    results.push(fail(1, "User signup", "endpoint not found"));
  } else {
    const res = await http.post(joinEndpoint.url, {
      email,
      password,
      username,
      display_name: "Reddit User",
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
    results.push(fail(3, "Change password", "endpoint not found"));
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
        ? pass(3, "Change password")
        : fail(3, "Change password", `status ${res.status}`),
    );
  }

  // 4. Get user profile
  const profileGetEndpoint = findEndpoint(routes, {
    pathKeywords: ["profile"],
    method: "GET",
  });
  if (!profileGetEndpoint) {
    results.push(fail(4, "Get user profile", "endpoint not found"));
  } else {
    const res = await http.get(profileGetEndpoint.url, true);
    results.push(
      res.ok
        ? pass(4, "Get user profile")
        : fail(4, "Get user profile", `status ${res.status}`),
    );
  }

  // 5. Update profile
  const profileEndpoint =
    findEndpoint(routes, { pathKeywords: ["profile"], method: "PATCH" }) ||
    findEndpoint(routes, { pathKeywords: ["profile"], method: "PUT" });
  if (!profileEndpoint) {
    results.push(fail(5, "Update profile", "endpoint not found"));
  } else {
    const res = await http.patch(
      profileEndpoint.url,
      { display_name: "Updated Reddit User", bio: "Hello Reddit" },
      true,
    );
    results.push(
      res.ok
        ? pass(5, "Update profile")
        : fail(5, "Update profile", `status ${res.status}`),
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
    results.push(fail(6, "Create community", "endpoint not found"));
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
      results.push(pass(6, "Create community"));
    } else {
      results.push(fail(6, "Create community", `status ${res.status}`));
    }
  }

  // 7. List communities
  const communityListEndpoint = findEndpoint(routes, {
    pathKeywords: ["communities"],
    method: "GET",
  });
  if (!communityListEndpoint) {
    results.push(fail(7, "List communities", "endpoint not found"));
  } else {
    const res = await http.get(communityListEndpoint.url, true);
    results.push(
      res.ok
        ? pass(7, "List communities")
        : fail(7, "List communities", `status ${res.status}`),
    );
  }

  // 8. Get community detail
  if (!communityListEndpoint || !communityId) {
    results.push(fail(8, "Get community detail", "no communityId or endpoint"));
  } else {
    const url = http.resolvePath(communityListEndpoint.url, {
      id: communityId,
      communityId,
    });
    const res = await http.get(url, true);
    results.push(
      res.ok
        ? pass(8, "Get community detail")
        : fail(8, "Get community detail", `status ${res.status}`),
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
        ? pass(9, "Subscribe to community")
        : fail(9, "Subscribe to community", `status ${res.status}`),
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
        ? pass(10, "Unsubscribe from community")
        : fail(10, "Unsubscribe from community", `status ${res.status}`),
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
        ? pass(11, "Add moderator")
        : fail(11, "Add moderator", `status ${res.status}`),
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
        ? pass(12, "List moderators")
        : fail(12, "List moderators", `status ${res.status}`),
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
        ? pass(13, "Remove moderator")
        : fail(13, "Remove moderator", `status ${res.status}`),
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
        ? pass(14, "Ban user from community")
        : fail(14, "Ban user from community", `status ${res.status}`),
    );
  }

  // 15. Unban user from community
  const unbanEndpoint = findEndpoint(routes, {
    pathKeywords: ["ban"],
    method: "DELETE",
  });
  if (!unbanEndpoint || !communityId || !otherUserId) {
    results.push(
      fail(15, "Unban user", !unbanEndpoint ? "endpoint not found" : "no IDs"),
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
        ? pass(15, "Unban user")
        : fail(15, "Unban user", `status ${res.status}`),
    );
  }

  // ── Posts ────────────────────────────────────────────────

  // 16. Create post
  const postCreateEndpoint = findEndpoint(routes, {
    pathKeywords: ["posts"],
    method: "POST",
  });
  if (!postCreateEndpoint) {
    results.push(fail(16, "Create post", "endpoint not found"));
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
      results.push(pass(16, "Create post"));
    } else {
      results.push(fail(16, "Create post", `status ${res.status}`));
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
      ),
    );
  } else {
    const url = http.resolvePath(postGetEndpoint.url, { id: postId, postId });
    const res = await http.get(url, true);
    results.push(
      res.ok
        ? pass(17, "Get post detail")
        : fail(17, "Get post detail", `status ${res.status}`),
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
        ? pass(18, "Community feed")
        : fail(18, "Community feed", `status ${res.status}`),
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
      ),
    );
  } else {
    const url = http.resolvePath(postEditEndpoint.url, { id: postId, postId });
    const res = await http.patch(url, { title: "Updated Post Title" }, true);
    results.push(
      res.ok
        ? pass(19, "Edit post")
        : fail(19, "Edit post", `status ${res.status}`),
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
      ),
    );
  } else {
    const url = http.resolvePath(postVoteEndpoint.url, { id: postId, postId });
    const res = await http.post(url, { value: 1 }, true);
    results.push(
      res.ok
        ? pass(20, "Vote on post")
        : fail(20, "Vote on post", `status ${res.status}`),
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
        ? pass(21, "Remove vote")
        : fail(21, "Remove vote", `status ${res.status}`),
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
      results.push(pass(22, "Write comment"));
    } else {
      results.push(fail(22, "Write comment", `status ${res.status}`));
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
        ? pass(23, "Vote on comment")
        : fail(23, "Vote on comment", `status ${res.status}`),
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
        ? pass(24, "Edit comment")
        : fail(24, "Edit comment", `status ${res.status}`),
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
        ? pass(25, "Delete comment")
        : fail(25, "Delete comment", `status ${res.status}`),
    );
  }

  // ── Feeds ────────────────────────────────────────────────

  // 26. Home feed
  const homeFeedEndpoint = findEndpoint(routes, {
    pathKeywords: ["home", "feed"],
    method: "GET",
  });
  if (!homeFeedEndpoint) {
    results.push(fail(26, "Home feed", "endpoint not found"));
  } else {
    const res = await http.get(homeFeedEndpoint.url, true);
    results.push(
      res.ok
        ? pass(26, "Home feed")
        : fail(26, "Home feed", `status ${res.status}`),
    );
  }

  // 27. Popular feed
  const popularFeedEndpoint = findEndpoint(routes, {
    pathKeywords: ["popular"],
    method: "GET",
  });
  if (!popularFeedEndpoint) {
    results.push(fail(27, "Popular feed", "endpoint not found"));
  } else {
    const res = await http.get(popularFeedEndpoint.url, true);
    results.push(
      res.ok
        ? pass(27, "Popular feed")
        : fail(27, "Popular feed", `status ${res.status}`),
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
        ? pass(28, "Report post")
        : fail(28, "Report post", `status ${res.status}`),
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
        ? pass(29, "List reports")
        : fail(29, "List reports", `status ${res.status}`),
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
        ? pass(30, "Delete post")
        : fail(30, "Delete post", `status ${res.status}`),
    );
  }

  // 31. User withdrawal
  const withdrawEndpoint = findEndpoint(routes, {
    pathKeywords: ["withdraw", "leave", "secede", "deactivate"],
    method: "DELETE",
  });
  if (!withdrawEndpoint) {
    results.push(fail(31, "User withdrawal", "endpoint not found"));
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
          ? pass(31, "User withdrawal")
          : fail(31, "User withdrawal", `status ${res.status}`),
      );
    } else {
      results.push(fail(31, "User withdrawal", "auth endpoints missing"));
    }
  }

  return results;
}

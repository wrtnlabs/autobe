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

  // 3. Update profile
  const profileEndpoint =
    findEndpoint(routes, { pathKeywords: ["profile"], method: "PATCH" }) ||
    findEndpoint(routes, { pathKeywords: ["profile"], method: "PUT" });
  if (!profileEndpoint) {
    results.push(fail(3, "Update profile", "endpoint not found"));
  } else {
    const res = await http.patch(
      profileEndpoint.url,
      { display_name: "Updated Reddit User", bio: "Hello Reddit" },
      true,
    );
    results.push(
      res.ok
        ? pass(3, "Update profile")
        : fail(3, "Update profile", `status ${res.status}`),
    );
  }

  // ── Communities ──────────────────────────────────────────

  // 4. Create community
  const communityCreateEndpoint = findEndpoint(routes, {
    pathKeywords: ["communities"],
    method: "POST",
  });
  if (!communityCreateEndpoint) {
    results.push(fail(4, "Create community", "endpoint not found"));
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
      results.push(pass(4, "Create community"));
    } else {
      results.push(fail(4, "Create community", `status ${res.status}`));
    }
  }

  // 5. List communities
  const communityListEndpoint = findEndpoint(routes, {
    pathKeywords: ["communities"],
    method: "GET",
  });
  if (!communityListEndpoint) {
    results.push(fail(5, "List communities", "endpoint not found"));
  } else {
    const res = await http.get(communityListEndpoint.url, true);
    results.push(
      res.ok
        ? pass(5, "List communities")
        : fail(5, "List communities", `status ${res.status}`),
    );
  }

  // 6. Subscribe to community
  const subscribeEndpoint = findEndpoint(routes, {
    pathKeywords: ["subscribe", "subscription"],
    method: "POST",
  });
  if (!subscribeEndpoint || !communityId) {
    results.push(
      fail(
        6,
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
        ? pass(6, "Subscribe to community")
        : fail(6, "Subscribe to community", `status ${res.status}`),
    );
  }

  // 7. Unsubscribe from community
  const unsubscribeEndpoint = findEndpoint(routes, {
    pathKeywords: ["subscribe", "subscription"],
    method: "DELETE",
  });
  if (!unsubscribeEndpoint || !communityId) {
    results.push(
      fail(
        7,
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
        ? pass(7, "Unsubscribe from community")
        : fail(7, "Unsubscribe from community", `status ${res.status}`),
    );
  }

  // ── Posts ────────────────────────────────────────────────

  // 8. Create post
  const postCreateEndpoint = findEndpoint(routes, {
    pathKeywords: ["posts"],
    method: "POST",
  });
  if (!postCreateEndpoint) {
    results.push(fail(8, "Create post", "endpoint not found"));
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
      results.push(pass(8, "Create post"));
    } else {
      results.push(fail(8, "Create post", `status ${res.status}`));
    }
  }

  // 9. Get post detail
  const postGetEndpoint = findEndpoint(routes, {
    pathKeywords: ["posts"],
    method: "GET",
  });
  if (!postGetEndpoint || !postId) {
    results.push(
      fail(
        9,
        "Get post detail",
        postGetEndpoint ? "no postId" : "endpoint not found",
      ),
    );
  } else {
    const url = http.resolvePath(postGetEndpoint.url, { id: postId, postId });
    const res = await http.get(url, true);
    results.push(
      res.ok
        ? pass(9, "Get post detail")
        : fail(9, "Get post detail", `status ${res.status}`),
    );
  }

  // 10. Edit post
  const postEditEndpoint = findEndpoint(routes, {
    pathKeywords: ["posts"],
    method: "PATCH",
  });
  if (!postEditEndpoint || !postId) {
    results.push(
      fail(
        10,
        "Edit post",
        postEditEndpoint ? "no postId" : "endpoint not found",
      ),
    );
  } else {
    const url = http.resolvePath(postEditEndpoint.url, { id: postId, postId });
    const res = await http.patch(url, { title: "Updated Post Title" }, true);
    results.push(
      res.ok
        ? pass(10, "Edit post")
        : fail(10, "Edit post", `status ${res.status}`),
    );
  }

  // 11. Vote on post
  const postVoteEndpoint =
    findEndpoint(routes, {
      pathKeywords: ["votes", "vote"],
      mustContain: "post",
      method: "POST",
    }) || findEndpoint(routes, { pathKeywords: ["votes"], method: "POST" });
  if (!postVoteEndpoint || !postId) {
    results.push(
      fail(
        11,
        "Vote on post",
        postVoteEndpoint ? "no postId" : "endpoint not found",
      ),
    );
  } else {
    const url = http.resolvePath(postVoteEndpoint.url, { id: postId, postId });
    const res = await http.post(url, { value: 1 }, true);
    results.push(
      res.ok
        ? pass(11, "Vote on post")
        : fail(11, "Vote on post", `status ${res.status}`),
    );
  }

  // ── Comments ─────────────────────────────────────────────

  // 12. Write comment on post
  const commentCreateEndpoint = findEndpoint(routes, {
    pathKeywords: ["comments"],
    method: "POST",
  });
  if (!commentCreateEndpoint || !postId) {
    results.push(
      fail(
        12,
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
      results.push(pass(12, "Write comment"));
    } else {
      results.push(fail(12, "Write comment", `status ${res.status}`));
    }
  }

  // 13. Edit comment
  const commentEditEndpoint = findEndpoint(routes, {
    pathKeywords: ["comments"],
    method: "PATCH",
  });
  if (!commentEditEndpoint || !postId || !commentId) {
    results.push(
      fail(
        13,
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
        ? pass(13, "Edit comment")
        : fail(13, "Edit comment", `status ${res.status}`),
    );
  }

  // 14. Delete comment
  const commentDeleteEndpoint = findEndpoint(routes, {
    pathKeywords: ["comments"],
    method: "DELETE",
  });
  if (!commentDeleteEndpoint || !postId || !commentId) {
    results.push(
      fail(
        14,
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
        ? pass(14, "Delete comment")
        : fail(14, "Delete comment", `status ${res.status}`),
    );
  }

  // ── Feeds ────────────────────────────────────────────────

  // 15. Home feed
  const homeFeedEndpoint = findEndpoint(routes, {
    pathKeywords: ["home", "feed"],
    method: "GET",
  });
  if (!homeFeedEndpoint) {
    results.push(fail(15, "Home feed", "endpoint not found"));
  } else {
    const res = await http.get(homeFeedEndpoint.url, true);
    results.push(
      res.ok
        ? pass(15, "Home feed")
        : fail(15, "Home feed", `status ${res.status}`),
    );
  }

  // 16. Popular feed
  const popularFeedEndpoint = findEndpoint(routes, {
    pathKeywords: ["popular"],
    method: "GET",
  });
  if (!popularFeedEndpoint) {
    results.push(fail(16, "Popular feed", "endpoint not found"));
  } else {
    const res = await http.get(popularFeedEndpoint.url, true);
    results.push(
      res.ok
        ? pass(16, "Popular feed")
        : fail(16, "Popular feed", `status ${res.status}`),
    );
  }

  // 17. Delete post
  const postDeleteEndpoint = findEndpoint(routes, {
    pathKeywords: ["posts"],
    method: "DELETE",
  });
  if (!postDeleteEndpoint || !postId) {
    results.push(
      fail(
        17,
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
        ? pass(17, "Delete post")
        : fail(17, "Delete post", `status ${res.status}`),
    );
  }

  // 18. User withdrawal
  const withdrawEndpoint = findEndpoint(routes, {
    pathKeywords: ["withdraw", "leave", "secede", "deactivate"],
    method: "DELETE",
  });
  if (!withdrawEndpoint) {
    results.push(fail(18, "User withdrawal", "endpoint not found"));
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
          ? pass(18, "User withdrawal")
          : fail(18, "User withdrawal", `status ${res.status}`),
      );
    } else {
      results.push(fail(18, "User withdrawal", "auth endpoints missing"));
    }
  }

  return results;
}

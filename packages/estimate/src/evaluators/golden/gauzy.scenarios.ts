import { HttpRunner } from "./http-runner";
import {
  type ScenarioResult,
  fail,
  pass,
  randomEmail,
  randomPassword,
} from "./scenario-helpers";
import { type RouteInfo, findEndpoint } from "./url-resolver";

export async function runGauzyScenarios(
  routes: RouteInfo[],
  http: HttpRunner,
): Promise<ScenarioResult[]> {
  const results: ScenarioResult[] = [];

  const ownerEmail = randomEmail();
  const ownerPassword = randomPassword();
  let orgId: string | null = null;
  let employeeId: string | null = null;
  let projectId: string | null = null;
  let taskId: string | null = null;
  let contractId: string | null = null;
  let timelogId: string | null = null;
  let timesheetId: string | null = null;

  // ── Auth & Organization ─────────────────────────────────

  // 1. Owner signup
  const joinEndpoint = findEndpoint(routes, {
    pathKeywords: ["join", "signup", "register"],
    method: "POST",
  });
  if (!joinEndpoint) {
    results.push(fail(1, "Owner signup", "endpoint not found"));
  } else {
    const res = await http.post(joinEndpoint.url, {
      email: ownerEmail,
      password: ownerPassword,
      display_name: "Gauzy Owner",
    });
    results.push(
      res.ok
        ? pass(1, "Owner signup")
        : fail(1, "Owner signup", `status ${res.status}`),
    );
  }

  // 2. Owner login
  const loginEndpoint = findEndpoint(routes, {
    pathKeywords: ["login"],
    method: "POST",
  });
  if (!loginEndpoint) {
    results.push(fail(2, "Owner login", "endpoint not found"));
  } else {
    const res = await http.post(loginEndpoint.url, {
      email: ownerEmail,
      password: ownerPassword,
    });
    if (res.ok) {
      const token =
        res.body?.token?.access || res.body?.access_token || res.body?.token;
      const tokenStr =
        typeof token === "string" ? token : token?.access || token;
      if (tokenStr) {
        http.setToken(tokenStr);
        results.push(pass(2, "Owner login"));
      } else {
        results.push(fail(2, "Owner login", "no token in response"));
      }
    } else {
      results.push(fail(2, "Owner login", `status ${res.status}`));
    }
  }

  // 3. Create organization
  const orgCreateEndpoint = findEndpoint(routes, {
    pathKeywords: ["organizations", "orgs"],
    method: "POST",
  });
  if (!orgCreateEndpoint) {
    results.push(fail(3, "Create organization", "endpoint not found"));
  } else {
    const res = await http.post(
      orgCreateEndpoint.url,
      {
        name: "Gauzy Test Corp",
        description: "Golden set test organization",
        currency: "USD",
        timezone: "UTC",
      },
      true,
    );
    if (res.ok) {
      orgId = res.body?.id || res.body?.data?.id || null;
      results.push(pass(3, "Create organization"));
    } else {
      results.push(fail(3, "Create organization", `status ${res.status}`));
    }
  }

  // 4. Get organization detail
  const orgGetEndpoint = findEndpoint(routes, {
    pathKeywords: ["organizations", "orgs"],
    method: "GET",
  });
  if (!orgGetEndpoint || !orgId) {
    results.push(
      fail(4, "Get organization detail", orgGetEndpoint ? "no orgId" : "endpoint not found"),
    );
  } else {
    const url = http.resolvePath(orgGetEndpoint.url, { id: orgId, organizationId: orgId });
    const res = await http.get(url, true);
    results.push(
      res.ok
        ? pass(4, "Get organization detail")
        : fail(4, "Get organization detail", `status ${res.status}`),
    );
  }

  // 5. Update organization settings
  const orgUpdateEndpoint = findEndpoint(routes, {
    pathKeywords: ["organizations", "orgs"],
    method: "PATCH",
  });
  if (!orgUpdateEndpoint || !orgId) {
    results.push(
      fail(5, "Update organization settings", "endpoint or orgId not found"),
    );
  } else {
    const url = http.resolvePath(orgUpdateEndpoint.url, { id: orgId, organizationId: orgId });
    const res = await http.patch(url, { name: "Gauzy Corp Updated" }, true);
    results.push(
      res.ok
        ? pass(5, "Update organization settings")
        : fail(5, "Update organization settings", `status ${res.status}`),
    );
  }

  // ── Employee Management ─────────────────────────────────

  // 6. Invite employee
  const employeeInviteEndpoint =
    findEndpoint(routes, {
      pathKeywords: ["employees", "invite"],
      method: "POST",
    }) ||
    findEndpoint(routes, { pathKeywords: ["employees"], method: "POST" });
  if (!employeeInviteEndpoint) {
    results.push(fail(6, "Invite employee", "endpoint not found"));
  } else {
    const res = await http.post(
      employeeInviteEndpoint.url,
      {
        email: randomEmail(),
        display_name: "Test Employee",
        position: "Developer",
        employment_type: "full-time",
        department: "Engineering",
      },
      true,
    );
    if (res.ok) {
      employeeId = res.body?.id || res.body?.data?.id || null;
      results.push(pass(6, "Invite employee"));
    } else {
      results.push(fail(6, "Invite employee", `status ${res.status}`));
    }
  }

  // 7. List employees
  const employeeListEndpoint =
    findEndpoint(routes, { pathKeywords: ["employees"], method: "GET" }) ||
    findEndpoint(routes, { pathKeywords: ["employees"], method: "PATCH" });
  if (!employeeListEndpoint) {
    results.push(fail(7, "List employees", "endpoint not found"));
  } else {
    const res =
      employeeListEndpoint.method === "PATCH"
        ? await http.patch(employeeListEndpoint.url, { page: 1 }, true)
        : await http.get(employeeListEndpoint.url, true);
    results.push(
      res.ok
        ? pass(7, "List employees")
        : fail(7, "List employees", `status ${res.status}`),
    );
  }

  // 8. Deactivate employee
  if (employeeId) {
    const deactivateEndpoint =
      findEndpoint(routes, {
        pathKeywords: ["employees", "deactivate"],
        method: "PATCH",
      }) ||
      findEndpoint(routes, {
        pathKeywords: ["employees"],
        method: "DELETE",
      });
    if (!deactivateEndpoint) {
      results.push(fail(8, "Deactivate employee", "endpoint not found"));
    } else {
      const url = http.resolvePath(deactivateEndpoint.url, {
        id: employeeId,
        employeeId,
      });
      const res =
        deactivateEndpoint.method === "DELETE"
          ? await http.delete(url, true)
          : await http.patch(url, { active: false }, true);
      results.push(
        res.ok
          ? pass(8, "Deactivate employee")
          : fail(8, "Deactivate employee", `status ${res.status}`),
      );
    }
  } else {
    results.push(fail(8, "Deactivate employee", "no employeeId"));
  }

  // Re-invite for subsequent tests
  if (employeeInviteEndpoint) {
    const res = await http.post(
      employeeInviteEndpoint.url,
      {
        email: randomEmail(),
        display_name: "Active Employee",
        position: "Engineer",
        employment_type: "full-time",
      },
      true,
    );
    if (res.ok) {
      employeeId = res.body?.id || res.body?.data?.id || null;
    }
  }

  // ── Employee Contracts ──────────────────────────────────

  // 9. Create employee contract
  const contractCreateEndpoint = findEndpoint(routes, {
    pathKeywords: ["contracts"],
    method: "POST",
  });
  if (!contractCreateEndpoint || !employeeId) {
    results.push(
      fail(9, "Create employee contract", "endpoint or employeeId not found"),
    );
  } else {
    const url = http.resolvePath(contractCreateEndpoint.url, {
      employeeId,
      id: employeeId,
    });
    const res = await http.post(
      url,
      {
        employee_id: employeeId,
        start_date: "2026-01-01",
        pay_rate: 5000,
        pay_period: "monthly",
        working_hours_per_week: 40,
      },
      true,
    );
    if (res.ok) {
      contractId = res.body?.id || res.body?.data?.id || null;
      results.push(pass(9, "Create employee contract"));
    } else {
      results.push(fail(9, "Create employee contract", `status ${res.status}`));
    }
  }

  // 10. List employee contracts
  const contractListEndpoint = findEndpoint(routes, {
    pathKeywords: ["contracts"],
    method: "GET",
  });
  if (!contractListEndpoint) {
    results.push(fail(10, "List employee contracts", "endpoint not found"));
  } else {
    const res = await http.get(contractListEndpoint.url, true);
    results.push(
      res.ok
        ? pass(10, "List employee contracts")
        : fail(10, "List employee contracts", `status ${res.status}`),
    );
  }

  // ── Projects & Tasks ────────────────────────────────────

  // 11. Create project
  const projectCreateEndpoint = findEndpoint(routes, {
    pathKeywords: ["projects"],
    method: "POST",
  });
  if (!projectCreateEndpoint) {
    results.push(fail(11, "Create project", "endpoint not found"));
  } else {
    const res = await http.post(
      projectCreateEndpoint.url,
      {
        name: "Golden Set Project",
        description: "Test project for E2E",
        status: "active",
        budget_hours: 100,
      },
      true,
    );
    if (res.ok) {
      projectId = res.body?.id || res.body?.data?.id || null;
      results.push(pass(11, "Create project"));
    } else {
      results.push(fail(11, "Create project", `status ${res.status}`));
    }
  }

  // 12. List projects
  const projectListEndpoint =
    findEndpoint(routes, { pathKeywords: ["projects"], method: "GET" }) ||
    findEndpoint(routes, { pathKeywords: ["projects"], method: "PATCH" });
  if (!projectListEndpoint) {
    results.push(fail(12, "List projects", "endpoint not found"));
  } else {
    const res =
      projectListEndpoint.method === "PATCH"
        ? await http.patch(projectListEndpoint.url, {}, true)
        : await http.get(projectListEndpoint.url, true);
    results.push(
      res.ok
        ? pass(12, "List projects")
        : fail(12, "List projects", `status ${res.status}`),
    );
  }

  // 13. Edit project
  const projectEditEndpoint = findEndpoint(routes, {
    pathKeywords: ["projects"],
    method: "PATCH",
  });
  if (!projectEditEndpoint || !projectId) {
    results.push(fail(13, "Edit project", "endpoint or projectId not found"));
  } else {
    const url = http.resolvePath(projectEditEndpoint.url, {
      id: projectId,
      projectId,
    });
    const res = await http.patch(url, { name: "Updated Project" }, true);
    results.push(
      res.ok
        ? pass(13, "Edit project")
        : fail(13, "Edit project", `status ${res.status}`),
    );
  }

  // 14. Create task
  const taskCreateEndpoint = findEndpoint(routes, {
    pathKeywords: ["tasks"],
    method: "POST",
  });
  if (!taskCreateEndpoint || !projectId) {
    results.push(fail(14, "Create task", "endpoint or projectId not found"));
  } else {
    const res = await http.post(
      taskCreateEndpoint.url,
      {
        title: "Test Task",
        project_id: projectId,
        status: "open",
        priority: "medium",
      },
      true,
    );
    if (res.ok) {
      taskId = res.body?.id || res.body?.data?.id || null;
      results.push(pass(14, "Create task"));
    } else {
      results.push(fail(14, "Create task", `status ${res.status}`));
    }
  }

  // 15. List tasks
  const taskListEndpoint =
    findEndpoint(routes, { pathKeywords: ["tasks"], method: "GET" }) ||
    findEndpoint(routes, { pathKeywords: ["tasks"], method: "PATCH" });
  if (!taskListEndpoint) {
    results.push(fail(15, "List tasks", "endpoint not found"));
  } else {
    const res =
      taskListEndpoint.method === "PATCH"
        ? await http.patch(taskListEndpoint.url, {}, true)
        : await http.get(taskListEndpoint.url, true);
    results.push(
      res.ok
        ? pass(15, "List tasks")
        : fail(15, "List tasks", `status ${res.status}`),
    );
  }

  // 16. Update task status
  if (taskId && taskCreateEndpoint) {
    const taskUpdateEndpoint = findEndpoint(routes, {
      pathKeywords: ["tasks"],
      method: "PATCH",
    });
    if (!taskUpdateEndpoint) {
      results.push(fail(16, "Update task status", "endpoint not found"));
    } else {
      const url = http.resolvePath(taskUpdateEndpoint.url, {
        id: taskId,
        taskId,
      });
      const res = await http.patch(url, { status: "in-progress" }, true);
      results.push(
        res.ok
          ? pass(16, "Update task status")
          : fail(16, "Update task status", `status ${res.status}`),
      );
    }
  } else {
    results.push(fail(16, "Update task status", "no taskId"));
  }

  // ── Time Tracking ───────────────────────────────────────

  // 17. Create timelog
  const timelogCreateEndpoint = findEndpoint(routes, {
    pathKeywords: ["timelogs", "time-logs"],
    method: "POST",
  });
  if (!timelogCreateEndpoint) {
    results.push(fail(17, "Create timelog", "endpoint not found"));
  } else {
    const res = await http.post(
      timelogCreateEndpoint.url,
      {
        date: "2026-03-15",
        duration: 120,
        project_id: projectId,
        task_id: taskId,
        description: "Golden set test timelog",
        billable: true,
      },
      true,
    );
    if (res.ok) {
      timelogId = res.body?.id || res.body?.data?.id || null;
      results.push(pass(17, "Create timelog"));
    } else {
      results.push(fail(17, "Create timelog", `status ${res.status}`));
    }
  }

  // 18. List timelogs
  const timelogListEndpoint =
    findEndpoint(routes, {
      pathKeywords: ["timelogs", "time-logs"],
      method: "GET",
    }) ||
    findEndpoint(routes, {
      pathKeywords: ["timelogs", "time-logs"],
      method: "PATCH",
    });
  if (!timelogListEndpoint) {
    results.push(fail(18, "List timelogs", "endpoint not found"));
  } else {
    const res =
      timelogListEndpoint.method === "PATCH"
        ? await http.patch(timelogListEndpoint.url, {}, true)
        : await http.get(timelogListEndpoint.url, true);
    results.push(
      res.ok
        ? pass(18, "List timelogs")
        : fail(18, "List timelogs", `status ${res.status}`),
    );
  }

  // 19. Submit timesheet
  const timesheetCreateEndpoint = findEndpoint(routes, {
    pathKeywords: ["timesheets"],
    method: "POST",
  });
  if (!timesheetCreateEndpoint) {
    results.push(fail(19, "Submit timesheet", "endpoint not found"));
  } else {
    const res = await http.post(
      timesheetCreateEndpoint.url,
      {
        week_start: "2026-03-09",
        status: "submitted",
      },
      true,
    );
    if (res.ok) {
      timesheetId = res.body?.id || res.body?.data?.id || null;
      results.push(pass(19, "Submit timesheet"));
    } else {
      results.push(fail(19, "Submit timesheet", `status ${res.status}`));
    }
  }

  // 20. List timesheets
  const timesheetListEndpoint =
    findEndpoint(routes, { pathKeywords: ["timesheets"], method: "GET" }) ||
    findEndpoint(routes, { pathKeywords: ["timesheets"], method: "PATCH" });
  if (!timesheetListEndpoint) {
    results.push(fail(20, "List timesheets", "endpoint not found"));
  } else {
    const res =
      timesheetListEndpoint.method === "PATCH"
        ? await http.patch(timesheetListEndpoint.url, {}, true)
        : await http.get(timesheetListEndpoint.url, true);
    results.push(
      res.ok
        ? pass(20, "List timesheets")
        : fail(20, "List timesheets", `status ${res.status}`),
    );
  }

  // 21. Approve timesheet
  if (timesheetId) {
    const approveEndpoint =
      findEndpoint(routes, {
        pathKeywords: ["timesheets", "approve"],
        method: "POST",
      }) ||
      findEndpoint(routes, {
        pathKeywords: ["timesheets", "approve"],
        method: "PATCH",
      }) ||
      findEndpoint(routes, { pathKeywords: ["timesheets"], method: "PATCH" });
    if (!approveEndpoint) {
      results.push(fail(21, "Approve timesheet", "endpoint not found"));
    } else {
      const url = http.resolvePath(approveEndpoint.url, {
        id: timesheetId,
        timesheetId,
      });
      const res = await http.patch(url, { status: "approved" }, true);
      results.push(
        res.ok
          ? pass(21, "Approve timesheet")
          : fail(21, "Approve timesheet", `status ${res.status}`),
      );
    }
  } else {
    results.push(fail(21, "Approve timesheet", "no timesheetId"));
  }

  // ── Timer ───────────────────────────────────────────────

  // 22. Start timer
  const timerStartEndpoint =
    findEndpoint(routes, {
      pathKeywords: ["timer", "start"],
      method: "POST",
    }) ||
    findEndpoint(routes, { pathKeywords: ["timers"], method: "POST" });
  if (!timerStartEndpoint) {
    results.push(fail(22, "Start timer", "endpoint not found"));
  } else {
    const res = await http.post(
      timerStartEndpoint.url,
      { project_id: projectId, task_id: taskId },
      true,
    );
    results.push(
      res.ok
        ? pass(22, "Start timer")
        : fail(22, "Start timer", `status ${res.status}`),
    );
  }

  // 23. Stop timer
  const timerStopEndpoint =
    findEndpoint(routes, {
      pathKeywords: ["timer", "stop"],
      method: "POST",
    }) ||
    findEndpoint(routes, {
      pathKeywords: ["timer", "stop"],
      method: "PATCH",
    });
  if (!timerStopEndpoint) {
    results.push(fail(23, "Stop timer", "endpoint not found"));
  } else {
    const res = await http.post(timerStopEndpoint.url, {}, true);
    const res2 = res.ok ? res : await http.patch(timerStopEndpoint.url, {}, true);
    results.push(
      res2.ok
        ? pass(23, "Stop timer")
        : fail(23, "Stop timer", `status ${res2.status}`),
    );
  }

  // ── Reports ─────────────────────────────────────────────

  // 24. Time report
  const timeReportEndpoint =
    findEndpoint(routes, {
      pathKeywords: ["reports", "time"],
      method: "GET",
    }) ||
    findEndpoint(routes, {
      pathKeywords: ["reports", "time"],
      method: "PATCH",
    });
  if (!timeReportEndpoint) {
    results.push(fail(24, "Time report", "endpoint not found"));
  } else {
    const res =
      timeReportEndpoint.method === "PATCH"
        ? await http.patch(timeReportEndpoint.url, {}, true)
        : await http.get(timeReportEndpoint.url, true);
    results.push(
      res.ok
        ? pass(24, "Time report")
        : fail(24, "Time report", `status ${res.status}`),
    );
  }

  // 25. Dashboard (employee or organization)
  const dashboardEndpoint =
    findEndpoint(routes, { pathKeywords: ["dashboard"], method: "GET" }) ||
    findEndpoint(routes, { pathKeywords: ["dashboards"], method: "GET" });
  if (!dashboardEndpoint) {
    results.push(fail(25, "Dashboard", "endpoint not found"));
  } else {
    const res = await http.get(dashboardEndpoint.url, true);
    results.push(
      res.ok
        ? pass(25, "Dashboard")
        : fail(25, "Dashboard", `status ${res.status}`),
    );
  }

  // ── Roles & Permissions ─────────────────────────────────

  // 26. Create custom role
  const roleCreateEndpoint = findEndpoint(routes, {
    pathKeywords: ["roles"],
    method: "POST",
  });
  if (!roleCreateEndpoint) {
    results.push(fail(26, "Create custom role", "endpoint not found"));
  } else {
    const res = await http.post(
      roleCreateEndpoint.url,
      {
        name: "Project Viewer",
        permissions: ["project:view", "time:view_all"],
      },
      true,
    );
    results.push(
      res.ok
        ? pass(26, "Create custom role")
        : fail(26, "Create custom role", `status ${res.status}`),
    );
  }

  // 27. List roles
  const roleListEndpoint = findEndpoint(routes, {
    pathKeywords: ["roles"],
    method: "GET",
  });
  if (!roleListEndpoint) {
    results.push(fail(27, "List roles", "endpoint not found"));
  } else {
    const res = await http.get(roleListEndpoint.url, true);
    results.push(
      res.ok
        ? pass(27, "List roles")
        : fail(27, "List roles", `status ${res.status}`),
    );
  }

  // ── Cleanup ─────────────────────────────────────────────

  // 28. Archive project
  if (projectId && projectEditEndpoint) {
    const url = http.resolvePath(projectEditEndpoint.url, {
      id: projectId,
      projectId,
    });
    const res = await http.patch(url, { status: "archived" }, true);
    results.push(
      res.ok
        ? pass(28, "Archive project")
        : fail(28, "Archive project", `status ${res.status}`),
    );
  } else {
    results.push(fail(28, "Archive project", "no projectId or endpoint"));
  }

  // ── Negative Tests ──────────────────────────────────────

  // 29. Unauthenticated access returns 401
  if (projectCreateEndpoint) {
    const anonHttp = new HttpRunner();
    const res = await anonHttp.post(
      projectCreateEndpoint.url,
      { name: "Should Fail" },
      false,
    );
    results.push(
      res.status === 401
        ? pass(29, "Unauthenticated project create returns 401")
        : fail(
            29,
            "Unauthenticated project create returns 401",
            `expected 401 but got ${res.status}`,
          ),
    );
  } else {
    results.push(
      fail(29, "Unauthenticated project create returns 401", "endpoint not found"),
    );
  }

  // 30. Invalid login returns error status
  if (loginEndpoint) {
    const res = await http.post(loginEndpoint.url, {
      email: "nonexistent@invalid.test",
      password: "WrongPassword123!",
    });
    results.push(
      res.status === 401 || res.status === 403 || res.status === 404
        ? pass(30, "Invalid login returns error status")
        : fail(
            30,
            "Invalid login returns error status",
            `expected 401/403/404 but got ${res.status}`,
          ),
    );
  } else {
    results.push(
      fail(30, "Invalid login returns error status", "endpoint not found"),
    );
  }

  return results;
}

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
  const userEmail = randomEmail();
  const userPassword = randomPassword();
  let orgId: string | null = null;
  let employeeId: string | null = null;
  let departmentId: string | null = null;
  let projectId: string | null = null;
  let taskId: string | null = null;
  let contractId: string | null = null;
  let timelogId: string | null = null;
  let timesheetId: string | null = null;
  let roleId: string | null = null;
  let invitationId: string | null = null;
  let reportId: string | null = null;
  let projectTagId: string | null = null;

  // ── Auth & Registration ───────────────────────────────

  // 1. User signup (user/join)
  const userJoinEndpoint =
    findEndpoint(routes, {
      pathKeywords: ["join"],
      mustContain: "user",
      method: "POST",
    }) ||
    findEndpoint(routes, {
      pathKeywords: ["join", "signup", "register"],
      method: "POST",
    });
  if (!userJoinEndpoint) {
    results.push(fail(1, "User signup", "endpoint not found", "auth"));
  } else {
    const res = await http.post(userJoinEndpoint.url, {
      email: userEmail,
      password: userPassword,
      display_name: "Test User",
    });
    results.push(
      res.ok
        ? pass(1, "User signup", "auth")
        : fail(1, "User signup", `status ${res.status}`, "auth"),
    );
  }

  // 2. User login
  const userLoginEndpoint =
    findEndpoint(routes, {
      pathKeywords: ["login"],
      mustContain: "user",
      method: "POST",
    }) || findEndpoint(routes, { pathKeywords: ["login"], method: "POST" });
  if (!userLoginEndpoint) {
    results.push(fail(2, "User login", "endpoint not found", "auth"));
  } else {
    const res = await http.post(userLoginEndpoint.url, {
      email: userEmail,
      password: userPassword,
    });
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

  // 3. OrgOwner signup (orgOwner/join)
  const orgOwnerJoinEndpoint =
    findEndpoint(routes, {
      pathKeywords: ["join"],
      mustContain: "orgOwner",
      method: "POST",
    }) ||
    findEndpoint(routes, {
      pathKeywords: ["join", "signup", "register"],
      method: "POST",
    });
  if (!orgOwnerJoinEndpoint) {
    results.push(fail(3, "OrgOwner signup", "endpoint not found", "auth"));
  } else {
    const res = await http.post(orgOwnerJoinEndpoint.url, {
      email: ownerEmail,
      password: ownerPassword,
      display_name: "Gauzy Owner",
    });
    results.push(
      res.ok
        ? pass(3, "OrgOwner signup", "auth")
        : fail(3, "OrgOwner signup", `status ${res.status}`, "auth"),
    );
  }

  // 4. OrgOwner login
  const orgOwnerLoginEndpoint =
    findEndpoint(routes, {
      pathKeywords: ["login"],
      mustContain: "orgOwner",
      method: "POST",
    }) || findEndpoint(routes, { pathKeywords: ["login"], method: "POST" });
  if (!orgOwnerLoginEndpoint) {
    results.push(fail(4, "OrgOwner login", "endpoint not found", "auth"));
  } else {
    const res = await http.post(orgOwnerLoginEndpoint.url, {
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
        results.push(pass(4, "OrgOwner login", "auth"));
      } else {
        results.push(fail(4, "OrgOwner login", "no token in response", "auth"));
      }
    } else {
      results.push(fail(4, "OrgOwner login", `status ${res.status}`, "auth"));
    }
  }

  // 5. Token refresh
  const refreshEndpoint =
    findEndpoint(routes, {
      pathKeywords: ["refresh"],
      mustContain: "orgOwner",
      method: "POST",
    }) || findEndpoint(routes, { pathKeywords: ["refresh"], method: "POST" });
  if (!refreshEndpoint) {
    results.push(fail(5, "Token refresh", "endpoint not found", "auth"));
  } else {
    const res = await http.post(refreshEndpoint.url, {}, true);
    results.push(
      res.ok || res.status === 201
        ? pass(5, "Token refresh", "auth")
        : fail(5, "Token refresh", `status ${res.status}`, "auth"),
    );
  }

  // ── Organization CRUD ─────────────────────────────────

  // 6. Create organization
  const orgCreateEndpoint = findEndpoint(routes, {
    pathKeywords: ["organizations", "orgs"],
    method: "POST",
  });
  if (!orgCreateEndpoint) {
    results.push(fail(6, "Create organization", "endpoint not found", "crud"));
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
      results.push(pass(6, "Create organization", "crud"));
    } else {
      results.push(
        fail(6, "Create organization", `status ${res.status}`, "crud"),
      );
    }
  }

  // 7. Get organization detail
  const orgGetEndpoint = findEndpoint(routes, {
    pathKeywords: ["organizations", "orgs"],
    method: "GET",
  });
  if (!orgGetEndpoint || !orgId) {
    results.push(
      fail(
        7,
        "Get organization detail",
        orgGetEndpoint ? "no orgId" : "endpoint not found",
        "query",
      ),
    );
  } else {
    const url = http.resolvePath(orgGetEndpoint.url, {
      id: orgId,
      organizationId: orgId,
    });
    const res = await http.get(url, true);
    results.push(
      res.ok
        ? pass(7, "Get organization detail", "query")
        : fail(7, "Get organization detail", `status ${res.status}`, "query"),
    );
  }

  // 8. Update organization
  const orgUpdateEndpoint = findEndpoint(routes, {
    pathKeywords: ["organizations", "orgs"],
    method: "PUT",
  });
  if (!orgUpdateEndpoint || !orgId) {
    results.push(
      fail(8, "Update organization", "endpoint or orgId not found", "crud"),
    );
  } else {
    const url = http.resolvePath(orgUpdateEndpoint.url, {
      id: orgId,
      organizationId: orgId,
    });
    const res = await http.put(
      url,
      { name: "Gauzy Corp Updated", currency: "USD" },
      true,
    );
    results.push(
      res.ok
        ? pass(8, "Update organization", "crud")
        : fail(8, "Update organization", `status ${res.status}`, "crud"),
    );
  }

  // 9. List organizations
  const orgListEndpoint = findEndpoint(routes, {
    pathKeywords: ["organizations", "orgs"],
    method: "GET",
  });
  if (!orgListEndpoint) {
    results.push(fail(9, "List organizations", "endpoint not found", "query"));
  } else {
    const res = await http.get(orgListEndpoint.url, true);
    results.push(
      res.ok
        ? pass(9, "List organizations", "query")
        : fail(9, "List organizations", `status ${res.status}`, "query"),
    );
  }

  // ── Department Management ─────────────────────────────

  // 10. Create department
  const deptCreateEndpoint = findEndpoint(routes, {
    pathKeywords: ["departments"],
    method: "POST",
  });
  if (!deptCreateEndpoint) {
    results.push(fail(10, "Create department", "endpoint not found", "crud"));
  } else {
    const res = await http.post(
      deptCreateEndpoint.url,
      {
        name: "Engineering",
        description: "Software engineering department",
        organization_id: orgId,
      },
      true,
    );
    if (res.ok) {
      departmentId = res.body?.id || res.body?.data?.id || null;
      results.push(pass(10, "Create department", "crud"));
    } else {
      results.push(
        fail(10, "Create department", `status ${res.status}`, "crud"),
      );
    }
  }

  // 11. List departments
  const deptListEndpoint = findEndpoint(routes, {
    pathKeywords: ["departments"],
    method: "GET",
  });
  if (!deptListEndpoint) {
    results.push(fail(11, "List departments", "endpoint not found", "query"));
  } else {
    const res = await http.get(deptListEndpoint.url, true);
    results.push(
      res.ok
        ? pass(11, "List departments", "query")
        : fail(11, "List departments", `status ${res.status}`, "query"),
    );
  }

  // 12. Get department detail
  if (departmentId) {
    const deptGetEndpoint = findEndpoint(routes, {
      pathKeywords: ["departments"],
      method: "GET",
    });
    if (!deptGetEndpoint) {
      results.push(
        fail(12, "Get department detail", "endpoint not found", "query"),
      );
    } else {
      const url = http.resolvePath(deptGetEndpoint.url, {
        id: departmentId,
        departmentId,
      });
      const res = await http.get(url, true);
      results.push(
        res.ok
          ? pass(12, "Get department detail", "query")
          : fail(12, "Get department detail", `status ${res.status}`, "query"),
      );
    }
  } else {
    results.push(fail(12, "Get department detail", "no departmentId", "query"));
  }

  // ── Employee Management ───────────────────────────────

  // 13. Create employee
  const employeeCreateEndpoint = findEndpoint(routes, {
    pathKeywords: ["employees"],
    method: "POST",
  });
  if (!employeeCreateEndpoint) {
    results.push(fail(13, "Create employee", "endpoint not found", "crud"));
  } else {
    const res = await http.post(
      employeeCreateEndpoint.url,
      {
        email: randomEmail(),
        display_name: "Test Employee",
        position: "Developer",
        employment_type: "full-time",
        department: "Engineering",
        organization_id: orgId,
      },
      true,
    );
    if (res.ok) {
      employeeId = res.body?.id || res.body?.data?.id || null;
      results.push(pass(13, "Create employee", "crud"));
    } else {
      results.push(fail(13, "Create employee", `status ${res.status}`, "crud"));
    }
  }

  // 14. List employees
  const employeeListEndpoint = findEndpoint(routes, {
    pathKeywords: ["employees"],
    method: "GET",
  });
  if (!employeeListEndpoint) {
    results.push(fail(14, "List employees", "endpoint not found", "query"));
  } else {
    const res = await http.get(employeeListEndpoint.url, true);
    results.push(
      res.ok
        ? pass(14, "List employees", "query")
        : fail(14, "List employees", `status ${res.status}`, "query"),
    );
  }

  // 15. Get employee detail
  if (employeeId) {
    const employeeGetEndpoint = findEndpoint(routes, {
      pathKeywords: ["employees"],
      method: "GET",
    });
    if (!employeeGetEndpoint) {
      results.push(
        fail(15, "Get employee detail", "endpoint not found", "query"),
      );
    } else {
      const url = http.resolvePath(employeeGetEndpoint.url, {
        id: employeeId,
        employeeId,
      });
      const res = await http.get(url, true);
      results.push(
        res.ok
          ? pass(15, "Get employee detail", "query")
          : fail(15, "Get employee detail", `status ${res.status}`, "query"),
      );
    }
  } else {
    results.push(fail(15, "Get employee detail", "no employeeId", "query"));
  }

  // 16. Update employee
  if (employeeId) {
    const employeeUpdateEndpoint = findEndpoint(routes, {
      pathKeywords: ["employees"],
      method: "PUT",
    });
    if (!employeeUpdateEndpoint) {
      results.push(fail(16, "Update employee", "endpoint not found", "crud"));
    } else {
      const url = http.resolvePath(employeeUpdateEndpoint.url, {
        id: employeeId,
        employeeId,
      });
      const res = await http.put(
        url,
        { display_name: "Updated Employee", position: "Senior Developer" },
        true,
      );
      results.push(
        res.ok
          ? pass(16, "Update employee", "crud")
          : fail(16, "Update employee", `status ${res.status}`, "crud"),
      );
    }
  } else {
    results.push(fail(16, "Update employee", "no employeeId", "crud"));
  }

  // 17. Assign employee to department
  const empDeptEndpoint = findEndpoint(routes, {
    pathKeywords: ["employee-departments"],
    method: "POST",
  });
  if (!empDeptEndpoint || !employeeId || !departmentId) {
    results.push(
      fail(
        17,
        "Assign employee to department",
        "endpoint or IDs not found",
        "workflow",
      ),
    );
  } else {
    const res = await http.post(
      empDeptEndpoint.url,
      { employee_id: employeeId, department_id: departmentId },
      true,
    );
    results.push(
      res.ok
        ? pass(17, "Assign employee to department", "workflow")
        : fail(
            17,
            "Assign employee to department",
            `status ${res.status}`,
            "workflow",
          ),
    );
  }

  // ── Roles & Permissions ───────────────────────────────

  // 18. Create role
  const roleCreateEndpoint = findEndpoint(routes, {
    pathKeywords: ["roles"],
    method: "POST",
  });
  if (!roleCreateEndpoint) {
    results.push(fail(18, "Create role", "endpoint not found", "crud"));
  } else {
    const res = await http.post(
      roleCreateEndpoint.url,
      {
        name: "Project Manager",
        description: "Can manage projects and tasks",
      },
      true,
    );
    if (res.ok) {
      roleId = res.body?.id || res.body?.data?.id || null;
      results.push(pass(18, "Create role", "crud"));
    } else {
      results.push(fail(18, "Create role", `status ${res.status}`, "crud"));
    }
  }

  // 19. List roles
  const roleListEndpoint = findEndpoint(routes, {
    pathKeywords: ["roles"],
    method: "GET",
  });
  if (!roleListEndpoint) {
    results.push(fail(19, "List roles", "endpoint not found", "query"));
  } else {
    const res = await http.get(roleListEndpoint.url, true);
    results.push(
      res.ok
        ? pass(19, "List roles", "query")
        : fail(19, "List roles", `status ${res.status}`, "query"),
    );
  }

  // 20. Assign role to employee
  const empRoleEndpoint = findEndpoint(routes, {
    pathKeywords: ["employee-roles"],
    method: "POST",
  });
  if (!empRoleEndpoint || !employeeId || !roleId) {
    results.push(
      fail(
        20,
        "Assign role to employee",
        "endpoint or IDs not found",
        "workflow",
      ),
    );
  } else {
    const res = await http.post(
      empRoleEndpoint.url,
      { employee_id: employeeId, role_id: roleId },
      true,
    );
    results.push(
      res.ok
        ? pass(20, "Assign role to employee", "workflow")
        : fail(
            20,
            "Assign role to employee",
            `status ${res.status}`,
            "workflow",
          ),
    );
  }

  // 21. Create role permission
  const rolePermEndpoint = findEndpoint(routes, {
    pathKeywords: ["role-permissions"],
    method: "POST",
  });
  if (!rolePermEndpoint || !roleId) {
    results.push(
      fail(
        21,
        "Create role permission",
        "endpoint or roleId not found",
        "crud",
      ),
    );
  } else {
    const res = await http.post(
      rolePermEndpoint.url,
      { role_id: roleId, permission: "project:manage" },
      true,
    );
    results.push(
      res.ok
        ? pass(21, "Create role permission", "crud")
        : fail(21, "Create role permission", `status ${res.status}`, "crud"),
    );
  }

  // ── Contract Management ───────────────────────────────

  // 22. Create contract
  const contractCreateEndpoint = findEndpoint(routes, {
    pathKeywords: ["contracts"],
    method: "POST",
  });
  if (!contractCreateEndpoint || !employeeId) {
    results.push(
      fail(22, "Create contract", "endpoint or employeeId not found", "crud"),
    );
  } else {
    const res = await http.post(
      contractCreateEndpoint.url,
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
      results.push(pass(22, "Create contract", "crud"));
    } else {
      results.push(fail(22, "Create contract", `status ${res.status}`, "crud"));
    }
  }

  // 23. List contracts
  const contractListEndpoint = findEndpoint(routes, {
    pathKeywords: ["contracts"],
    method: "PATCH",
  });
  if (!contractListEndpoint) {
    results.push(fail(23, "List contracts", "endpoint not found", "query"));
  } else {
    const res = await http.patch(contractListEndpoint.url, {}, true);
    results.push(
      res.ok
        ? pass(23, "List contracts", "query")
        : fail(23, "List contracts", `status ${res.status}`, "query"),
    );
  }

  // 24. Get contract detail
  if (contractId) {
    const contractGetEndpoint = findEndpoint(routes, {
      pathKeywords: ["contracts"],
      method: "GET",
    });
    if (!contractGetEndpoint) {
      results.push(
        fail(24, "Get contract detail", "endpoint not found", "query"),
      );
    } else {
      const url = http.resolvePath(contractGetEndpoint.url, {
        id: contractId,
        contractId,
      });
      const res = await http.get(url, true);
      results.push(
        res.ok
          ? pass(24, "Get contract detail", "query")
          : fail(24, "Get contract detail", `status ${res.status}`, "query"),
      );
    }
  } else {
    results.push(fail(24, "Get contract detail", "no contractId", "query"));
  }

  // 25. Add contract note
  if (contractId) {
    const noteEndpoint = findEndpoint(routes, {
      pathKeywords: ["contracts", "notes"],
      method: "POST",
    });
    if (!noteEndpoint) {
      results.push(fail(25, "Add contract note", "endpoint not found", "crud"));
    } else {
      const url = http.resolvePath(noteEndpoint.url, {
        contractId,
        id: contractId,
      });
      const res = await http.post(
        url,
        { content: "Contract review completed" },
        true,
      );
      results.push(
        res.ok
          ? pass(25, "Add contract note", "crud")
          : fail(25, "Add contract note", `status ${res.status}`, "crud"),
      );
    }
  } else {
    results.push(fail(25, "Add contract note", "no contractId", "crud"));
  }

  // 26. Create contract transition
  if (contractId) {
    const transitionEndpoint = findEndpoint(routes, {
      pathKeywords: ["contracts", "transitions"],
      method: "POST",
    });
    if (!transitionEndpoint) {
      results.push(
        fail(26, "Contract transition", "endpoint not found", "workflow"),
      );
    } else {
      const url = http.resolvePath(transitionEndpoint.url, {
        contractId,
        id: contractId,
      });
      const res = await http.post(
        url,
        { status: "active", reason: "Contract activated" },
        true,
      );
      results.push(
        res.ok
          ? pass(26, "Contract transition", "workflow")
          : fail(26, "Contract transition", `status ${res.status}`, "workflow"),
      );
    }
  } else {
    results.push(fail(26, "Contract transition", "no contractId", "workflow"));
  }

  // ── Projects ──────────────────────────────────────────

  // 27. Create project
  const projectCreateEndpoint = findEndpoint(routes, {
    pathKeywords: ["projects"],
    method: "POST",
  });
  if (!projectCreateEndpoint) {
    results.push(fail(27, "Create project", "endpoint not found", "crud"));
  } else {
    const res = await http.post(
      projectCreateEndpoint.url,
      {
        name: "Golden Set Project",
        description: "Test project for E2E",
        status: "active",
        budget_hours: 100,
        organization_id: orgId,
      },
      true,
    );
    if (res.ok) {
      projectId = res.body?.id || res.body?.data?.id || null;
      results.push(pass(27, "Create project", "crud"));
    } else {
      results.push(fail(27, "Create project", `status ${res.status}`, "crud"));
    }
  }

  // 28. List projects
  const projectListEndpoint = findEndpoint(routes, {
    pathKeywords: ["projects"],
    method: "PATCH",
  });
  if (!projectListEndpoint) {
    results.push(fail(28, "List projects", "endpoint not found", "query"));
  } else {
    const res = await http.patch(projectListEndpoint.url, {}, true);
    results.push(
      res.ok
        ? pass(28, "List projects", "query")
        : fail(28, "List projects", `status ${res.status}`, "query"),
    );
  }

  // 29. Get project detail
  if (projectId) {
    const projectGetEndpoint = findEndpoint(routes, {
      pathKeywords: ["projects"],
      method: "GET",
    });
    if (!projectGetEndpoint) {
      results.push(
        fail(29, "Get project detail", "endpoint not found", "query"),
      );
    } else {
      const url = http.resolvePath(projectGetEndpoint.url, {
        id: projectId,
        projectId,
      });
      const res = await http.get(url, true);
      results.push(
        res.ok
          ? pass(29, "Get project detail", "query")
          : fail(29, "Get project detail", `status ${res.status}`, "query"),
      );
    }
  } else {
    results.push(fail(29, "Get project detail", "no projectId", "query"));
  }

  // 30. Update project
  if (projectId) {
    const projectUpdateEndpoint = findEndpoint(routes, {
      pathKeywords: ["projects"],
      method: "PUT",
    });
    if (!projectUpdateEndpoint) {
      results.push(fail(30, "Update project", "endpoint not found", "crud"));
    } else {
      const url = http.resolvePath(projectUpdateEndpoint.url, {
        id: projectId,
        projectId,
      });
      const res = await http.put(url, { name: "Updated Project" }, true);
      results.push(
        res.ok
          ? pass(30, "Update project", "crud")
          : fail(30, "Update project", `status ${res.status}`, "crud"),
      );
    }
  } else {
    results.push(fail(30, "Update project", "no projectId", "crud"));
  }

  // 31. Create project tag
  const projectTagCreateEndpoint = findEndpoint(routes, {
    pathKeywords: ["project-tags"],
    method: "POST",
  });
  if (!projectTagCreateEndpoint) {
    results.push(fail(31, "Create project tag", "endpoint not found", "crud"));
  } else {
    const res = await http.post(
      projectTagCreateEndpoint.url,
      { name: "priority", color: "#FF0000" },
      true,
    );
    if (res.ok) {
      projectTagId = res.body?.id || res.body?.data?.id || null;
      results.push(pass(31, "Create project tag", "crud"));
    } else {
      results.push(
        fail(31, "Create project tag", `status ${res.status}`, "crud"),
      );
    }
  }

  // 32. Assign tag to project
  if (projectId && projectTagId) {
    const tagAssignEndpoint = findEndpoint(routes, {
      pathKeywords: ["project-tag-assignments"],
      method: "POST",
    });
    if (!tagAssignEndpoint) {
      results.push(
        fail(32, "Assign tag to project", "endpoint not found", "workflow"),
      );
    } else {
      const res = await http.post(
        tagAssignEndpoint.url,
        { project_id: projectId, project_tag_id: projectTagId },
        true,
      );
      results.push(
        res.ok
          ? pass(32, "Assign tag to project", "workflow")
          : fail(
              32,
              "Assign tag to project",
              `status ${res.status}`,
              "workflow",
            ),
      );
    }
  } else {
    results.push(
      fail(32, "Assign tag to project", "no projectId or tagId", "workflow"),
    );
  }

  // 33. Add project membership
  const membershipEndpoint = findEndpoint(routes, {
    pathKeywords: ["project-memberships"],
    method: "POST",
  });
  if (!membershipEndpoint || !projectId || !employeeId) {
    results.push(
      fail(
        33,
        "Add project membership",
        "endpoint or IDs not found",
        "workflow",
      ),
    );
  } else {
    const res = await http.post(
      membershipEndpoint.url,
      { project_id: projectId, employee_id: employeeId, role: "member" },
      true,
    );
    results.push(
      res.ok
        ? pass(33, "Add project membership", "workflow")
        : fail(
            33,
            "Add project membership",
            `status ${res.status}`,
            "workflow",
          ),
    );
  }

  // ── Tasks ─────────────────────────────────────────────

  // 34. Create task
  const taskCreateEndpoint = findEndpoint(routes, {
    pathKeywords: ["tasks"],
    method: "POST",
  });
  if (!taskCreateEndpoint || !projectId) {
    results.push(
      fail(34, "Create task", "endpoint or projectId not found", "crud"),
    );
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
      results.push(pass(34, "Create task", "crud"));
    } else {
      results.push(fail(34, "Create task", `status ${res.status}`, "crud"));
    }
  }

  // 35. List tasks
  const taskListEndpoint = findEndpoint(routes, {
    pathKeywords: ["tasks"],
    method: "PATCH",
  });
  if (!taskListEndpoint) {
    results.push(fail(35, "List tasks", "endpoint not found", "query"));
  } else {
    const res = await http.patch(taskListEndpoint.url, {}, true);
    results.push(
      res.ok
        ? pass(35, "List tasks", "query")
        : fail(35, "List tasks", `status ${res.status}`, "query"),
    );
  }

  // 36. Get task detail
  if (taskId) {
    const taskGetEndpoint = findEndpoint(routes, {
      pathKeywords: ["tasks"],
      method: "GET",
    });
    if (!taskGetEndpoint) {
      results.push(fail(36, "Get task detail", "endpoint not found", "query"));
    } else {
      const url = http.resolvePath(taskGetEndpoint.url, {
        id: taskId,
        taskId,
      });
      const res = await http.get(url, true);
      results.push(
        res.ok
          ? pass(36, "Get task detail", "query")
          : fail(36, "Get task detail", `status ${res.status}`, "query"),
      );
    }
  } else {
    results.push(fail(36, "Get task detail", "no taskId", "query"));
  }

  // 37. Update task status
  if (taskId) {
    const taskUpdateEndpoint = findEndpoint(routes, {
      pathKeywords: ["tasks"],
      method: "PUT",
    });
    if (!taskUpdateEndpoint) {
      results.push(
        fail(37, "Update task status", "endpoint not found", "crud"),
      );
    } else {
      const url = http.resolvePath(taskUpdateEndpoint.url, {
        id: taskId,
        taskId,
      });
      const res = await http.put(url, { status: "in-progress" }, true);
      results.push(
        res.ok
          ? pass(37, "Update task status", "crud")
          : fail(37, "Update task status", `status ${res.status}`, "crud"),
      );
    }
  } else {
    results.push(fail(37, "Update task status", "no taskId", "crud"));
  }

  // ── Time Tracking ─────────────────────────────────────

  // 38. Create timelog
  const timelogCreateEndpoint = findEndpoint(routes, {
    pathKeywords: ["timelogs", "time-logs"],
    method: "POST",
  });
  if (!timelogCreateEndpoint) {
    results.push(fail(38, "Create timelog", "endpoint not found", "crud"));
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
      results.push(pass(38, "Create timelog", "crud"));
    } else {
      results.push(fail(38, "Create timelog", `status ${res.status}`, "crud"));
    }
  }

  // 39. List timelogs
  const timelogListEndpoint = findEndpoint(routes, {
    pathKeywords: ["timelogs", "time-logs"],
    method: "PATCH",
  });
  if (!timelogListEndpoint) {
    results.push(fail(39, "List timelogs", "endpoint not found", "query"));
  } else {
    const res = await http.patch(timelogListEndpoint.url, {}, true);
    results.push(
      res.ok
        ? pass(39, "List timelogs", "query")
        : fail(39, "List timelogs", `status ${res.status}`, "query"),
    );
  }

  // 40. Get timelog detail
  if (timelogId) {
    const timelogGetEndpoint = findEndpoint(routes, {
      pathKeywords: ["timelogs", "time-logs"],
      method: "GET",
    });
    if (!timelogGetEndpoint) {
      results.push(
        fail(40, "Get timelog detail", "endpoint not found", "query"),
      );
    } else {
      const url = http.resolvePath(timelogGetEndpoint.url, {
        id: timelogId,
        timelogId,
      });
      const res = await http.get(url, true);
      results.push(
        res.ok
          ? pass(40, "Get timelog detail", "query")
          : fail(40, "Get timelog detail", `status ${res.status}`, "query"),
      );
    }
  } else {
    results.push(fail(40, "Get timelog detail", "no timelogId", "query"));
  }

  // 41. Submit timesheet
  const timesheetCreateEndpoint = findEndpoint(routes, {
    pathKeywords: ["timesheets"],
    method: "POST",
  });
  if (!timesheetCreateEndpoint) {
    results.push(fail(41, "Submit timesheet", "endpoint not found", "crud"));
  } else {
    const res = await http.post(
      timesheetCreateEndpoint.url,
      { week_start: "2026-03-09", status: "submitted" },
      true,
    );
    if (res.ok) {
      timesheetId = res.body?.id || res.body?.data?.id || null;
      results.push(pass(41, "Submit timesheet", "crud"));
    } else {
      results.push(
        fail(41, "Submit timesheet", `status ${res.status}`, "crud"),
      );
    }
  }

  // 42. List timesheets
  const timesheetListEndpoint = findEndpoint(routes, {
    pathKeywords: ["timesheets"],
    method: "PATCH",
  });
  if (!timesheetListEndpoint) {
    results.push(fail(42, "List timesheets", "endpoint not found", "query"));
  } else {
    const res = await http.patch(timesheetListEndpoint.url, {}, true);
    results.push(
      res.ok
        ? pass(42, "List timesheets", "query")
        : fail(42, "List timesheets", `status ${res.status}`, "query"),
    );
  }

  // 43. Approve timesheet
  if (timesheetId) {
    const approveEndpoint = findEndpoint(routes, {
      pathKeywords: ["timesheets"],
      method: "PUT",
    });
    if (!approveEndpoint) {
      results.push(
        fail(43, "Approve timesheet", "endpoint not found", "workflow"),
      );
    } else {
      const url = http.resolvePath(approveEndpoint.url, {
        id: timesheetId,
        timesheetId,
      });
      const res = await http.put(url, { status: "approved" }, true);
      results.push(
        res.ok
          ? pass(43, "Approve timesheet", "workflow")
          : fail(43, "Approve timesheet", `status ${res.status}`, "workflow"),
      );
    }
  } else {
    results.push(fail(43, "Approve timesheet", "no timesheetId", "workflow"));
  }

  // 44. Link timelog to timesheet
  if (timesheetId && timelogId) {
    const linkEndpoint = findEndpoint(routes, {
      pathKeywords: ["timesheets", "timelogs"],
      method: "POST",
    });
    if (!linkEndpoint) {
      results.push(
        fail(44, "Link timelog to timesheet", "endpoint not found", "workflow"),
      );
    } else {
      const url = http.resolvePath(linkEndpoint.url, {
        timesheetId,
        id: timesheetId,
      });
      const res = await http.post(url, { timelog_id: timelogId }, true);
      results.push(
        res.ok
          ? pass(44, "Link timelog to timesheet", "workflow")
          : fail(
              44,
              "Link timelog to timesheet",
              `status ${res.status}`,
              "workflow",
            ),
      );
    }
  } else {
    results.push(
      fail(
        44,
        "Link timelog to timesheet",
        "no timesheetId or timelogId",
        "workflow",
      ),
    );
  }

  // 45. Start timer
  const timerStartEndpoint = findEndpoint(routes, {
    pathKeywords: ["timers"],
    method: "POST",
  });
  if (!timerStartEndpoint) {
    results.push(fail(45, "Start timer", "endpoint not found", "workflow"));
  } else {
    const res = await http.post(
      timerStartEndpoint.url,
      { project_id: projectId, task_id: taskId },
      true,
    );
    results.push(
      res.ok
        ? pass(45, "Start timer", "workflow")
        : fail(45, "Start timer", `status ${res.status}`, "workflow"),
    );
  }

  // ── Invitations ───────────────────────────────────────

  // 46. Create invitation
  const invitationCreateEndpoint = findEndpoint(routes, {
    pathKeywords: ["invitations"],
    method: "POST",
  });
  if (!invitationCreateEndpoint) {
    results.push(fail(46, "Create invitation", "endpoint not found", "crud"));
  } else {
    const res = await http.post(
      invitationCreateEndpoint.url,
      {
        email: randomEmail(),
        role: "member",
        organization_id: orgId,
      },
      true,
    );
    if (res.ok) {
      invitationId = res.body?.id || res.body?.data?.id || null;
      results.push(pass(46, "Create invitation", "crud"));
    } else {
      results.push(
        fail(46, "Create invitation", `status ${res.status}`, "crud"),
      );
    }
  }

  // 47. List invitations
  const invitationListEndpoint = findEndpoint(routes, {
    pathKeywords: ["invitations"],
    method: "PATCH",
  });
  if (!invitationListEndpoint) {
    results.push(fail(47, "List invitations", "endpoint not found", "query"));
  } else {
    const res = await http.patch(invitationListEndpoint.url, {}, true);
    results.push(
      res.ok
        ? pass(47, "List invitations", "query")
        : fail(47, "List invitations", `status ${res.status}`, "query"),
    );
  }

  // 48. Delete invitation
  if (invitationId) {
    const invitationDeleteEndpoint = findEndpoint(routes, {
      pathKeywords: ["invitations"],
      method: "DELETE",
    });
    if (!invitationDeleteEndpoint) {
      results.push(fail(48, "Delete invitation", "endpoint not found", "crud"));
    } else {
      const url = http.resolvePath(invitationDeleteEndpoint.url, {
        id: invitationId,
        invitationId,
      });
      const res = await http.delete(url, true);
      results.push(
        res.ok
          ? pass(48, "Delete invitation", "crud")
          : fail(48, "Delete invitation", `status ${res.status}`, "crud"),
      );
    }
  } else {
    results.push(fail(48, "Delete invitation", "no invitationId", "crud"));
  }

  // ── Reports ───────────────────────────────────────────

  // 49. Create report
  const reportCreateEndpoint = findEndpoint(routes, {
    pathKeywords: ["reports"],
    method: "POST",
  });
  if (!reportCreateEndpoint) {
    results.push(fail(49, "Create report", "endpoint not found", "crud"));
  } else {
    const res = await http.post(
      reportCreateEndpoint.url,
      {
        name: "Weekly Time Report",
        type: "time",
        organization_id: orgId,
      },
      true,
    );
    if (res.ok) {
      reportId = res.body?.id || res.body?.data?.id || null;
      results.push(pass(49, "Create report", "crud"));
    } else {
      results.push(fail(49, "Create report", `status ${res.status}`, "crud"));
    }
  }

  // 50. List reports
  const reportListEndpoint = findEndpoint(routes, {
    pathKeywords: ["reports"],
    method: "PATCH",
  });
  if (!reportListEndpoint) {
    results.push(fail(50, "List reports", "endpoint not found", "query"));
  } else {
    const res = await http.patch(reportListEndpoint.url, {}, true);
    results.push(
      res.ok
        ? pass(50, "List reports", "query")
        : fail(50, "List reports", `status ${res.status}`, "query"),
    );
  }

  // 51. Get report detail
  if (reportId) {
    const reportGetEndpoint = findEndpoint(routes, {
      pathKeywords: ["reports"],
      method: "GET",
    });
    if (!reportGetEndpoint) {
      results.push(
        fail(51, "Get report detail", "endpoint not found", "query"),
      );
    } else {
      const url = http.resolvePath(reportGetEndpoint.url, {
        id: reportId,
        reportId,
      });
      const res = await http.get(url, true);
      results.push(
        res.ok
          ? pass(51, "Get report detail", "query")
          : fail(51, "Get report detail", `status ${res.status}`, "query"),
      );
    }
  } else {
    results.push(fail(51, "Get report detail", "no reportId", "query"));
  }

  // ── Dashboard & Analytics ─────────────────────────────

  // 52. OrgOwner dashboard summary
  const ownerDashboardEndpoint =
    findEndpoint(routes, {
      pathKeywords: ["dashboard", "summary"],
      mustContain: "orgOwner",
      method: "GET",
    }) ||
    findEndpoint(routes, {
      pathKeywords: ["dashboard"],
      method: "GET",
    });
  if (!ownerDashboardEndpoint) {
    results.push(
      fail(52, "OrgOwner dashboard summary", "endpoint not found", "query"),
    );
  } else {
    const res = await http.get(ownerDashboardEndpoint.url, true);
    results.push(
      res.ok
        ? pass(52, "OrgOwner dashboard summary", "query")
        : fail(
            52,
            "OrgOwner dashboard summary",
            `status ${res.status}`,
            "query",
          ),
    );
  }

  // 53. Activity logs
  const activityLogEndpoint = findEndpoint(routes, {
    pathKeywords: ["activityLogs", "activity-logs"],
    method: "PATCH",
  });
  if (!activityLogEndpoint) {
    results.push(fail(53, "Activity logs", "endpoint not found", "query"));
  } else {
    const res = await http.patch(activityLogEndpoint.url, {}, true);
    results.push(
      res.ok
        ? pass(53, "Activity logs", "query")
        : fail(53, "Activity logs", `status ${res.status}`, "query"),
    );
  }

  // ── Negative Tests ────────────────────────────────────

  // 54. Unauthenticated access returns 401
  if (projectCreateEndpoint) {
    const anonHttp = new HttpRunner();
    const res = await anonHttp.post(
      projectCreateEndpoint.url,
      { name: "Should Fail" },
      false,
    );
    results.push(
      res.status === 401
        ? pass(54, "Unauthenticated project create returns 401", "negative")
        : fail(
            54,
            "Unauthenticated project create returns 401",
            `expected 401 but got ${res.status}`,
            "negative",
          ),
    );
  } else {
    results.push(
      fail(
        54,
        "Unauthenticated project create returns 401",
        "endpoint not found",
        "negative",
      ),
    );
  }

  // 55. Invalid login returns error status
  if (userLoginEndpoint) {
    const res = await http.post(userLoginEndpoint.url, {
      email: "nonexistent@invalid.test",
      password: "WrongPassword123!",
    });
    results.push(
      res.status === 401 || res.status === 403 || res.status === 404
        ? pass(55, "Invalid login returns error status", "negative")
        : fail(
            55,
            "Invalid login returns error status",
            `expected 401/403/404 but got ${res.status}`,
            "negative",
          ),
    );
  } else {
    results.push(
      fail(
        55,
        "Invalid login returns error status",
        "endpoint not found",
        "negative",
      ),
    );
  }

  // 56. Duplicate registration returns error
  if (userJoinEndpoint) {
    const res = await http.post(userJoinEndpoint.url, {
      email: userEmail,
      password: userPassword,
      display_name: "Duplicate User",
    });
    results.push(
      !res.ok
        ? pass(56, "Duplicate registration returns error", "negative")
        : fail(
            56,
            "Duplicate registration returns error",
            `expected error but got ${res.status}`,
            "negative",
          ),
    );
  } else {
    results.push(
      fail(
        56,
        "Duplicate registration returns error",
        "endpoint not found",
        "negative",
      ),
    );
  }

  // 57. Non-existent resource returns 404
  const taskGetForNegative = findEndpoint(routes, {
    pathKeywords: ["tasks"],
    method: "GET",
  });
  if (taskGetForNegative) {
    const url = http.resolvePath(taskGetForNegative.url, {
      id: "00000000-0000-0000-0000-000000000000",
      taskId: "00000000-0000-0000-0000-000000000000",
    });
    const res = await http.get(url, true);
    results.push(
      res.status === 404 || res.status === 400
        ? pass(57, "Non-existent task returns 404", "negative")
        : fail(
            57,
            "Non-existent task returns 404",
            `expected 404 but got ${res.status}`,
            "negative",
          ),
    );
  } else {
    results.push(
      fail(
        57,
        "Non-existent task returns 404",
        "endpoint not found",
        "negative",
      ),
    );
  }

  // ── Cleanup ───────────────────────────────────────────

  // 58. Delete task
  if (taskId) {
    const taskDeleteEndpoint = findEndpoint(routes, {
      pathKeywords: ["tasks"],
      method: "DELETE",
    });
    if (taskDeleteEndpoint) {
      const url = http.resolvePath(taskDeleteEndpoint.url, {
        id: taskId,
        taskId,
      });
      const res = await http.delete(url, true);
      results.push(
        res.ok
          ? pass(58, "Delete task", "cleanup")
          : fail(58, "Delete task", `status ${res.status}`, "cleanup"),
      );
    } else {
      results.push(fail(58, "Delete task", "endpoint not found", "cleanup"));
    }
  } else {
    results.push(fail(58, "Delete task", "no taskId", "cleanup"));
  }

  // 59. Delete project
  if (projectId) {
    const projectDeleteEndpoint = findEndpoint(routes, {
      pathKeywords: ["projects"],
      method: "DELETE",
    });
    if (projectDeleteEndpoint) {
      const url = http.resolvePath(projectDeleteEndpoint.url, {
        id: projectId,
        projectId,
      });
      const res = await http.delete(url, true);
      results.push(
        res.ok
          ? pass(59, "Delete project", "cleanup")
          : fail(59, "Delete project", `status ${res.status}`, "cleanup"),
      );
    } else {
      results.push(fail(59, "Delete project", "endpoint not found", "cleanup"));
    }
  } else {
    results.push(fail(59, "Delete project", "no projectId", "cleanup"));
  }

  // 60. Delete organization
  if (orgId) {
    const orgDeleteEndpoint = findEndpoint(routes, {
      pathKeywords: ["organizations", "orgs"],
      method: "DELETE",
    });
    if (orgDeleteEndpoint) {
      const url = http.resolvePath(orgDeleteEndpoint.url, {
        id: orgId,
        organizationId: orgId,
      });
      const res = await http.delete(url, true);
      results.push(
        res.ok
          ? pass(60, "Delete organization", "cleanup")
          : fail(60, "Delete organization", `status ${res.status}`, "cleanup"),
      );
    } else {
      results.push(
        fail(60, "Delete organization", "endpoint not found", "cleanup"),
      );
    }
  } else {
    results.push(fail(60, "Delete organization", "no orgId", "cleanup"));
  }

  return results;
}

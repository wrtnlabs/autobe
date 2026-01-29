import { AutoBeInterfaceEndpointProgrammer } from "@autobe/agent/src/orchestrate/interface/programmers/AutoBeInterfaceEndpointProgrammer";
import {
  AutoBeAnalyzeActor,
  AutoBeInterfaceEndpointDesign,
} from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";

export const test_interface_endpoint_programmer_filter = (): void => {
  const actors: AutoBeAnalyzeActor[] = [
    { name: "user", kind: "member", description: "Regular user" },
    { name: "admin", kind: "admin", description: "Administrator" },
  ];

  // Test 1: action kind - only authorizationType null should pass
  {
    const nullTypeDesign: AutoBeInterfaceEndpointDesign = {
      description: "Get all products",
      authorizationActors: ["user"],
      authorizationType: null,
      endpoint: { method: "get", path: "/products" },
    };
    TestValidator.equals(
      "action with null authorizationType should pass",
      AutoBeInterfaceEndpointProgrammer.filter({
        kind: "action",
        design: nullTypeDesign,
        actors,
      }),
      true,
    );

    const loginTypeDesign: AutoBeInterfaceEndpointDesign = {
      description: "User login",
      authorizationActors: ["user"],
      authorizationType: "login",
      endpoint: { method: "post", path: "/auth/login" },
    };
    TestValidator.equals(
      "action with login authorizationType should fail",
      AutoBeInterfaceEndpointProgrammer.filter({
        kind: "action",
        design: loginTypeDesign,
        actors,
      }),
      false,
    );
  }

  // Test 2: base kind - remove guest actors and login/join/refresh/session types
  {
    const normalDesign: AutoBeInterfaceEndpointDesign = {
      description: "Get user profile",
      authorizationActors: ["user", "admin"],
      authorizationType: null,
      endpoint: { method: "get", path: "/users/profile" },
    };
    const result = AutoBeInterfaceEndpointProgrammer.filter({
      kind: "base",
      design: normalDesign,
      actors,
    });
    TestValidator.equals("base with valid actors should pass", result, true);
    TestValidator.equals(
      "authorizationActors should remain",
      normalDesign.authorizationActors,
      ["user", "admin"],
    );
  }

  // Test 3: base kind - guest should be removed
  {
    const guestDesign: AutoBeInterfaceEndpointDesign = {
      description: "Public endpoint",
      authorizationActors: ["guest", "user"],
      authorizationType: null,
      endpoint: { method: "get", path: "/public" },
    };
    const result = AutoBeInterfaceEndpointProgrammer.filter({
      kind: "base",
      design: guestDesign,
      actors,
    });
    TestValidator.equals(
      "base with guest removed should pass if other actors remain",
      result,
      true,
    );
    TestValidator.equals(
      "guest should be removed from authorizationActors",
      guestDesign.authorizationActors,
      ["user"],
    );
  }

  // Test 4: base kind - only guest should fail
  {
    const onlyGuestDesign: AutoBeInterfaceEndpointDesign = {
      description: "Guest only endpoint",
      authorizationActors: ["guest"],
      authorizationType: null,
      endpoint: { method: "get", path: "/guest-only" },
    };
    const result = AutoBeInterfaceEndpointProgrammer.filter({
      kind: "base",
      design: onlyGuestDesign,
      actors,
    });
    TestValidator.equals("base with only guest should fail", result, false);
  }

  // Test 5: base kind - login type should be filtered out
  {
    const loginDesign: AutoBeInterfaceEndpointDesign = {
      description: "User login",
      authorizationActors: ["user"],
      authorizationType: "login",
      endpoint: { method: "post", path: "/auth/login" },
    };
    TestValidator.equals(
      "base with login type should fail",
      AutoBeInterfaceEndpointProgrammer.filter({
        kind: "base",
        design: loginDesign,
        actors,
      }),
      false,
    );
  }

  // Test 6: base kind - join type should be filtered out
  {
    const joinDesign: AutoBeInterfaceEndpointDesign = {
      description: "User registration",
      authorizationActors: ["user"],
      authorizationType: "join",
      endpoint: { method: "post", path: "/auth/register" },
    };
    TestValidator.equals(
      "base with join type should fail",
      AutoBeInterfaceEndpointProgrammer.filter({
        kind: "base",
        design: joinDesign,
        actors,
      }),
      false,
    );
  }

  // Test 7: base kind - refresh type should be filtered out
  {
    const refreshDesign: AutoBeInterfaceEndpointDesign = {
      description: "Refresh token",
      authorizationActors: ["user"],
      authorizationType: "refresh",
      endpoint: { method: "post", path: "/auth/refresh" },
    };
    TestValidator.equals(
      "base with refresh type should fail",
      AutoBeInterfaceEndpointProgrammer.filter({
        kind: "base",
        design: refreshDesign,
        actors,
      }),
      false,
    );
  }

  // Test 8: base kind - session type should be filtered out
  {
    const sessionDesign: AutoBeInterfaceEndpointDesign = {
      description: "Get session",
      authorizationActors: ["user"],
      authorizationType: "session",
      endpoint: { method: "get", path: "/auth/session" },
    };
    TestValidator.equals(
      "base with session type should fail",
      AutoBeInterfaceEndpointProgrammer.filter({
        kind: "base",
        design: sessionDesign,
        actors,
      }),
      false,
    );
  }

  // Test 9: base kind - management and password types should pass
  {
    const managementDesign: AutoBeInterfaceEndpointDesign = {
      description: "Logout",
      authorizationActors: ["user"],
      authorizationType: "management",
      endpoint: { method: "post", path: "/auth/logout" },
    };
    TestValidator.equals(
      "base with management type should pass",
      AutoBeInterfaceEndpointProgrammer.filter({
        kind: "base",
        design: managementDesign,
        actors,
      }),
      true,
    );

    const passwordDesign: AutoBeInterfaceEndpointDesign = {
      description: "Change password",
      authorizationActors: ["user"],
      authorizationType: "password",
      endpoint: { method: "post", path: "/auth/password" },
    };
    TestValidator.equals(
      "base with password type should pass",
      AutoBeInterfaceEndpointProgrammer.filter({
        kind: "base",
        design: passwordDesign,
        actors,
      }),
      true,
    );
  }
};

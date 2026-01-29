import { AutoBeInterfaceEndpointProgrammer } from "@autobe/agent/src/orchestrate/interface/programmers/AutoBeInterfaceEndpointProgrammer";
import {
  AutoBeAnalyzeActor,
  AutoBeInterfaceEndpointDesign,
} from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import { IValidation } from "@samchon/openapi";

export const test_interface_endpoint_programmer_validate_design = (): void => {
  const actors: AutoBeAnalyzeActor[] = [
    { name: "user", kind: "member", description: "Regular user" },
    { name: "admin", kind: "admin", description: "Administrator" },
  ];

  // Test 1: valid actors - no errors
  {
    const validDesign: AutoBeInterfaceEndpointDesign = {
      description: "Get user profile",
      authorizationActors: ["user", "admin"],
      authorizationType: null,
      endpoint: { method: "get", path: "/users/profile" },
    };
    const errors: IValidation.IError[] = [];

    AutoBeInterfaceEndpointProgrammer.validateDesign({
      design: validDesign,
      actors,
      path: "$.designs[0]",
      errors,
    });

    TestValidator.equals("valid actors should have no errors", errors.length, 0);
  }

  // Test 2: invalid actor - should add error
  {
    const invalidDesign: AutoBeInterfaceEndpointDesign = {
      description: "Get seller dashboard",
      authorizationActors: ["seller"],
      authorizationType: null,
      endpoint: { method: "get", path: "/sellers/dashboard" },
    };
    const errors: IValidation.IError[] = [];

    AutoBeInterfaceEndpointProgrammer.validateDesign({
      design: invalidDesign,
      actors,
      path: "$.designs[0]",
      errors,
    });

    TestValidator.equals("invalid actor should add error", errors.length, 1);
    TestValidator.equals(
      "error path should be correct",
      errors[0].path,
      "$.designs[0].authorizationActors[0]",
    );
    TestValidator.equals("error value should be the invalid actor", errors[0].value, "seller");
    TestValidator.predicate(
      "error description should mention the invalid actor",
      () => errors[0].description?.includes("seller") ?? false,
    );
  }

  // Test 3: mixed valid and invalid actors - should add errors for invalid ones
  {
    const mixedDesign: AutoBeInterfaceEndpointDesign = {
      description: "Mixed authorization",
      authorizationActors: ["user", "seller", "moderator"],
      authorizationType: null,
      endpoint: { method: "get", path: "/mixed" },
    };
    const errors: IValidation.IError[] = [];

    AutoBeInterfaceEndpointProgrammer.validateDesign({
      design: mixedDesign,
      actors,
      path: "$.designs[0]",
      errors,
    });

    TestValidator.equals("should have 2 errors for invalid actors", errors.length, 2);
    TestValidator.equals(
      "first error path should be correct",
      errors[0].path,
      "$.designs[0].authorizationActors[1]",
    );
    TestValidator.equals("first error value should be seller", errors[0].value, "seller");
    TestValidator.equals(
      "second error path should be correct",
      errors[1].path,
      "$.designs[0].authorizationActors[2]",
    );
    TestValidator.equals("second error value should be moderator", errors[1].value, "moderator");
  }

  // Test 4: empty actors array - no errors
  {
    const emptyActorsDesign: AutoBeInterfaceEndpointDesign = {
      description: "Public endpoint",
      authorizationActors: [],
      authorizationType: null,
      endpoint: { method: "get", path: "/public" },
    };
    const errors: IValidation.IError[] = [];

    AutoBeInterfaceEndpointProgrammer.validateDesign({
      design: emptyActorsDesign,
      actors,
      path: "$.designs[0]",
      errors,
    });

    TestValidator.equals("empty authorizationActors should have no errors", errors.length, 0);
  }

  // Test 5: error expected field should list valid actors
  {
    const invalidDesign: AutoBeInterfaceEndpointDesign = {
      description: "Invalid actor endpoint",
      authorizationActors: ["unknown"],
      authorizationType: null,
      endpoint: { method: "get", path: "/unknown" },
    };
    const errors: IValidation.IError[] = [];

    AutoBeInterfaceEndpointProgrammer.validateDesign({
      design: invalidDesign,
      actors,
      path: "$.designs[0]",
      errors,
    });

    TestValidator.equals("should have 1 error", errors.length, 1);
    TestValidator.predicate(
      "expected should contain valid actor names",
      () =>
        errors[0].expected?.includes('"user"') === true &&
        errors[0].expected?.includes('"admin"') === true,
    );
  }
};

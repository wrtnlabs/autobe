import { AutoBeInterfaceEndpointProgrammer } from "@autobe/agent/src/orchestrate/interface/programmers/AutoBeInterfaceEndpointProgrammer";
import { AutoBeInterfaceEndpointDesign } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";

export const test_interface_endpoint_programmer_fix_design = () => {
  // Test 1: No path parameters - should remain unchanged
  testFixDesign({
    input: "/users",
    expected: "/users",
    description: "path without parameters",
  });

  // Test 2: Single path parameter in snake_case
  testFixDesign({
    input: "/users/{user_id}",
    expected: "/users/{userId}",
    description: "snake_case path parameter",
  });

  // Test 3: Single path parameter in kebab-case
  testFixDesign({
    input: "/articles/{article-id}",
    expected: "/articles/{articleId}",
    description: "kebab-case path parameter",
  });

  // Test 4: Single path parameter in PascalCase
  testFixDesign({
    input: "/users/{UserId}",
    expected: "/users/{userId}",
    description: "PascalCase path parameter",
  });

  // Test 5: Already camelCase - should remain unchanged
  testFixDesign({
    input: "/users/{userId}",
    expected: "/users/{userId}",
    description: "already camelCase path parameter",
  });

  // Test 6: Multiple path parameters in snake_case
  testFixDesign({
    input: "/users/{user_id}/posts/{post_id}",
    expected: "/users/{userId}/posts/{postId}",
    description: "multiple snake_case path parameters",
  });

  // Test 7: Multiple path parameters in kebab-case
  testFixDesign({
    input: "/articles/{article-id}/comments/{comment-id}",
    expected: "/articles/{articleId}/comments/{commentId}",
    description: "multiple kebab-case path parameters",
  });

  // Test 8: Mixed case path parameters
  testFixDesign({
    input: "/users/{user_id}/orders/{OrderId}/items/{item-id}",
    expected: "/users/{userId}/orders/{orderId}/items/{itemId}",
    description: "mixed case path parameters",
  });

  // Test 9: Deep nested path with multiple parameters
  testFixDesign({
    input: "/organizations/{org_id}/teams/{team_id}/members/{member_id}",
    expected: "/organizations/{orgId}/teams/{teamId}/members/{memberId}",
    description: "deep nested path with snake_case parameters",
  });

  // Test 10: Path with only static segments
  testFixDesign({
    input: "/api/health/check",
    expected: "/api/health/check",
    description: "path with only static segments",
  });

  // Test 11: Root path
  testFixDesign({
    input: "/",
    expected: "/",
    description: "root path",
  });

  // Test 12: Complex path with underscores in resource names (not parameters)
  testFixDesign({
    input: "/attachment_files/{file_id}",
    expected: "/attachment_files/{fileId}",
    description: "underscore in resource name with snake_case parameter",
  });

  // Test 13: SCREAMING_SNAKE_CASE path parameter
  testFixDesign({
    input: "/users/{USER_ID}",
    expected: "/users/{userId}",
    description: "SCREAMING_SNAKE_CASE path parameter",
  });

  // Test 14: Single letter parameter
  testFixDesign({
    input: "/items/{i}",
    expected: "/items/{i}",
    description: "single letter path parameter",
  });

  // Test 15: Parameter with numbers
  testFixDesign({
    input: "/users/{user_id_v2}",
    expected: "/users/{userIdV2}",
    description: "path parameter with numbers",
  });
};

const testFixDesign = (props: {
  input: string;
  expected: string;
  description: string;
}): void => {
  const design: AutoBeInterfaceEndpointDesign = createMockDesign(props.input);
  AutoBeInterfaceEndpointProgrammer.fixDesign({ design });
  TestValidator.equals(props.description, props.expected, design.endpoint.path);
};

const createMockDesign = (path: string): AutoBeInterfaceEndpointDesign => ({
  description: "Test endpoint",
  authorizationActors: [],
  authorizationType: null,
  endpoint: {
    path,
    method: "get",
  },
});

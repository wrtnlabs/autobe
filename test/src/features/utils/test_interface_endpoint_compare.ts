import { AutoBeOpenApi } from "@autobe/interface";
import { AutoBeOpenApiEndpointComparator } from "@autobe/utils";
import { TestValidator } from "@nestia/e2e";

export const test_interface_endpoint_compare = (): void => {
  const endpoints: AutoBeOpenApi.IEndpoint[] = [
    { method: "patch", path: "/customers" },
    { method: "post", path: "/customers" },
    { method: "post", path: "/sellers" },
    { method: "patch", path: "/sellers" },
  ];
  endpoints.sort(AutoBeOpenApiEndpointComparator.compare);
  TestValidator.equals("endpoints", endpoints, [
    { method: "patch", path: "/customers" },
    { method: "post", path: "/customers" },
    { method: "patch", path: "/sellers" },
    { method: "post", path: "/sellers" },
  ]);
};

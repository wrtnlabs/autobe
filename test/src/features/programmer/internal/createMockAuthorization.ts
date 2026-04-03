import { AutoBeRealizeAuthorization } from "@autobe/interface";

export function createMockAuthorization(props: {
  actorName: string;
  payloadName: string;
}): AutoBeRealizeAuthorization {
  return {
    actor: {
      name: props.actorName as any,
      kind: "member",
      description: "mock actor",
    },
    decorator: {
      name: "MockAuth" as any,
      location: "src/decorators/MockDecorator.ts",
      content: "// mock decorator",
    },
    payload: {
      name: props.payloadName as any,
      location: "src/decorators/payload/MockPayload.ts",
      content: "// mock payload",
    },
    provider: {
      name: "mockAuthorize" as any,
      location: "src/providers/MockProvider.ts",
      content: "// mock provider",
    },
  };
}

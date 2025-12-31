import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeEventSnapshot,
  AutoBeInterfaceAuthorizationEvent,
} from "@autobe/interface";

const main = async (): Promise<void> => {
  const snapshots: AutoBeEventSnapshot[] =
    await AutoBeExampleStorage.getSnapshots({
      vendor: "openai/gpt-4.1-mini",
      project: "todo",
      phase: "interface",
    });
  const authorizations: AutoBeInterfaceAuthorizationEvent[] = snapshots
    .map((s) => s.event)
    .filter((e) => e.type === "interfaceAuthorization");
  console.log(
    authorizations
      .map((a) =>
        a.operations.map((o) => ({
          actor: o.authorizationActor,
          type: o.authorizationType,
          method: o.method,
          path: o.path,
        })),
      )
      .flat(),
  );
};
main().catch(console.error);

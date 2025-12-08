import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeExampleProject,
  AutoBeHistory,
  AutoBeInterfaceHistory,
  AutoBeOpenApi,
} from "@autobe/interface";
import { AutoBeOpenApiTypeChecker } from "@autobe/utils";
import typia from "typia";

const iterate = async (props: {
  vendor: string;
  project: AutoBeExampleProject;
  interface: AutoBeInterfaceHistory;
}): Promise<void> => {
  const schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
    props.interface.document.components.schemas;
  for (const [key, value] of Object.entries(schemas))
    if (AutoBeOpenApiTypeChecker.isObject(value) === false)
      console.log(
        props.vendor,
        props.project,
        key,
        (value as any)?.type ??
          (value as any)?.oneOf?.map((v: any) => v.type ?? v.const),
      );
};

const main = async (): Promise<void> => {
  for (const vendor of await AutoBeExampleStorage.getVendorModels())
    for (const project of typia.misc.literals<AutoBeExampleProject>())
      try {
        const histories: AutoBeHistory[] =
          await AutoBeExampleStorage.getHistories({
            vendor,
            project,
            phase: "interface",
          });
        const found: AutoBeInterfaceHistory | undefined = histories.find(
          (h) => h.type === "interface",
        );
        if (found)
          await iterate({
            vendor,
            project,
            interface: found,
          });
      } catch {}
};
main().catch(console.error);

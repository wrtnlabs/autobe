import { AutoBeExampleStorage } from "@autobe/benchmark";
import { AutoBePrismaCompiler } from "@autobe/compiler";
import {
  AutoBeEventSnapshot,
  AutoBeExampleProject,
  AutoBeHistory,
} from "@autobe/interface";
import typia from "typia";

const PHASES = ["analyze", "prisma", "interface", "test", "realize"] as const;
const PRISMA_CLIENT = `"@prisma/client"`;
const PRISMA_SDK = `"@prisma/sdk"`;

const iterate = async (props: {
  histories: (data: AutoBeHistory[]) => Promise<void>;
  snapshots: (data: AutoBeEventSnapshot[]) => Promise<void>;
}): Promise<void> => {
  for (const vendor of await AutoBeExampleStorage.getVendorModels())
    for (const project of typia.misc.literals<AutoBeExampleProject>())
      for (const phase of PHASES.slice().reverse()) {
        if (
          (await AutoBeExampleStorage.has({
            vendor,
            project,
            phase,
          })) === false
        )
          continue;
        const histories: AutoBeHistory[] =
          await AutoBeExampleStorage.getHistories({
            vendor,
            project,
            phase,
          });
        const snapshots: AutoBeEventSnapshot[] =
          await AutoBeExampleStorage.getSnapshots({
            vendor,
            project,
            phase,
          });
        await props.histories(histories);
        await props.snapshots(snapshots);
        await AutoBeExampleStorage.save({
          vendor,
          project,
          files: {
            [`${phase}.histories.json`]: JSON.stringify(histories),
            [`${phase}.snapshots.json`]: JSON.stringify(snapshots),
          },
        });
      }
};

const main = async (): Promise<void> => {
  await iterate({
    histories: async (histories) => {
      for (const history of histories) {
        if (history.type === "prisma") {
          history.schemas = await new AutoBePrismaCompiler().write(
            history.result.data,
            "sqlite",
          );
          history.compiled = await new AutoBePrismaCompiler().compile({
            files: history.schemas,
          });
        } else if (history.type === "realize") {
          history.authorizations.forEach((auth) => {
            auth.provider.content = auth.provider.content.replaceAll(
              PRISMA_CLIENT,
              PRISMA_SDK,
            );
          });
          history.functions.forEach((func) => {
            func.content = func.content.replaceAll(PRISMA_CLIENT, PRISMA_SDK);
          });
        }
      }
    },
    snapshots: async (snapshots) => {
      for (const { event } of snapshots)
        if (event.type === "realizeWrite" || event.type === "realizeCorrect")
          event.content = event.content.replaceAll(PRISMA_CLIENT, PRISMA_SDK);
        else if (
          event.type === "realizeAuthorizationWrite" ||
          event.type === "realizeAuthorizationValidate" ||
          event.type === "realizeAuthorizationCorrect"
        )
          event.authorization.provider.content =
            event.authorization.provider.content.replaceAll(
              PRISMA_CLIENT,
              PRISMA_SDK,
            );
        else if (event.type === "prismaComplete") {
          event.schemas = await new AutoBePrismaCompiler().write(
            event.result.data,
            "sqlite",
          );
          event.compiled = await new AutoBePrismaCompiler().compile({
            files: event.schemas,
          });
        } else if (event.type === "realizeComplete") {
          event.authorizations.forEach((auth) => {
            auth.provider.content = auth.provider.content.replaceAll(
              PRISMA_CLIENT,
              PRISMA_SDK,
            );
          });
          event.functions.forEach((func) => {
            func.content = func.content.replaceAll(PRISMA_CLIENT, PRISMA_SDK);
          });
        }
    },
  });
};
main().catch(console.error);

import { JsonSchemaNamingConvention } from "@autobe/agent/src/orchestrate/interface/utils/JsonSchemaNamingConvention";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import { AutoBeHistory } from "@autobe/interface";
import { missedOpenApiSchemas } from "@autobe/utils";

const main = async (): Promise<void> => {
  const histories: AutoBeHistory[] = await AutoBeExampleStorage.getHistories({
    vendor: "openai/gpt-5.1",
    project: "reddit",
    phase: "interface",
  });
  const { document } = histories.find((h) => h.type === "interface")!;

  const matched = Object.keys(document.components.schemas).filter(
    (k) =>
      k.toLowerCase() ===
        "ICommunityPlatformMemberuserSession.ISummary".toLowerCase() ||
      k.toLowerCase() ===
        "ICommunityPlatformMemberuserGuestuser.ISummary".toLowerCase(),
  );
  console.log("actual existence", matched);

  const findMissed = (title: string) => {
    const missed: string[] = missedOpenApiSchemas(document);
    console.log("missed", title, missed);
  };
  findMissed("initial");

  JsonSchemaNamingConvention.schemas(
    document.operations,
    document.components.schemas,
  );
  findMissed("convention");
};
main().catch(console.error);

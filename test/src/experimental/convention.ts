import { AutoBeJsonSchemaFactory } from "@autobe/agent/src/orchestrate/interface/utils/AutoBeJsonSchemaFactory";
import { AutoBeJsonSchemaNamingConvention } from "@autobe/agent/src/orchestrate/interface/utils/AutoBeJsonSchemaNamingConvention";
import { AutoBeExampleStorage } from "@autobe/benchmark";

const main = async (): Promise<void> => {
  const histories = await AutoBeExampleStorage.getHistories({
    vendor: "openai/gpt-5.1",
    project: "reddit",
    phase: "interface",
  });
  const { document } = histories.find((h) => h.type === "interface")!;
  const {
    result: { data: application },
  } = histories.find((h) => h.type === "database")!;

  const trace = (title: string) =>
    console.log(
      title,
      Object.keys(document.components.schemas).filter(
        (k) =>
          k.toLowerCase() === "IRedditCommunityGuestUser".toLowerCase() ||
          k
            .toLowerCase()
            .startsWith("IRedditCommunityGuestUser.".toLowerCase()),
      ),
    );
  trace("initial");

  AutoBeJsonSchemaNamingConvention.schemas(
    document.operations,
    document.components.schemas,
  );
  trace("convention");

  AutoBeJsonSchemaFactory.finalize({
    document,
    application,
  });
  trace("finalize");
};
main().catch(console.error);

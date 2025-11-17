import { JsonSchemaFactory } from "@autobe/agent/src/orchestrate/interface/utils/JsonSchemaFactory";
import { JsonSchemaNamingConvention } from "@autobe/agent/src/orchestrate/interface/utils/JsonSchemaNamingConvention";
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
  } = histories.find((h) => h.type === "prisma")!;

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

  JsonSchemaNamingConvention.schemas(
    document.operations,
    document.components.schemas,
  );
  trace("convention");

  JsonSchemaFactory.finalize({
    document,
    application,
  });
  trace("finalize");
};
main().catch(console.error);

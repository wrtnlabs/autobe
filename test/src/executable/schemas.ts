import { Escaper } from "typia/lib/utils/Escaper";

import { TestHistory } from "../internal/TestHistory";

const main = async () => {
  const histories = await TestHistory.getHistories("reddit", "interface");
  const { document } = histories.find((h) => h.type === "interface")!;
  console.log(
    Object.keys(document.components.schemas).map((k) => [
      k,
      k.split(".").every(Escaper.variable),
    ]),
  );
};
main().catch(console.error);

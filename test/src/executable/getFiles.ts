import { TestHistory } from "../internal/TestHistory";

const main = async () => {
  const histories = await TestHistory.getHistories("bbs", "test");
  const test = histories.find((h) => h.type === "test");
  console.log(test?.files.map((f) => f.location));
};
main().catch(console.error);

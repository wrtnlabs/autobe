import { AutoBeEvent } from "@autobe/interface";
import typia from "typia";

const types: string[] = typia.misc.literals<AutoBeEvent.Type>();
for (const before of types) {
  const after: string = before
    .split(/(?=[A-Z])/)
    .map((word) => {
      if (word.length > 1 && word.endsWith("s")) return word.slice(0, -1);
      return word;
    })
    .join("");
  if (before !== after) console.log(`${before} => ${after}`);
}

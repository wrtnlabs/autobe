import { Escaper } from "typia/lib/utils/Escaper";

const variables = [
  "IShoppingSale.ISummary[]",
  "IPage<IShoppingSale>",
  "IShoppingSale",
];
console.log(variables.map((s) => s.split(".").every(Escaper.variable)));

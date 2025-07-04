import typia from "typia";

const schema = typia.llm.schema<ICat | IAnt, "chatgpt", { reference: true }>({
  $defs: {},
});
console.log(schema);

interface ICat {
  type: "cat";
  name: string;
  ribbon: boolean;
}
interface IAnt {
  type: "ant";
  name: string;
  role: "queen" | "soldier" | "worker";
}

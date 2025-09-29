import { CompressUtil } from "@autobe/filesystem";
import {
  AutoBeHistory,
  AutoBeInterfaceHistory,
  AutoBeOpenApi,
} from "@autobe/interface";
import { OpenApiTypeChecker } from "@samchon/openapi";
import fs from "fs";

import { TestGlobal } from "../TestGlobal";

const getMissed = (document: AutoBeOpenApi.IDocument): string[] => {
  const missed: Set<string> = new Set();
  const check = (name: string) => {
    if (document.components.schemas[name] === undefined) missed.add(name);
  };
  for (const op of document.operations) {
    if (op.requestBody !== null) check(op.requestBody.typeName);
    if (op.responseBody !== null) check(op.responseBody.typeName);
  }
  for (const value of Object.values(document.components.schemas))
    OpenApiTypeChecker.visit({
      components: document.components,
      schema: value,
      closure: (next) => {
        if (OpenApiTypeChecker.isReference(next))
          check(next.$ref.split("/").pop()!);
      },
    });
  return Array.from(missed);
};

const main = async (): Promise<void> => {
  const histories: AutoBeHistory[] = JSON.parse(
    await CompressUtil.gunzip(
      await fs.promises.readFile(
        `${TestGlobal.ROOT}/assets/histories/openai/gpt-4.1/shopping.interface.json.gz`,
      ),
    ),
  );
  const interfaceHistory: AutoBeInterfaceHistory | undefined = histories.find(
    (h) => h.type === "interface",
  );
  if (interfaceHistory === undefined)
    throw new Error("No interface history found");

  const document: AutoBeOpenApi.IDocument = interfaceHistory.document;
  console.log("keys", Object.keys(document.components.schemas).sort());
  console.log("missed", getMissed(document));
};
main().catch(console.error);

import { UnpkgDownloader } from "@autobe/compiler/src/utils/UnpkgDownloader";
import { TestValidator } from "@nestia/e2e";

export const test_compiler_unpkg = () => {
  const unpkg = new UnpkgDownloader();

  TestValidator.equals("package.json")(!!unpkg.get("typia", "package.json"))(
    true,
  );
  TestValidator.equals("index.d.ts")(!!unpkg.get("typia", "lib/index.d.ts"))(
    true,
  );
  TestValidator.equals("404")(!!unpkg.get("typia", "lib/index3344.d.ts"))(
    false,
  );
};

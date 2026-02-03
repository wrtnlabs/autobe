import { AutoBeTypeScriptCompiler } from "@autobe/compiler";
import { StringUtil } from "@autobe/utils";
import { TestValidator } from "@nestia/e2e";

export const test_compiler_typescript_beautify = async (): Promise<void> => {
  const compiler = new AutoBeTypeScriptCompiler();
  const value: string = await compiler.beautify(RAW);
  console.log(value);
  TestValidator.equals("beautify", false, value === RAW);
};

const RAW = StringUtil.trim`
  import { ArrayUtil, RandomGenerator } from "@nestia/e2e";
  import { randint } from "tstl";
  import typia, { tags } from "typia";
  import { DeepPartial } from "@ORGANIZATION/PROJECT-api/lib/typings/DeepPartial";
  import { IEntity } from "@ORGANIZATION/PROJECT-api/lib/structures/IEntity";
  import { IShoppingMallBroadcastNotification } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallBroadcastNotification";
  /**
   * aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa aaaa 
   */
  export function prepare_random_shopping_mall_broadcast_notification(
    input?: DeepPartial<IShoppingMallBroadcastNotification.ICreate> | undefined,
  ): IShoppingMallBroadcastNotification.ICreate {
    return {
      content: input?.content ?? RandomGenerator.content({
          paragraphs: typia.random<
            number & tags.Type<"uint32"> & tags.Minimum<2> & tags.Maximum<4>
          >(), 
          sentenceMin: 5, sentenceMax: 12,
          wordMin: 4, wordMax: 8,
        }).substring(0, 500),
    };
  }
`.trim();

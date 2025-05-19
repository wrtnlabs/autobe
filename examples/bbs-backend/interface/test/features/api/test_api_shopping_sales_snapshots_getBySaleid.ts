import api from "@ORGANIZATION/PROJECT-api";
import typia, { tags } from "typia";

;
import { IShoppingSaleSnapshot_alt__agt_ } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingSaleSnapshot_alt__agt_";

;
export async function test_api_shopping_sales_snapshots_getBySaleid(connection: api.IConnection) {
    const output: IShoppingSaleSnapshot_alt__agt_ = await api.functional.shopping.sales.snapshots.getBySaleid(connection, typia.random<string & tags.Format<"uuid">>());
    typia.assert(output);
}

import api from "@ORGANIZATION/PROJECT-api";
import typia from "typia";

;
import { IPageIShoppingMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMember";
import { IShoppingMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMember";

;
export async function test_api_shopping_members_patch(connection: api.IConnection) {
    const output: IPageIShoppingMember.ISummary = await api.functional.shopping.members.patch(connection, typia.random<IShoppingMember.IRequest>());
    typia.assert(output);
}

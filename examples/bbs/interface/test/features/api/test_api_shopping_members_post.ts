import api from "@ORGANIZATION/PROJECT-api";
import typia from "typia";

;
import { IShoppingMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMember";

;
export async function test_api_shopping_members_post(connection: api.IConnection) {
    const output: IShoppingMember = await api.functional.shopping.members.post(connection, typia.random<IShoppingMember.ICreate>());
    typia.assert(output);
}

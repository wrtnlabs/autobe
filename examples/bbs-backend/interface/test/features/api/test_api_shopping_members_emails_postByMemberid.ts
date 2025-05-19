import api from "@ORGANIZATION/PROJECT-api";
import typia, { tags } from "typia";

;
import { IShoppingMemberEmail } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMemberEmail";

;
export async function test_api_shopping_members_emails_postByMemberid(connection: api.IConnection) {
    const output: IShoppingMemberEmail = await api.functional.shopping.members.emails.postByMemberid(connection, typia.random<string & tags.Format<"uuid">>(), typia.random<IShoppingMemberEmail.ICreate>());
    typia.assert(output);
}

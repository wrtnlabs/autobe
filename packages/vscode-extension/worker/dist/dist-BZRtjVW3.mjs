import { __esm } from "./chunk-Dsqw6BSZ.mjs";
import { createHash } from "node:crypto";

//#region ../../../node_modules/.pnpm/ohash@2.0.11/node_modules/ohash/dist/crypto/node/index.mjs
function digest(t) {
	if (e) return e(r, t, s);
	const o = createHash(r).update(t);
	return globalThis.process?.versions?.webcontainer ? o.digest().toString(s) : o.digest(s);
}
var e, r, s;
var init_node = __esm({ "../../../node_modules/.pnpm/ohash@2.0.11/node_modules/ohash/dist/crypto/node/index.mjs": (() => {
	e = globalThis.process?.getBuiltinModule?.("crypto")?.hash, r = "sha256", s = "base64url";
}) });

//#endregion
//#region ../../../node_modules/.pnpm/ohash@2.0.11/node_modules/ohash/dist/index.mjs
var init_dist = __esm({ "../../../node_modules/.pnpm/ohash@2.0.11/node_modules/ohash/dist/index.mjs": (() => {
	init_node();
}) });

//#endregion
init_dist();
export { digest };
//# sourceMappingURL=dist-BZRtjVW3.mjs.map
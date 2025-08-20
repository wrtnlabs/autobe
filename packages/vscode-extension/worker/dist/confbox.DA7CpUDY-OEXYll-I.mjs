import { __esm } from "./chunk-Dsqw6BSZ.mjs";

//#region ../../../node_modules/.pnpm/confbox@0.2.2/node_modules/confbox/dist/shared/confbox.DA7CpUDY.mjs
function x(e, t = {}) {
	const n = t.indent === void 0 && t.preserveIndentation !== !1 && e.slice(0, t?.sampleSize || 1024), s = t.preserveWhitespace === !1 ? void 0 : {
		start: k.exec(e)?.[0] || "",
		end: v.exec(e)?.[0] || ""
	};
	return {
		sample: n,
		whiteSpace: s
	};
}
function N(e, t, n) {
	!t || typeof t != "object" || Object.defineProperty(t, m, {
		enumerable: !1,
		configurable: !0,
		writable: !0,
		value: x(e, n)
	});
}
var m, k, v;
var init_confbox_DA7CpUDY = __esm({ "../../../node_modules/.pnpm/confbox@0.2.2/node_modules/confbox/dist/shared/confbox.DA7CpUDY.mjs": (() => {
	m = Symbol.for("__confbox_fmt__"), k = /^(\s+)/, v = /(\s+)$/;
}) });

//#endregion
export { N, init_confbox_DA7CpUDY };
//# sourceMappingURL=confbox.DA7CpUDY-OEXYll-I.mjs.map
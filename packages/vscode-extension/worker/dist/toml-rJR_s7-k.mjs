import { __esm } from "./chunk-Dsqw6BSZ.mjs";
import { N, init_confbox_DA7CpUDY } from "./confbox.DA7CpUDY-OEXYll-I.mjs";

//#region ../../../node_modules/.pnpm/confbox@0.2.2/node_modules/confbox/dist/toml.mjs
/*!
* Copyright (c) Squirrel Chat et al., All rights reserved.
* SPDX-License-Identifier: BSD-3-Clause
*
* Redistribution and use in source and binary forms, with or without
* modification, are permitted provided that the following conditions are met:
*
* 1. Redistributions of source code must retain the above copyright notice, this
*    list of conditions and the following disclaimer.
* 2. Redistributions in binary form must reproduce the above copyright notice,
*    this list of conditions and the following disclaimer in the
*    documentation and/or other materials provided with the distribution.
* 3. Neither the name of the copyright holder nor the names of its contributors
*    may be used to endorse or promote products derived from this software without
*    specific prior written permission.
*
* THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
* ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
* WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
* DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
* FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
* DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
* SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
* CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
* OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
* OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/ function v(e, n) {
	let t = e.slice(0, n).split(/\r\n|\n|\r/g);
	return [t.length, t.pop().length + 1];
}
function C$1(e, n, t) {
	let l = e.split(/\r\n|\n|\r/g), r = "", i = (Math.log10(n + 1) | 0) + 1;
	for (let o = n - 1; o <= n + 1; o++) {
		let f = l[o - 1];
		f && (r += o.toString().padEnd(i, " "), r += ":  ", r += f, r += `
`, o === n && (r += " ".repeat(i + t + 2), r += `^
`));
	}
	return r;
}
/*!
* Copyright (c) Squirrel Chat et al., All rights reserved.
* SPDX-License-Identifier: BSD-3-Clause
*
* Redistribution and use in source and binary forms, with or without
* modification, are permitted provided that the following conditions are met:
*
* 1. Redistributions of source code must retain the above copyright notice, this
*    list of conditions and the following disclaimer.
* 2. Redistributions in binary form must reproduce the above copyright notice,
*    this list of conditions and the following disclaimer in the
*    documentation and/or other materials provided with the distribution.
* 3. Neither the name of the copyright holder nor the names of its contributors
*    may be used to endorse or promote products derived from this software without
*    specific prior written permission.
*
* THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
* ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
* WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
* DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
* FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
* DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
* SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
* CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
* OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
* OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/ function g(e, n = 0, t = e.length) {
	let l = e.indexOf(`
`, n);
	return e[l - 1] === "\r" && l--, l <= t ? l : -1;
}
function y(e, n) {
	for (let t = n; t < e.length; t++) {
		let l = e[t];
		if (l === `
`) return t;
		if (l === "\r" && e[t + 1] === `
`) return t + 1;
		if (l < " " && l !== "	" || l === "") throw new c("control characters are not allowed in comments", {
			toml: e,
			ptr: n
		});
	}
	return e.length;
}
function s(e, n, t, l) {
	let r;
	for (; (r = e[n]) === " " || r === "	" || !t && (r === `
` || r === "\r" && e[n + 1] === `
`);) n++;
	return l || r !== "#" ? n : s(e, y(e, n), t);
}
function A(e, n, t, l, r = !1) {
	if (!l) return n = g(e, n), n < 0 ? e.length : n;
	for (let i = n; i < e.length; i++) {
		let o = e[i];
		if (o === "#") i = g(e, i);
		else {
			if (o === t) return i + 1;
			if (o === l) return i;
			if (r && (o === `
` || o === "\r" && e[i + 1] === `
`)) return i;
		}
	}
	throw new c("cannot find end of structure", {
		toml: e,
		ptr: n
	});
}
function S(e, n) {
	let t = e[n], l = t === e[n + 1] && e[n + 1] === e[n + 2] ? e.slice(n, n + 3) : t;
	n += l.length - 1;
	do
		n = e.indexOf(l, ++n);
	while (n > -1 && t !== "'" && e[n - 1] === "\\" && e[n - 2] !== "\\");
	return n > -1 && (n += l.length, l.length > 1 && (e[n] === t && n++, e[n] === t && n++)), n;
}
function $(e, n = 0, t = e.length) {
	let l = e[n] === "'", r = e[n++] === e[n] && e[n] === e[n + 1];
	r && (t -= 2, e[n += 2] === "\r" && n++, e[n] === `
` && n++);
	let i = 0, o, f = "", a = n;
	for (; n < t - 1;) {
		let u = e[n++];
		if (u === `
` || u === "\r" && e[n] === `
`) {
			if (!r) throw new c("newlines are not allowed in strings", {
				toml: e,
				ptr: n - 1
			});
		} else if (u < " " && u !== "	" || u === "") throw new c("control characters are not allowed in strings", {
			toml: e,
			ptr: n - 1
		});
		if (o) {
			if (o = !1, u === "u" || u === "U") {
				let d = e.slice(n, n += u === "u" ? 4 : 8);
				if (!z.test(d)) throw new c("invalid unicode escape", {
					toml: e,
					ptr: i
				});
				try {
					f += String.fromCodePoint(parseInt(d, 16));
				} catch {
					throw new c("invalid unicode escape", {
						toml: e,
						ptr: i
					});
				}
			} else if (r && (u === `
` || u === " " || u === "	" || u === "\r")) {
				if (n = s(e, n - 1, !0), e[n] !== `
` && e[n] !== "\r") throw new c("invalid escape: only line-ending whitespace may be escaped", {
					toml: e,
					ptr: i
				});
				n = s(e, n);
			} else if (u in I) f += I[u];
			else throw new c("unrecognized escape sequence", {
				toml: e,
				ptr: i
			});
			a = n;
		} else !l && u === "\\" && (i = n - 1, o = !0, f += e.slice(a, i));
	}
	return f + e.slice(a, t - 1);
}
function F(e, n, t) {
	if (e === "true") return !0;
	if (e === "false") return !1;
	if (e === "-inf") return -Infinity;
	if (e === "inf" || e === "+inf") return Infinity;
	if (e === "nan" || e === "+nan" || e === "-nan") return NaN;
	if (e === "-0") return 0;
	let l;
	if ((l = M.test(e)) || Z.test(e)) {
		if (j.test(e)) throw new c("leading zeroes are not allowed", {
			toml: n,
			ptr: t
		});
		let i = +e.replace(/_/g, "");
		if (isNaN(i)) throw new c("invalid number", {
			toml: n,
			ptr: t
		});
		if (l && !Number.isSafeInteger(i)) throw new c("integer value cannot be represented losslessly", {
			toml: n,
			ptr: t
		});
		return i;
	}
	let r = new w(e);
	if (!r.isValid()) throw new c("invalid value", {
		toml: n,
		ptr: t
	});
	return r;
}
/*!
* Copyright (c) Squirrel Chat et al., All rights reserved.
* SPDX-License-Identifier: BSD-3-Clause
*
* Redistribution and use in source and binary forms, with or without
* modification, are permitted provided that the following conditions are met:
*
* 1. Redistributions of source code must retain the above copyright notice, this
*    list of conditions and the following disclaimer.
* 2. Redistributions in binary form must reproduce the above copyright notice,
*    this list of conditions and the following disclaimer in the
*    documentation and/or other materials provided with the distribution.
* 3. Neither the name of the copyright holder nor the names of its contributors
*    may be used to endorse or promote products derived from this software without
*    specific prior written permission.
*
* THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
* ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
* WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
* DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
* FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
* DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
* SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
* CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
* OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
* OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/ function V(e, n, t, l) {
	let r = e.slice(n, t), i = r.indexOf("#");
	i > -1 && (y(e, i), r = r.slice(0, i));
	let o = r.trimEnd();
	if (!l) {
		let f = r.indexOf(`
`, o.length);
		if (f > -1) throw new c("newlines are not allowed in inline tables", {
			toml: e,
			ptr: n + f
		});
	}
	return [o, i];
}
function b(e, n, t, l) {
	if (l === 0) throw new c("document contains excessively nested structures. aborting.", {
		toml: e,
		ptr: n
	});
	let r = e[n];
	if (r === "[" || r === "{") {
		let [f, a] = r === "[" ? U(e, n, l) : K(e, n, l), u = A(e, a, ",", t);
		if (t === "}") {
			let d = g(e, a, u);
			if (d > -1) throw new c("newlines are not allowed in inline tables", {
				toml: e,
				ptr: d
			});
		}
		return [f, u];
	}
	let i;
	if (r === "\"" || r === "'") {
		i = S(e, n);
		let f = $(e, n, i);
		if (t) {
			if (i = s(e, i, t !== "]"), e[i] && e[i] !== "," && e[i] !== t && e[i] !== `
` && e[i] !== "\r") throw new c("unexpected character encountered", {
				toml: e,
				ptr: i
			});
			i += +(e[i] === ",");
		}
		return [f, i];
	}
	i = A(e, n, ",", t);
	let o = V(e, n, i - +(e[i - 1] === ","), t === "]");
	if (!o[0]) throw new c("incomplete key-value declaration: no value specified", {
		toml: e,
		ptr: n
	});
	return t && o[1] > -1 && (i = s(e, n + o[1]), i += +(e[i] === ",")), [F(o[0], e, n), i];
}
function x(e, n, t = "=") {
	let l = n - 1, r = [], i = e.indexOf(t, n);
	if (i < 0) throw new c("incomplete key-value: cannot find end of key", {
		toml: e,
		ptr: n
	});
	do {
		let o = e[n = ++l];
		if (o !== " " && o !== "	") if (o === "\"" || o === "'") {
			if (o === e[n + 1] && o === e[n + 2]) throw new c("multiline strings are not allowed in keys", {
				toml: e,
				ptr: n
			});
			let f = S(e, n);
			if (f < 0) throw new c("unfinished string encountered", {
				toml: e,
				ptr: n
			});
			l = e.indexOf(".", f);
			let a = e.slice(f, l < 0 || l > i ? i : l), u = g(a);
			if (u > -1) throw new c("newlines are not allowed in keys", {
				toml: e,
				ptr: n + l + u
			});
			if (a.trimStart()) throw new c("found extra tokens after the string part", {
				toml: e,
				ptr: f
			});
			if (i < f && (i = e.indexOf(t, f), i < 0)) throw new c("incomplete key-value: cannot find end of key", {
				toml: e,
				ptr: n
			});
			r.push($(e, n, f));
		} else {
			l = e.indexOf(".", n);
			let f = e.slice(n, l < 0 || l > i ? i : l);
			if (!G.test(f)) throw new c("only letter, numbers, dashes and underscores are allowed in keys", {
				toml: e,
				ptr: n
			});
			r.push(f.trimEnd());
		}
	} while (l + 1 && l < i);
	return [r, s(e, i + 1, !0, !0)];
}
function K(e, n, t) {
	let l = {}, r = /* @__PURE__ */ new Set(), i, o = 0;
	for (n++; (i = e[n++]) !== "}" && i;) {
		if (i === `
`) throw new c("newlines are not allowed in inline tables", {
			toml: e,
			ptr: n - 1
		});
		if (i === "#") throw new c("inline tables cannot contain comments", {
			toml: e,
			ptr: n - 1
		});
		if (i === ",") throw new c("expected key-value, found comma", {
			toml: e,
			ptr: n - 1
		});
		if (i !== " " && i !== "	") {
			let f, a = l, u = !1, [d, N$1] = x(e, n - 1);
			for (let m = 0; m < d.length; m++) {
				if (m && (a = u ? a[f] : a[f] = {}), f = d[m], (u = Object.hasOwn(a, f)) && (typeof a[f] != "object" || r.has(a[f]))) throw new c("trying to redefine an already defined value", {
					toml: e,
					ptr: n
				});
				!u && f === "__proto__" && Object.defineProperty(a, f, {
					enumerable: !0,
					configurable: !0,
					writable: !0
				});
			}
			if (u) throw new c("trying to redefine an already defined value", {
				toml: e,
				ptr: n
			});
			let [_, k] = b(e, N$1, "}", t - 1);
			r.add(_), a[f] = _, n = k, o = e[n - 1] === "," ? n - 1 : 0;
		}
	}
	if (o) throw new c("trailing commas are not allowed in inline tables", {
		toml: e,
		ptr: o
	});
	if (!i) throw new c("unfinished table encountered", {
		toml: e,
		ptr: n
	});
	return [l, n];
}
function U(e, n, t) {
	let l = [], r;
	for (n++; (r = e[n++]) !== "]" && r;) {
		if (r === ",") throw new c("expected value, found comma", {
			toml: e,
			ptr: n - 1
		});
		if (r === "#") n = y(e, n);
		else if (r !== " " && r !== "	" && r !== `
` && r !== "\r") {
			let i = b(e, n - 1, "]", t - 1);
			l.push(i[0]), n = i[1];
		}
	}
	if (!r) throw new c("unfinished array encountered", {
		toml: e,
		ptr: n
	});
	return [l, n];
}
/*!
* Copyright (c) Squirrel Chat et al., All rights reserved.
* SPDX-License-Identifier: BSD-3-Clause
*
* Redistribution and use in source and binary forms, with or without
* modification, are permitted provided that the following conditions are met:
*
* 1. Redistributions of source code must retain the above copyright notice, this
*    list of conditions and the following disclaimer.
* 2. Redistributions in binary form must reproduce the above copyright notice,
*    this list of conditions and the following disclaimer in the
*    documentation and/or other materials provided with the distribution.
* 3. Neither the name of the copyright holder nor the names of its contributors
*    may be used to endorse or promote products derived from this software without
*    specific prior written permission.
*
* THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
* ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
* WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
* DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
* FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
* DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
* SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
* CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
* OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
* OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/ function p(e, n, t, l) {
	let r = n, i = t, o, f = !1, a;
	for (let u = 0; u < e.length; u++) {
		if (u) {
			if (r = f ? r[o] : r[o] = {}, i = (a = i[o]).c, l === 0 && (a.t === 1 || a.t === 2)) return null;
			if (a.t === 2) {
				let d = r.length - 1;
				r = r[d], i = i[d].c;
			}
		}
		if (o = e[u], (f = Object.hasOwn(r, o)) && i[o]?.t === 0 && i[o]?.d) return null;
		f || (o === "__proto__" && (Object.defineProperty(r, o, {
			enumerable: !0,
			configurable: !0,
			writable: !0
		}), Object.defineProperty(i, o, {
			enumerable: !0,
			configurable: !0,
			writable: !0
		})), i[o] = {
			t: u < e.length - 1 && l === 2 ? 3 : l,
			d: !1,
			i: 0,
			c: {}
		});
	}
	if (a = i[o], a.t !== l && !(l === 1 && a.t === 3) || (l === 2 && (a.d || (a.d = !0, r[o] = []), r[o].push(r = {}), a.c[a.i++] = a = {
		t: 1,
		d: !1,
		i: 0,
		c: {}
	}), a.d)) return null;
	if (a.d = !0, l === 1) r = f ? r[o] : r[o] = {};
	else if (l === 0 && f) return null;
	return [
		o,
		r,
		a.c
	];
}
function X(e, n) {
	let t = n?.maxDepth ?? 1e3, l = {}, r = {}, i = l, o = r;
	for (let f = s(e, 0); f < e.length;) {
		if (e[f] === "[") {
			let a = e[++f] === "[", u = x(e, f += +a, "]");
			if (a) {
				if (e[u[1] - 1] !== "]") throw new c("expected end of table declaration", {
					toml: e,
					ptr: u[1] - 1
				});
				u[1]++;
			}
			let d = p(u[0], l, r, a ? 2 : 1);
			if (!d) throw new c("trying to redefine an already defined table or value", {
				toml: e,
				ptr: f
			});
			o = d[2], i = d[1], f = u[1];
		} else {
			let a = x(e, f), u = p(a[0], i, o, 0);
			if (!u) throw new c("trying to redefine an already defined table or value", {
				toml: e,
				ptr: f
			});
			let d = b(e, a[1], void 0, t);
			u[1][u[0]] = d[0], f = d[1];
		}
		if (f = s(e, f, !0), e[f] && e[f] !== `
` && e[f] !== "\r") throw new c("each key-value declaration must be followed by an end-of-line", {
			toml: e,
			ptr: f
		});
		f = s(e, f);
	}
	return l;
}
function Q(e) {
	const n = X(e);
	return N(e, n, { preserveIndentation: !1 }), n;
}
var c, R, w, M, Z, j, z, I, G;
var init_toml = __esm({ "../../../node_modules/.pnpm/confbox@0.2.2/node_modules/confbox/dist/toml.mjs": (() => {
	init_confbox_DA7CpUDY();
	c = class extends Error {
		line;
		column;
		codeblock;
		constructor(n, t) {
			const [l, r] = v(t.toml, t.ptr), i = C$1(t.toml, l, r);
			super(`Invalid TOML document: ${n}

${i}`, t), this.line = l, this.column = r, this.codeblock = i;
		}
	};
	R = /^(\d{4}-\d{2}-\d{2})?[T ]?(?:(\d{2}):\d{2}:\d{2}(?:\.\d+)?)?(Z|[-+]\d{2}:\d{2})?$/i;
	w = class w extends Date {
		#n = !1;
		#t = !1;
		#e = null;
		constructor(n) {
			let t = !0, l = !0, r = "Z";
			if (typeof n == "string") {
				let i = n.match(R);
				i ? (i[1] || (t = !1, n = `0000-01-01T${n}`), l = !!i[2], i[2] && +i[2] > 23 ? n = "" : (r = i[3] || null, n = n.toUpperCase(), !r && l && (n += "Z"))) : n = "";
			}
			super(n), isNaN(this.getTime()) || (this.#n = t, this.#t = l, this.#e = r);
		}
		isDateTime() {
			return this.#n && this.#t;
		}
		isLocal() {
			return !this.#n || !this.#t || !this.#e;
		}
		isDate() {
			return this.#n && !this.#t;
		}
		isTime() {
			return this.#t && !this.#n;
		}
		isValid() {
			return this.#n || this.#t;
		}
		toISOString() {
			let n = super.toISOString();
			if (this.isDate()) return n.slice(0, 10);
			if (this.isTime()) return n.slice(11, 23);
			if (this.#e === null) return n.slice(0, -1);
			if (this.#e === "Z") return n;
			let t = +this.#e.slice(1, 3) * 60 + +this.#e.slice(4, 6);
			return t = this.#e[0] === "-" ? t : -t, (/* @__PURE__ */ new Date(this.getTime() - t * 6e4)).toISOString().slice(0, -1) + this.#e;
		}
		static wrapAsOffsetDateTime(n, t = "Z") {
			let l = new w(n);
			return l.#e = t, l;
		}
		static wrapAsLocalDateTime(n) {
			let t = new w(n);
			return t.#e = null, t;
		}
		static wrapAsLocalDate(n) {
			let t = new w(n);
			return t.#t = !1, t.#e = null, t;
		}
		static wrapAsLocalTime(n) {
			let t = new w(n);
			return t.#n = !1, t.#e = null, t;
		}
	};
	M = /^((0x[0-9a-fA-F](_?[0-9a-fA-F])*)|(([+-]|0[ob])?\d(_?\d)*))$/, Z = /^[+-]?\d(_?\d)*(\.\d(_?\d)*)?([eE][+-]?\d(_?\d)*)?$/, j = /^[+-]?0[0-9_]/, z = /^[0-9a-f]{4,8}$/i, I = {
		b: "\b",
		t: "	",
		n: `
`,
		f: "\f",
		r: "\r",
		"\"": "\"",
		"\\": "\\"
	};
	G = /^[a-zA-Z0-9-_]+[ \t]*$/;
}) });

//#endregion
export { Q, init_toml };
//# sourceMappingURL=toml-rJR_s7-k.mjs.map
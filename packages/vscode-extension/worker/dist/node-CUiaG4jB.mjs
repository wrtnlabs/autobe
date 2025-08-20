import { __commonJS, __require, __toDynamicImportESM } from "./chunk-Dsqw6BSZ.mjs";

//#region ../../../node_modules/.pnpm/node-fetch-native@1.6.7/node_modules/node-fetch-native/dist/shared/node-fetch-native.DhEqb06g.cjs
var require_node_fetch_native_DhEqb06g = /* @__PURE__ */ __commonJS({ "../../../node_modules/.pnpm/node-fetch-native@1.6.7/node_modules/node-fetch-native/dist/shared/node-fetch-native.DhEqb06g.cjs": ((exports) => {
	var l = Object.defineProperty;
	var o = (e$2, t$2) => l(e$2, "name", {
		value: t$2,
		configurable: !0
	});
	var commonjsGlobal = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
	function getDefaultExportFromCjs(e$2) {
		return e$2 && e$2.__esModule && Object.prototype.hasOwnProperty.call(e$2, "default") ? e$2.default : e$2;
	}
	o(getDefaultExportFromCjs, "getDefaultExportFromCjs"), exports.commonjsGlobal = commonjsGlobal, exports.getDefaultExportFromCjs = getDefaultExportFromCjs;
}) });

//#endregion
//#region ../../../node_modules/.pnpm/node-fetch-native@1.6.7/node_modules/node-fetch-native/dist/node.cjs
var require_node = /* @__PURE__ */ __commonJS({ "../../../node_modules/.pnpm/node-fetch-native@1.6.7/node_modules/node-fetch-native/dist/node.cjs": ((exports) => {
	var ys = Object.defineProperty;
	var Po = (c) => {
		throw TypeError(c);
	};
	var u = (c, l$1) => ys(c, "name", {
		value: l$1,
		configurable: !0
	});
	var vo = (c, l$1, d) => l$1.has(c) || Po("Cannot " + d);
	var D = (c, l$1, d) => (vo(c, l$1, "read from private field"), d ? d.call(c) : l$1.get(c)), ye = (c, l$1, d) => l$1.has(c) ? Po("Cannot add the same private member more than once") : l$1 instanceof WeakSet ? l$1.add(c) : l$1.set(c, d), ne = (c, l$1, d, g) => (vo(c, l$1, "write to private field"), g ? g.call(c, d) : l$1.set(c, d), d);
	var Pe, gt, ot, Zt, Oe, _t, St, it, oe, st, xe, Ue, at;
	Object.defineProperty(exports, "__esModule", { value: !0 });
	const http = __require("node:http"), https = __require("node:https"), zlib = __require("node:zlib"), Stream = __require("node:stream"), require$$0 = __require("node:buffer"), require$$0$1 = __require("node:util"), _commonjsHelpers = require_node_fetch_native_DhEqb06g(), require$$1 = __require("node:url"), require$$0$2 = __require("node:net"), node_fs = __require("node:fs"), node_path = __require("node:path");
	function _interopDefaultCompat(c) {
		return c && typeof c == "object" && "default" in c ? c.default : c;
	}
	u(_interopDefaultCompat, "_interopDefaultCompat");
	const http__default = _interopDefaultCompat(http), https__default = _interopDefaultCompat(https), zlib__default = _interopDefaultCompat(zlib), Stream__default = _interopDefaultCompat(Stream);
	function dataUriToBuffer(c) {
		if (!/^data:/i.test(c)) throw new TypeError("`uri` does not appear to be a Data URI (must begin with \"data:\")");
		c = c.replace(/\r?\n/g, "");
		const l$1 = c.indexOf(",");
		if (l$1 === -1 || l$1 <= 4) throw new TypeError("malformed data: URI");
		const d = c.substring(5, l$1).split(";");
		let g = "", b = !1;
		const R = d[0] || "text/plain";
		let w = R;
		for (let I = 1; I < d.length; I++) d[I] === "base64" ? b = !0 : d[I] && (w += `;${d[I]}`, d[I].indexOf("charset=") === 0 && (g = d[I].substring(8)));
		!d[0] && !g.length && (w += ";charset=US-ASCII", g = "US-ASCII");
		const A = b ? "base64" : "ascii", z = unescape(c.substring(l$1 + 1)), B = Buffer.from(z, A);
		return B.type = R, B.typeFull = w, B.charset = g, B;
	}
	u(dataUriToBuffer, "dataUriToBuffer");
	var streams = {}, ponyfill_es2018$1 = { exports: {} };
	/**
	* @license
	* web-streams-polyfill v3.3.3
	* Copyright 2024 Mattias Buelens, Diwank Singh Tomer and other contributors.
	* This code is released under the MIT license.
	* SPDX-License-Identifier: MIT
	*/ var ponyfill_es2018 = ponyfill_es2018$1.exports, hasRequiredPonyfill_es2018;
	function requirePonyfill_es2018() {
		return hasRequiredPonyfill_es2018 || (hasRequiredPonyfill_es2018 = 1, function(c, l$1) {
			(function(d, g) {
				g(l$1);
			})(ponyfill_es2018, function(d) {
				function g() {}
				u(g, "noop");
				function b(n) {
					return typeof n == "object" && n !== null || typeof n == "function";
				}
				u(b, "typeIsObject");
				const R = g;
				function w(n, o$1) {
					try {
						Object.defineProperty(n, "name", {
							value: o$1,
							configurable: !0
						});
					} catch {}
				}
				u(w, "setFunctionName");
				const A = Promise, z = Promise.prototype.then, B = Promise.reject.bind(A);
				function I(n) {
					return new A(n);
				}
				u(I, "newPromise");
				function k(n) {
					return I((o$1) => o$1(n));
				}
				u(k, "promiseResolvedWith");
				function T(n) {
					return B(n);
				}
				u(T, "promiseRejectedWith");
				function $(n, o$1, a) {
					return z.call(n, o$1, a);
				}
				u($, "PerformPromiseThen");
				function v(n, o$1, a) {
					$($(n, o$1, a), void 0, R);
				}
				u(v, "uponPromise");
				function K(n, o$1) {
					v(n, o$1);
				}
				u(K, "uponFulfillment");
				function U(n, o$1) {
					v(n, void 0, o$1);
				}
				u(U, "uponRejection");
				function N(n, o$1, a) {
					return $(n, o$1, a);
				}
				u(N, "transformPromiseWith");
				function J(n) {
					$(n, void 0, R);
				}
				u(J, "setPromiseIsHandledToTrue");
				let ge = u((n) => {
					if (typeof queueMicrotask == "function") ge = queueMicrotask;
					else {
						const o$1 = k(void 0);
						ge = u((a) => $(o$1, a), "_queueMicrotask");
					}
					return ge(n);
				}, "_queueMicrotask");
				function M(n, o$1, a) {
					if (typeof n != "function") throw new TypeError("Argument is not a function");
					return Function.prototype.apply.call(n, o$1, a);
				}
				u(M, "reflectCall");
				function H(n, o$1, a) {
					try {
						return k(M(n, o$1, a));
					} catch (p) {
						return T(p);
					}
				}
				u(H, "promiseCall");
				const Y = 16384, Dr = class Dr$1 {
					constructor() {
						this._cursor = 0, this._size = 0, this._front = {
							_elements: [],
							_next: void 0
						}, this._back = this._front, this._cursor = 0, this._size = 0;
					}
					get length() {
						return this._size;
					}
					push(o$1) {
						const a = this._back;
						let p = a;
						a._elements.length === Y - 1 && (p = {
							_elements: [],
							_next: void 0
						}), a._elements.push(o$1), p !== a && (this._back = p, a._next = p), ++this._size;
					}
					shift() {
						const o$1 = this._front;
						let a = o$1;
						const p = this._cursor;
						let y = p + 1;
						const _ = o$1._elements, S = _[p];
						return y === Y && (a = o$1._next, y = 0), --this._size, this._cursor = y, o$1 !== a && (this._front = a), _[p] = void 0, S;
					}
					forEach(o$1) {
						let a = this._cursor, p = this._front, y = p._elements;
						for (; (a !== y.length || p._next !== void 0) && !(a === y.length && (p = p._next, y = p._elements, a = 0, y.length === 0));) o$1(y[a]), ++a;
					}
					peek() {
						const o$1 = this._front, a = this._cursor;
						return o$1._elements[a];
					}
				};
				u(Dr, "SimpleQueue");
				let Q = Dr;
				const wt = Symbol("[[AbortSteps]]"), un = Symbol("[[ErrorSteps]]"), er = Symbol("[[CancelSteps]]"), tr = Symbol("[[PullSteps]]"), rr = Symbol("[[ReleaseSteps]]");
				function ln(n, o$1) {
					n._ownerReadableStream = o$1, o$1._reader = n, o$1._state === "readable" ? or(n) : o$1._state === "closed" ? Eo(n) : fn(n, o$1._storedError);
				}
				u(ln, "ReadableStreamReaderGenericInitialize");
				function nr(n, o$1) {
					const a = n._ownerReadableStream;
					return le(a, o$1);
				}
				u(nr, "ReadableStreamReaderGenericCancel");
				function _e(n) {
					const o$1 = n._ownerReadableStream;
					o$1._state === "readable" ? ir(n, /* @__PURE__ */ new TypeError("Reader was released and can no longer be used to monitor the stream's closedness")) : Ao(n, /* @__PURE__ */ new TypeError("Reader was released and can no longer be used to monitor the stream's closedness")), o$1._readableStreamController[rr](), o$1._reader = void 0, n._ownerReadableStream = void 0;
				}
				u(_e, "ReadableStreamReaderGenericRelease");
				function Rt(n) {
					return /* @__PURE__ */ new TypeError("Cannot " + n + " a stream using a released reader");
				}
				u(Rt, "readerLockException");
				function or(n) {
					n._closedPromise = I((o$1, a) => {
						n._closedPromise_resolve = o$1, n._closedPromise_reject = a;
					});
				}
				u(or, "defaultReaderClosedPromiseInitialize");
				function fn(n, o$1) {
					or(n), ir(n, o$1);
				}
				u(fn, "defaultReaderClosedPromiseInitializeAsRejected");
				function Eo(n) {
					or(n), cn(n);
				}
				u(Eo, "defaultReaderClosedPromiseInitializeAsResolved");
				function ir(n, o$1) {
					n._closedPromise_reject !== void 0 && (J(n._closedPromise), n._closedPromise_reject(o$1), n._closedPromise_resolve = void 0, n._closedPromise_reject = void 0);
				}
				u(ir, "defaultReaderClosedPromiseReject");
				function Ao(n, o$1) {
					fn(n, o$1);
				}
				u(Ao, "defaultReaderClosedPromiseResetToRejected");
				function cn(n) {
					n._closedPromise_resolve !== void 0 && (n._closedPromise_resolve(void 0), n._closedPromise_resolve = void 0, n._closedPromise_reject = void 0);
				}
				u(cn, "defaultReaderClosedPromiseResolve");
				const dn = Number.isFinite || function(n) {
					return typeof n == "number" && isFinite(n);
				}, Bo = Math.trunc || function(n) {
					return n < 0 ? Math.ceil(n) : Math.floor(n);
				};
				function qo(n) {
					return typeof n == "object" || typeof n == "function";
				}
				u(qo, "isDictionary");
				function ce(n, o$1) {
					if (n !== void 0 && !qo(n)) throw new TypeError(`${o$1} is not an object.`);
				}
				u(ce, "assertDictionary");
				function ee(n, o$1) {
					if (typeof n != "function") throw new TypeError(`${o$1} is not a function.`);
				}
				u(ee, "assertFunction");
				function ko(n) {
					return typeof n == "object" && n !== null || typeof n == "function";
				}
				u(ko, "isObject");
				function hn(n, o$1) {
					if (!ko(n)) throw new TypeError(`${o$1} is not an object.`);
				}
				u(hn, "assertObject");
				function Se(n, o$1, a) {
					if (n === void 0) throw new TypeError(`Parameter ${o$1} is required in '${a}'.`);
				}
				u(Se, "assertRequiredArgument");
				function sr(n, o$1, a) {
					if (n === void 0) throw new TypeError(`${o$1} is required in '${a}'.`);
				}
				u(sr, "assertRequiredField");
				function ar(n) {
					return Number(n);
				}
				u(ar, "convertUnrestrictedDouble");
				function pn(n) {
					return n === 0 ? 0 : n;
				}
				u(pn, "censorNegativeZero");
				function Wo(n) {
					return pn(Bo(n));
				}
				u(Wo, "integerPart");
				function ur(n, o$1) {
					const p = Number.MAX_SAFE_INTEGER;
					let y = Number(n);
					if (y = pn(y), !dn(y)) throw new TypeError(`${o$1} is not a finite number`);
					if (y = Wo(y), y < 0 || y > p) throw new TypeError(`${o$1} is outside the accepted range of 0 to ${p}, inclusive`);
					return !dn(y) || y === 0 ? 0 : y;
				}
				u(ur, "convertUnsignedLongLongWithEnforceRange");
				function lr(n, o$1) {
					if (!qe(n)) throw new TypeError(`${o$1} is not a ReadableStream.`);
				}
				u(lr, "assertReadableStream");
				function Ne(n) {
					return new de(n);
				}
				u(Ne, "AcquireReadableStreamDefaultReader");
				function bn(n, o$1) {
					n._reader._readRequests.push(o$1);
				}
				u(bn, "ReadableStreamAddReadRequest");
				function fr(n, o$1, a) {
					const y = n._reader._readRequests.shift();
					a ? y._closeSteps() : y._chunkSteps(o$1);
				}
				u(fr, "ReadableStreamFulfillReadRequest");
				function Tt(n) {
					return n._reader._readRequests.length;
				}
				u(Tt, "ReadableStreamGetNumReadRequests");
				function mn(n) {
					const o$1 = n._reader;
					return !(o$1 === void 0 || !ve(o$1));
				}
				u(mn, "ReadableStreamHasDefaultReader");
				const Mr = class Mr$1 {
					constructor(o$1) {
						if (Se(o$1, 1, "ReadableStreamDefaultReader"), lr(o$1, "First parameter"), ke(o$1)) throw new TypeError("This stream has already been locked for exclusive reading by another reader");
						ln(this, o$1), this._readRequests = new Q();
					}
					get closed() {
						return ve(this) ? this._closedPromise : T(Ct("closed"));
					}
					cancel(o$1 = void 0) {
						return ve(this) ? this._ownerReadableStream === void 0 ? T(Rt("cancel")) : nr(this, o$1) : T(Ct("cancel"));
					}
					read() {
						if (!ve(this)) return T(Ct("read"));
						if (this._ownerReadableStream === void 0) return T(Rt("read from"));
						let o$1, a;
						const p = I((_, S) => {
							o$1 = _, a = S;
						});
						return ut(this, {
							_chunkSteps: u((_) => o$1({
								value: _,
								done: !1
							}), "_chunkSteps"),
							_closeSteps: u(() => o$1({
								value: void 0,
								done: !0
							}), "_closeSteps"),
							_errorSteps: u((_) => a(_), "_errorSteps")
						}), p;
					}
					releaseLock() {
						if (!ve(this)) throw Ct("releaseLock");
						this._ownerReadableStream !== void 0 && Oo(this);
					}
				};
				u(Mr, "ReadableStreamDefaultReader");
				let de = Mr;
				Object.defineProperties(de.prototype, {
					cancel: { enumerable: !0 },
					read: { enumerable: !0 },
					releaseLock: { enumerable: !0 },
					closed: { enumerable: !0 }
				}), w(de.prototype.cancel, "cancel"), w(de.prototype.read, "read"), w(de.prototype.releaseLock, "releaseLock"), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(de.prototype, Symbol.toStringTag, {
					value: "ReadableStreamDefaultReader",
					configurable: !0
				});
				function ve(n) {
					return !b(n) || !Object.prototype.hasOwnProperty.call(n, "_readRequests") ? !1 : n instanceof de;
				}
				u(ve, "IsReadableStreamDefaultReader");
				function ut(n, o$1) {
					const a = n._ownerReadableStream;
					a._disturbed = !0, a._state === "closed" ? o$1._closeSteps() : a._state === "errored" ? o$1._errorSteps(a._storedError) : a._readableStreamController[tr](o$1);
				}
				u(ut, "ReadableStreamDefaultReaderRead");
				function Oo(n) {
					_e(n);
					const o$1 = /* @__PURE__ */ new TypeError("Reader was released");
					yn(n, o$1);
				}
				u(Oo, "ReadableStreamDefaultReaderRelease");
				function yn(n, o$1) {
					const a = n._readRequests;
					n._readRequests = new Q(), a.forEach((p) => {
						p._errorSteps(o$1);
					});
				}
				u(yn, "ReadableStreamDefaultReaderErrorReadRequests");
				function Ct(n) {
					return /* @__PURE__ */ new TypeError(`ReadableStreamDefaultReader.prototype.${n} can only be used on a ReadableStreamDefaultReader`);
				}
				u(Ct, "defaultReaderBrandCheckException");
				const zo = Object.getPrototypeOf(Object.getPrototypeOf(async function* () {}).prototype), xr = class xr$1 {
					constructor(o$1, a) {
						this._ongoingPromise = void 0, this._isFinished = !1, this._reader = o$1, this._preventCancel = a;
					}
					next() {
						const o$1 = u(() => this._nextSteps(), "nextSteps");
						return this._ongoingPromise = this._ongoingPromise ? N(this._ongoingPromise, o$1, o$1) : o$1(), this._ongoingPromise;
					}
					return(o$1) {
						const a = u(() => this._returnSteps(o$1), "returnSteps");
						return this._ongoingPromise ? N(this._ongoingPromise, a, a) : a();
					}
					_nextSteps() {
						if (this._isFinished) return Promise.resolve({
							value: void 0,
							done: !0
						});
						const o$1 = this._reader;
						let a, p;
						const y = I((S, C) => {
							a = S, p = C;
						});
						return ut(o$1, {
							_chunkSteps: u((S) => {
								this._ongoingPromise = void 0, ge(() => a({
									value: S,
									done: !1
								}));
							}, "_chunkSteps"),
							_closeSteps: u(() => {
								this._ongoingPromise = void 0, this._isFinished = !0, _e(o$1), a({
									value: void 0,
									done: !0
								});
							}, "_closeSteps"),
							_errorSteps: u((S) => {
								this._ongoingPromise = void 0, this._isFinished = !0, _e(o$1), p(S);
							}, "_errorSteps")
						}), y;
					}
					_returnSteps(o$1) {
						if (this._isFinished) return Promise.resolve({
							value: o$1,
							done: !0
						});
						this._isFinished = !0;
						const a = this._reader;
						if (!this._preventCancel) {
							const p = nr(a, o$1);
							return _e(a), N(p, () => ({
								value: o$1,
								done: !0
							}));
						}
						return _e(a), k({
							value: o$1,
							done: !0
						});
					}
				};
				u(xr, "ReadableStreamAsyncIteratorImpl");
				let Pt = xr;
				const gn = {
					next() {
						return _n(this) ? this._asyncIteratorImpl.next() : T(Sn("next"));
					},
					return(n) {
						return _n(this) ? this._asyncIteratorImpl.return(n) : T(Sn("return"));
					}
				};
				Object.setPrototypeOf(gn, zo);
				function Fo(n, o$1) {
					const a = Ne(n), p = new Pt(a, o$1), y = Object.create(gn);
					return y._asyncIteratorImpl = p, y;
				}
				u(Fo, "AcquireReadableStreamAsyncIterator");
				function _n(n) {
					if (!b(n) || !Object.prototype.hasOwnProperty.call(n, "_asyncIteratorImpl")) return !1;
					try {
						return n._asyncIteratorImpl instanceof Pt;
					} catch {
						return !1;
					}
				}
				u(_n, "IsReadableStreamAsyncIterator");
				function Sn(n) {
					return /* @__PURE__ */ new TypeError(`ReadableStreamAsyncIterator.${n} can only be used on a ReadableSteamAsyncIterator`);
				}
				u(Sn, "streamAsyncIteratorBrandCheckException");
				const wn = Number.isNaN || function(n) {
					return n !== n;
				};
				var cr, dr, hr;
				function lt(n) {
					return n.slice();
				}
				u(lt, "CreateArrayFromList");
				function Rn(n, o$1, a, p, y) {
					new Uint8Array(n).set(new Uint8Array(a, p, y), o$1);
				}
				u(Rn, "CopyDataBlockBytes");
				let we = u((n) => (typeof n.transfer == "function" ? we = u((o$1) => o$1.transfer(), "TransferArrayBuffer") : typeof structuredClone == "function" ? we = u((o$1) => structuredClone(o$1, { transfer: [o$1] }), "TransferArrayBuffer") : we = u((o$1) => o$1, "TransferArrayBuffer"), we(n)), "TransferArrayBuffer"), Ee = u((n) => (typeof n.detached == "boolean" ? Ee = u((o$1) => o$1.detached, "IsDetachedBuffer") : Ee = u((o$1) => o$1.byteLength === 0, "IsDetachedBuffer"), Ee(n)), "IsDetachedBuffer");
				function Tn(n, o$1, a) {
					if (n.slice) return n.slice(o$1, a);
					const p = a - o$1, y = new ArrayBuffer(p);
					return Rn(y, 0, n, o$1, p), y;
				}
				u(Tn, "ArrayBufferSlice");
				function vt(n, o$1) {
					const a = n[o$1];
					if (a != null) {
						if (typeof a != "function") throw new TypeError(`${String(o$1)} is not a function`);
						return a;
					}
				}
				u(vt, "GetMethod");
				function Io(n) {
					const o$1 = { [Symbol.iterator]: () => n.iterator }, a = async function* () {
						return yield* o$1;
					}(), p = a.next;
					return {
						iterator: a,
						nextMethod: p,
						done: !1
					};
				}
				u(Io, "CreateAsyncFromSyncIterator");
				const pr = (hr = (cr = Symbol.asyncIterator) !== null && cr !== void 0 ? cr : (dr = Symbol.for) === null || dr === void 0 ? void 0 : dr.call(Symbol, "Symbol.asyncIterator")) !== null && hr !== void 0 ? hr : "@@asyncIterator";
				function Cn(n, o$1 = "sync", a) {
					if (a === void 0) if (o$1 === "async") {
						if (a = vt(n, pr), a === void 0) {
							const _ = vt(n, Symbol.iterator), S = Cn(n, "sync", _);
							return Io(S);
						}
					} else a = vt(n, Symbol.iterator);
					if (a === void 0) throw new TypeError("The object is not iterable");
					const p = M(a, n, []);
					if (!b(p)) throw new TypeError("The iterator method must return an object");
					const y = p.next;
					return {
						iterator: p,
						nextMethod: y,
						done: !1
					};
				}
				u(Cn, "GetIterator");
				function jo(n) {
					const o$1 = M(n.nextMethod, n.iterator, []);
					if (!b(o$1)) throw new TypeError("The iterator.next() method must return an object");
					return o$1;
				}
				u(jo, "IteratorNext");
				function Lo(n) {
					return !!n.done;
				}
				u(Lo, "IteratorComplete");
				function $o(n) {
					return n.value;
				}
				u($o, "IteratorValue");
				function Do(n) {
					return !(typeof n != "number" || wn(n) || n < 0);
				}
				u(Do, "IsNonNegativeNumber");
				function Pn(n) {
					const o$1 = Tn(n.buffer, n.byteOffset, n.byteOffset + n.byteLength);
					return new Uint8Array(o$1);
				}
				u(Pn, "CloneAsUint8Array");
				function br(n) {
					const o$1 = n._queue.shift();
					return n._queueTotalSize -= o$1.size, n._queueTotalSize < 0 && (n._queueTotalSize = 0), o$1.value;
				}
				u(br, "DequeueValue");
				function mr(n, o$1, a) {
					if (!Do(a) || a === Infinity) throw new RangeError("Size must be a finite, non-NaN, non-negative number.");
					n._queue.push({
						value: o$1,
						size: a
					}), n._queueTotalSize += a;
				}
				u(mr, "EnqueueValueWithSize");
				function Mo(n) {
					return n._queue.peek().value;
				}
				u(Mo, "PeekQueueValue");
				function Ae(n) {
					n._queue = new Q(), n._queueTotalSize = 0;
				}
				u(Ae, "ResetQueue");
				function vn(n) {
					return n === DataView;
				}
				u(vn, "isDataViewConstructor");
				function xo(n) {
					return vn(n.constructor);
				}
				u(xo, "isDataView");
				function Uo(n) {
					return vn(n) ? 1 : n.BYTES_PER_ELEMENT;
				}
				u(Uo, "arrayBufferViewElementSize");
				const Ur = class Ur$1 {
					constructor() {
						throw new TypeError("Illegal constructor");
					}
					get view() {
						if (!yr(this)) throw Rr("view");
						return this._view;
					}
					respond(o$1) {
						if (!yr(this)) throw Rr("respond");
						if (Se(o$1, 1, "respond"), o$1 = ur(o$1, "First parameter"), this._associatedReadableByteStreamController === void 0) throw new TypeError("This BYOB request has been invalidated");
						if (Ee(this._view.buffer)) throw new TypeError("The BYOB request's buffer has been detached and so cannot be used as a response");
						qt(this._associatedReadableByteStreamController, o$1);
					}
					respondWithNewView(o$1) {
						if (!yr(this)) throw Rr("respondWithNewView");
						if (Se(o$1, 1, "respondWithNewView"), !ArrayBuffer.isView(o$1)) throw new TypeError("You can only respond with array buffer views");
						if (this._associatedReadableByteStreamController === void 0) throw new TypeError("This BYOB request has been invalidated");
						if (Ee(o$1.buffer)) throw new TypeError("The given view's buffer has been detached and so cannot be used as a response");
						kt(this._associatedReadableByteStreamController, o$1);
					}
				};
				u(Ur, "ReadableStreamBYOBRequest");
				let Re = Ur;
				Object.defineProperties(Re.prototype, {
					respond: { enumerable: !0 },
					respondWithNewView: { enumerable: !0 },
					view: { enumerable: !0 }
				}), w(Re.prototype.respond, "respond"), w(Re.prototype.respondWithNewView, "respondWithNewView"), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(Re.prototype, Symbol.toStringTag, {
					value: "ReadableStreamBYOBRequest",
					configurable: !0
				});
				const Nr = class Nr$1 {
					constructor() {
						throw new TypeError("Illegal constructor");
					}
					get byobRequest() {
						if (!ze(this)) throw ct("byobRequest");
						return wr(this);
					}
					get desiredSize() {
						if (!ze(this)) throw ct("desiredSize");
						return In(this);
					}
					close() {
						if (!ze(this)) throw ct("close");
						if (this._closeRequested) throw new TypeError("The stream has already been closed; do not close it again!");
						const o$1 = this._controlledReadableByteStream._state;
						if (o$1 !== "readable") throw new TypeError(`The stream (in ${o$1} state) is not in the readable state and cannot be closed`);
						ft(this);
					}
					enqueue(o$1) {
						if (!ze(this)) throw ct("enqueue");
						if (Se(o$1, 1, "enqueue"), !ArrayBuffer.isView(o$1)) throw new TypeError("chunk must be an array buffer view");
						if (o$1.byteLength === 0) throw new TypeError("chunk must have non-zero byteLength");
						if (o$1.buffer.byteLength === 0) throw new TypeError("chunk's buffer must have non-zero byteLength");
						if (this._closeRequested) throw new TypeError("stream is closed or draining");
						const a = this._controlledReadableByteStream._state;
						if (a !== "readable") throw new TypeError(`The stream (in ${a} state) is not in the readable state and cannot be enqueued to`);
						Bt(this, o$1);
					}
					error(o$1 = void 0) {
						if (!ze(this)) throw ct("error");
						te(this, o$1);
					}
					[er](o$1) {
						En(this), Ae(this);
						const a = this._cancelAlgorithm(o$1);
						return At(this), a;
					}
					[tr](o$1) {
						const a = this._controlledReadableByteStream;
						if (this._queueTotalSize > 0) {
							Fn(this, o$1);
							return;
						}
						const p = this._autoAllocateChunkSize;
						if (p !== void 0) {
							let y;
							try {
								y = new ArrayBuffer(p);
							} catch (S) {
								o$1._errorSteps(S);
								return;
							}
							const _ = {
								buffer: y,
								bufferByteLength: p,
								byteOffset: 0,
								byteLength: p,
								bytesFilled: 0,
								minimumFill: 1,
								elementSize: 1,
								viewConstructor: Uint8Array,
								readerType: "default"
							};
							this._pendingPullIntos.push(_);
						}
						bn(a, o$1), Fe(this);
					}
					[rr]() {
						if (this._pendingPullIntos.length > 0) {
							const o$1 = this._pendingPullIntos.peek();
							o$1.readerType = "none", this._pendingPullIntos = new Q(), this._pendingPullIntos.push(o$1);
						}
					}
				};
				u(Nr, "ReadableByteStreamController");
				let ie = Nr;
				Object.defineProperties(ie.prototype, {
					close: { enumerable: !0 },
					enqueue: { enumerable: !0 },
					error: { enumerable: !0 },
					byobRequest: { enumerable: !0 },
					desiredSize: { enumerable: !0 }
				}), w(ie.prototype.close, "close"), w(ie.prototype.enqueue, "enqueue"), w(ie.prototype.error, "error"), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(ie.prototype, Symbol.toStringTag, {
					value: "ReadableByteStreamController",
					configurable: !0
				});
				function ze(n) {
					return !b(n) || !Object.prototype.hasOwnProperty.call(n, "_controlledReadableByteStream") ? !1 : n instanceof ie;
				}
				u(ze, "IsReadableByteStreamController");
				function yr(n) {
					return !b(n) || !Object.prototype.hasOwnProperty.call(n, "_associatedReadableByteStreamController") ? !1 : n instanceof Re;
				}
				u(yr, "IsReadableStreamBYOBRequest");
				function Fe(n) {
					if (!Yo(n)) return;
					if (n._pulling) {
						n._pullAgain = !0;
						return;
					}
					n._pulling = !0;
					const a = n._pullAlgorithm();
					v(a, () => (n._pulling = !1, n._pullAgain && (n._pullAgain = !1, Fe(n)), null), (p) => (te(n, p), null));
				}
				u(Fe, "ReadableByteStreamControllerCallPullIfNeeded");
				function En(n) {
					_r(n), n._pendingPullIntos = new Q();
				}
				u(En, "ReadableByteStreamControllerClearPendingPullIntos");
				function gr(n, o$1) {
					let a = !1;
					n._state === "closed" && (a = !0);
					const p = An(o$1);
					o$1.readerType === "default" ? fr(n, p, a) : ei(n, p, a);
				}
				u(gr, "ReadableByteStreamControllerCommitPullIntoDescriptor");
				function An(n) {
					const o$1 = n.bytesFilled, a = n.elementSize;
					return new n.viewConstructor(n.buffer, n.byteOffset, o$1 / a);
				}
				u(An, "ReadableByteStreamControllerConvertPullIntoDescriptor");
				function Et(n, o$1, a, p) {
					n._queue.push({
						buffer: o$1,
						byteOffset: a,
						byteLength: p
					}), n._queueTotalSize += p;
				}
				u(Et, "ReadableByteStreamControllerEnqueueChunkToQueue");
				function Bn(n, o$1, a, p) {
					let y;
					try {
						y = Tn(o$1, a, a + p);
					} catch (_) {
						throw te(n, _), _;
					}
					Et(n, y, 0, p);
				}
				u(Bn, "ReadableByteStreamControllerEnqueueClonedChunkToQueue");
				function qn(n, o$1) {
					o$1.bytesFilled > 0 && Bn(n, o$1.buffer, o$1.byteOffset, o$1.bytesFilled), He(n);
				}
				u(qn, "ReadableByteStreamControllerEnqueueDetachedPullIntoToQueue");
				function kn(n, o$1) {
					const a = Math.min(n._queueTotalSize, o$1.byteLength - o$1.bytesFilled), p = o$1.bytesFilled + a;
					let y = a, _ = !1;
					const S = p % o$1.elementSize, C = p - S;
					C >= o$1.minimumFill && (y = C - o$1.bytesFilled, _ = !0);
					const q = n._queue;
					for (; y > 0;) {
						const P = q.peek(), W = Math.min(y, P.byteLength), O = o$1.byteOffset + o$1.bytesFilled;
						Rn(o$1.buffer, O, P.buffer, P.byteOffset, W), P.byteLength === W ? q.shift() : (P.byteOffset += W, P.byteLength -= W), n._queueTotalSize -= W, Wn(n, W, o$1), y -= W;
					}
					return _;
				}
				u(kn, "ReadableByteStreamControllerFillPullIntoDescriptorFromQueue");
				function Wn(n, o$1, a) {
					a.bytesFilled += o$1;
				}
				u(Wn, "ReadableByteStreamControllerFillHeadPullIntoDescriptor");
				function On(n) {
					n._queueTotalSize === 0 && n._closeRequested ? (At(n), yt(n._controlledReadableByteStream)) : Fe(n);
				}
				u(On, "ReadableByteStreamControllerHandleQueueDrain");
				function _r(n) {
					n._byobRequest !== null && (n._byobRequest._associatedReadableByteStreamController = void 0, n._byobRequest._view = null, n._byobRequest = null);
				}
				u(_r, "ReadableByteStreamControllerInvalidateBYOBRequest");
				function Sr(n) {
					for (; n._pendingPullIntos.length > 0;) {
						if (n._queueTotalSize === 0) return;
						const o$1 = n._pendingPullIntos.peek();
						kn(n, o$1) && (He(n), gr(n._controlledReadableByteStream, o$1));
					}
				}
				u(Sr, "ReadableByteStreamControllerProcessPullIntoDescriptorsUsingQueue");
				function No(n) {
					const o$1 = n._controlledReadableByteStream._reader;
					for (; o$1._readRequests.length > 0;) {
						if (n._queueTotalSize === 0) return;
						const a = o$1._readRequests.shift();
						Fn(n, a);
					}
				}
				u(No, "ReadableByteStreamControllerProcessReadRequestsUsingQueue");
				function Ho(n, o$1, a, p) {
					const y = n._controlledReadableByteStream, _ = o$1.constructor, S = Uo(_), { byteOffset: C, byteLength: q } = o$1, P = a * S;
					let W;
					try {
						W = we(o$1.buffer);
					} catch (j) {
						p._errorSteps(j);
						return;
					}
					const O = {
						buffer: W,
						bufferByteLength: W.byteLength,
						byteOffset: C,
						byteLength: q,
						bytesFilled: 0,
						minimumFill: P,
						elementSize: S,
						viewConstructor: _,
						readerType: "byob"
					};
					if (n._pendingPullIntos.length > 0) {
						n._pendingPullIntos.push(O), $n(y, p);
						return;
					}
					if (y._state === "closed") {
						const j = new _(O.buffer, O.byteOffset, 0);
						p._closeSteps(j);
						return;
					}
					if (n._queueTotalSize > 0) {
						if (kn(n, O)) {
							const j = An(O);
							On(n), p._chunkSteps(j);
							return;
						}
						if (n._closeRequested) {
							const j = /* @__PURE__ */ new TypeError("Insufficient bytes to fill elements in the given buffer");
							te(n, j), p._errorSteps(j);
							return;
						}
					}
					n._pendingPullIntos.push(O), $n(y, p), Fe(n);
				}
				u(Ho, "ReadableByteStreamControllerPullInto");
				function Vo(n, o$1) {
					o$1.readerType === "none" && He(n);
					const a = n._controlledReadableByteStream;
					if (Tr(a)) for (; Dn(a) > 0;) {
						const p = He(n);
						gr(a, p);
					}
				}
				u(Vo, "ReadableByteStreamControllerRespondInClosedState");
				function Qo(n, o$1, a) {
					if (Wn(n, o$1, a), a.readerType === "none") {
						qn(n, a), Sr(n);
						return;
					}
					if (a.bytesFilled < a.minimumFill) return;
					He(n);
					const p = a.bytesFilled % a.elementSize;
					if (p > 0) {
						const y = a.byteOffset + a.bytesFilled;
						Bn(n, a.buffer, y - p, p);
					}
					a.bytesFilled -= p, gr(n._controlledReadableByteStream, a), Sr(n);
				}
				u(Qo, "ReadableByteStreamControllerRespondInReadableState");
				function zn(n, o$1) {
					const a = n._pendingPullIntos.peek();
					_r(n), n._controlledReadableByteStream._state === "closed" ? Vo(n, a) : Qo(n, o$1, a), Fe(n);
				}
				u(zn, "ReadableByteStreamControllerRespondInternal");
				function He(n) {
					return n._pendingPullIntos.shift();
				}
				u(He, "ReadableByteStreamControllerShiftPendingPullInto");
				function Yo(n) {
					const o$1 = n._controlledReadableByteStream;
					return o$1._state !== "readable" || n._closeRequested || !n._started ? !1 : !!(mn(o$1) && Tt(o$1) > 0 || Tr(o$1) && Dn(o$1) > 0 || In(n) > 0);
				}
				u(Yo, "ReadableByteStreamControllerShouldCallPull");
				function At(n) {
					n._pullAlgorithm = void 0, n._cancelAlgorithm = void 0;
				}
				u(At, "ReadableByteStreamControllerClearAlgorithms");
				function ft(n) {
					const o$1 = n._controlledReadableByteStream;
					if (!(n._closeRequested || o$1._state !== "readable")) {
						if (n._queueTotalSize > 0) {
							n._closeRequested = !0;
							return;
						}
						if (n._pendingPullIntos.length > 0) {
							const a = n._pendingPullIntos.peek();
							if (a.bytesFilled % a.elementSize !== 0) {
								const p = /* @__PURE__ */ new TypeError("Insufficient bytes to fill elements in the given buffer");
								throw te(n, p), p;
							}
						}
						At(n), yt(o$1);
					}
				}
				u(ft, "ReadableByteStreamControllerClose");
				function Bt(n, o$1) {
					const a = n._controlledReadableByteStream;
					if (n._closeRequested || a._state !== "readable") return;
					const { buffer: p, byteOffset: y, byteLength: _ } = o$1;
					if (Ee(p)) throw new TypeError("chunk's buffer is detached and so cannot be enqueued");
					const S = we(p);
					if (n._pendingPullIntos.length > 0) {
						const C = n._pendingPullIntos.peek();
						if (Ee(C.buffer)) throw new TypeError("The BYOB request's buffer has been detached and so cannot be filled with an enqueued chunk");
						_r(n), C.buffer = we(C.buffer), C.readerType === "none" && qn(n, C);
					}
					if (mn(a)) if (No(n), Tt(a) === 0) Et(n, S, y, _);
					else {
						n._pendingPullIntos.length > 0 && He(n);
						const C = new Uint8Array(S, y, _);
						fr(a, C, !1);
					}
					else Tr(a) ? (Et(n, S, y, _), Sr(n)) : Et(n, S, y, _);
					Fe(n);
				}
				u(Bt, "ReadableByteStreamControllerEnqueue");
				function te(n, o$1) {
					const a = n._controlledReadableByteStream;
					a._state === "readable" && (En(n), Ae(n), At(n), fo(a, o$1));
				}
				u(te, "ReadableByteStreamControllerError");
				function Fn(n, o$1) {
					const a = n._queue.shift();
					n._queueTotalSize -= a.byteLength, On(n);
					const p = new Uint8Array(a.buffer, a.byteOffset, a.byteLength);
					o$1._chunkSteps(p);
				}
				u(Fn, "ReadableByteStreamControllerFillReadRequestFromQueue");
				function wr(n) {
					if (n._byobRequest === null && n._pendingPullIntos.length > 0) {
						const o$1 = n._pendingPullIntos.peek(), a = new Uint8Array(o$1.buffer, o$1.byteOffset + o$1.bytesFilled, o$1.byteLength - o$1.bytesFilled), p = Object.create(Re.prototype);
						Zo(p, n, a), n._byobRequest = p;
					}
					return n._byobRequest;
				}
				u(wr, "ReadableByteStreamControllerGetBYOBRequest");
				function In(n) {
					const o$1 = n._controlledReadableByteStream._state;
					return o$1 === "errored" ? null : o$1 === "closed" ? 0 : n._strategyHWM - n._queueTotalSize;
				}
				u(In, "ReadableByteStreamControllerGetDesiredSize");
				function qt(n, o$1) {
					const a = n._pendingPullIntos.peek();
					if (n._controlledReadableByteStream._state === "closed") {
						if (o$1 !== 0) throw new TypeError("bytesWritten must be 0 when calling respond() on a closed stream");
					} else {
						if (o$1 === 0) throw new TypeError("bytesWritten must be greater than 0 when calling respond() on a readable stream");
						if (a.bytesFilled + o$1 > a.byteLength) throw new RangeError("bytesWritten out of range");
					}
					a.buffer = we(a.buffer), zn(n, o$1);
				}
				u(qt, "ReadableByteStreamControllerRespond");
				function kt(n, o$1) {
					const a = n._pendingPullIntos.peek();
					if (n._controlledReadableByteStream._state === "closed") {
						if (o$1.byteLength !== 0) throw new TypeError("The view's length must be 0 when calling respondWithNewView() on a closed stream");
					} else if (o$1.byteLength === 0) throw new TypeError("The view's length must be greater than 0 when calling respondWithNewView() on a readable stream");
					if (a.byteOffset + a.bytesFilled !== o$1.byteOffset) throw new RangeError("The region specified by view does not match byobRequest");
					if (a.bufferByteLength !== o$1.buffer.byteLength) throw new RangeError("The buffer of view has different capacity than byobRequest");
					if (a.bytesFilled + o$1.byteLength > a.byteLength) throw new RangeError("The region specified by view is larger than byobRequest");
					const y = o$1.byteLength;
					a.buffer = we(o$1.buffer), zn(n, y);
				}
				u(kt, "ReadableByteStreamControllerRespondWithNewView");
				function jn(n, o$1, a, p, y, _, S) {
					o$1._controlledReadableByteStream = n, o$1._pullAgain = !1, o$1._pulling = !1, o$1._byobRequest = null, o$1._queue = o$1._queueTotalSize = void 0, Ae(o$1), o$1._closeRequested = !1, o$1._started = !1, o$1._strategyHWM = _, o$1._pullAlgorithm = p, o$1._cancelAlgorithm = y, o$1._autoAllocateChunkSize = S, o$1._pendingPullIntos = new Q(), n._readableStreamController = o$1;
					const C = a();
					v(k(C), () => (o$1._started = !0, Fe(o$1), null), (q) => (te(o$1, q), null));
				}
				u(jn, "SetUpReadableByteStreamController");
				function Go(n, o$1, a) {
					const p = Object.create(ie.prototype);
					let y, _, S;
					o$1.start !== void 0 ? y = u(() => o$1.start(p), "startAlgorithm") : y = u(() => {}, "startAlgorithm"), o$1.pull !== void 0 ? _ = u(() => o$1.pull(p), "pullAlgorithm") : _ = u(() => k(void 0), "pullAlgorithm"), o$1.cancel !== void 0 ? S = u((q) => o$1.cancel(q), "cancelAlgorithm") : S = u(() => k(void 0), "cancelAlgorithm");
					const C = o$1.autoAllocateChunkSize;
					if (C === 0) throw new TypeError("autoAllocateChunkSize must be greater than 0");
					jn(n, p, y, _, S, a, C);
				}
				u(Go, "SetUpReadableByteStreamControllerFromUnderlyingSource");
				function Zo(n, o$1, a) {
					n._associatedReadableByteStreamController = o$1, n._view = a;
				}
				u(Zo, "SetUpReadableStreamBYOBRequest");
				function Rr(n) {
					return /* @__PURE__ */ new TypeError(`ReadableStreamBYOBRequest.prototype.${n} can only be used on a ReadableStreamBYOBRequest`);
				}
				u(Rr, "byobRequestBrandCheckException");
				function ct(n) {
					return /* @__PURE__ */ new TypeError(`ReadableByteStreamController.prototype.${n} can only be used on a ReadableByteStreamController`);
				}
				u(ct, "byteStreamControllerBrandCheckException");
				function Ko(n, o$1) {
					ce(n, o$1);
					const a = n?.mode;
					return { mode: a === void 0 ? void 0 : Jo(a, `${o$1} has member 'mode' that`) };
				}
				u(Ko, "convertReaderOptions");
				function Jo(n, o$1) {
					if (n = `${n}`, n !== "byob") throw new TypeError(`${o$1} '${n}' is not a valid enumeration value for ReadableStreamReaderMode`);
					return n;
				}
				u(Jo, "convertReadableStreamReaderMode");
				function Xo(n, o$1) {
					var a;
					ce(n, o$1);
					const p = (a = n?.min) !== null && a !== void 0 ? a : 1;
					return { min: ur(p, `${o$1} has member 'min' that`) };
				}
				u(Xo, "convertByobReadOptions");
				function Ln(n) {
					return new he(n);
				}
				u(Ln, "AcquireReadableStreamBYOBReader");
				function $n(n, o$1) {
					n._reader._readIntoRequests.push(o$1);
				}
				u($n, "ReadableStreamAddReadIntoRequest");
				function ei(n, o$1, a) {
					const y = n._reader._readIntoRequests.shift();
					a ? y._closeSteps(o$1) : y._chunkSteps(o$1);
				}
				u(ei, "ReadableStreamFulfillReadIntoRequest");
				function Dn(n) {
					return n._reader._readIntoRequests.length;
				}
				u(Dn, "ReadableStreamGetNumReadIntoRequests");
				function Tr(n) {
					const o$1 = n._reader;
					return !(o$1 === void 0 || !Ie(o$1));
				}
				u(Tr, "ReadableStreamHasBYOBReader");
				const Hr = class Hr$1 {
					constructor(o$1) {
						if (Se(o$1, 1, "ReadableStreamBYOBReader"), lr(o$1, "First parameter"), ke(o$1)) throw new TypeError("This stream has already been locked for exclusive reading by another reader");
						if (!ze(o$1._readableStreamController)) throw new TypeError("Cannot construct a ReadableStreamBYOBReader for a stream not constructed with a byte source");
						ln(this, o$1), this._readIntoRequests = new Q();
					}
					get closed() {
						return Ie(this) ? this._closedPromise : T(Wt("closed"));
					}
					cancel(o$1 = void 0) {
						return Ie(this) ? this._ownerReadableStream === void 0 ? T(Rt("cancel")) : nr(this, o$1) : T(Wt("cancel"));
					}
					read(o$1, a = {}) {
						if (!Ie(this)) return T(Wt("read"));
						if (!ArrayBuffer.isView(o$1)) return T(/* @__PURE__ */ new TypeError("view must be an array buffer view"));
						if (o$1.byteLength === 0) return T(/* @__PURE__ */ new TypeError("view must have non-zero byteLength"));
						if (o$1.buffer.byteLength === 0) return T(/* @__PURE__ */ new TypeError("view's buffer must have non-zero byteLength"));
						if (Ee(o$1.buffer)) return T(/* @__PURE__ */ new TypeError("view's buffer has been detached"));
						let p;
						try {
							p = Xo(a, "options");
						} catch (P) {
							return T(P);
						}
						const y = p.min;
						if (y === 0) return T(/* @__PURE__ */ new TypeError("options.min must be greater than 0"));
						if (xo(o$1)) {
							if (y > o$1.byteLength) return T(/* @__PURE__ */ new RangeError("options.min must be less than or equal to view's byteLength"));
						} else if (y > o$1.length) return T(/* @__PURE__ */ new RangeError("options.min must be less than or equal to view's length"));
						if (this._ownerReadableStream === void 0) return T(Rt("read from"));
						let _, S;
						const C = I((P, W) => {
							_ = P, S = W;
						});
						return Mn(this, o$1, y, {
							_chunkSteps: u((P) => _({
								value: P,
								done: !1
							}), "_chunkSteps"),
							_closeSteps: u((P) => _({
								value: P,
								done: !0
							}), "_closeSteps"),
							_errorSteps: u((P) => S(P), "_errorSteps")
						}), C;
					}
					releaseLock() {
						if (!Ie(this)) throw Wt("releaseLock");
						this._ownerReadableStream !== void 0 && ti(this);
					}
				};
				u(Hr, "ReadableStreamBYOBReader");
				let he = Hr;
				Object.defineProperties(he.prototype, {
					cancel: { enumerable: !0 },
					read: { enumerable: !0 },
					releaseLock: { enumerable: !0 },
					closed: { enumerable: !0 }
				}), w(he.prototype.cancel, "cancel"), w(he.prototype.read, "read"), w(he.prototype.releaseLock, "releaseLock"), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(he.prototype, Symbol.toStringTag, {
					value: "ReadableStreamBYOBReader",
					configurable: !0
				});
				function Ie(n) {
					return !b(n) || !Object.prototype.hasOwnProperty.call(n, "_readIntoRequests") ? !1 : n instanceof he;
				}
				u(Ie, "IsReadableStreamBYOBReader");
				function Mn(n, o$1, a, p) {
					const y = n._ownerReadableStream;
					y._disturbed = !0, y._state === "errored" ? p._errorSteps(y._storedError) : Ho(y._readableStreamController, o$1, a, p);
				}
				u(Mn, "ReadableStreamBYOBReaderRead");
				function ti(n) {
					_e(n);
					const o$1 = /* @__PURE__ */ new TypeError("Reader was released");
					xn(n, o$1);
				}
				u(ti, "ReadableStreamBYOBReaderRelease");
				function xn(n, o$1) {
					const a = n._readIntoRequests;
					n._readIntoRequests = new Q(), a.forEach((p) => {
						p._errorSteps(o$1);
					});
				}
				u(xn, "ReadableStreamBYOBReaderErrorReadIntoRequests");
				function Wt(n) {
					return /* @__PURE__ */ new TypeError(`ReadableStreamBYOBReader.prototype.${n} can only be used on a ReadableStreamBYOBReader`);
				}
				u(Wt, "byobReaderBrandCheckException");
				function dt(n, o$1) {
					const { highWaterMark: a } = n;
					if (a === void 0) return o$1;
					if (wn(a) || a < 0) throw new RangeError("Invalid highWaterMark");
					return a;
				}
				u(dt, "ExtractHighWaterMark");
				function Ot(n) {
					const { size: o$1 } = n;
					return o$1 || (() => 1);
				}
				u(Ot, "ExtractSizeAlgorithm");
				function zt(n, o$1) {
					ce(n, o$1);
					const a = n?.highWaterMark, p = n?.size;
					return {
						highWaterMark: a === void 0 ? void 0 : ar(a),
						size: p === void 0 ? void 0 : ri(p, `${o$1} has member 'size' that`)
					};
				}
				u(zt, "convertQueuingStrategy");
				function ri(n, o$1) {
					return ee(n, o$1), (a) => ar(n(a));
				}
				u(ri, "convertQueuingStrategySize");
				function ni(n, o$1) {
					ce(n, o$1);
					const a = n?.abort, p = n?.close, y = n?.start, _ = n?.type, S = n?.write;
					return {
						abort: a === void 0 ? void 0 : oi(a, n, `${o$1} has member 'abort' that`),
						close: p === void 0 ? void 0 : ii(p, n, `${o$1} has member 'close' that`),
						start: y === void 0 ? void 0 : si(y, n, `${o$1} has member 'start' that`),
						write: S === void 0 ? void 0 : ai(S, n, `${o$1} has member 'write' that`),
						type: _
					};
				}
				u(ni, "convertUnderlyingSink");
				function oi(n, o$1, a) {
					return ee(n, a), (p) => H(n, o$1, [p]);
				}
				u(oi, "convertUnderlyingSinkAbortCallback");
				function ii(n, o$1, a) {
					return ee(n, a), () => H(n, o$1, []);
				}
				u(ii, "convertUnderlyingSinkCloseCallback");
				function si(n, o$1, a) {
					return ee(n, a), (p) => M(n, o$1, [p]);
				}
				u(si, "convertUnderlyingSinkStartCallback");
				function ai(n, o$1, a) {
					return ee(n, a), (p, y) => H(n, o$1, [p, y]);
				}
				u(ai, "convertUnderlyingSinkWriteCallback");
				function Un(n, o$1) {
					if (!Ve(n)) throw new TypeError(`${o$1} is not a WritableStream.`);
				}
				u(Un, "assertWritableStream");
				function ui(n) {
					if (typeof n != "object" || n === null) return !1;
					try {
						return typeof n.aborted == "boolean";
					} catch {
						return !1;
					}
				}
				u(ui, "isAbortSignal");
				const li = typeof AbortController == "function";
				function fi() {
					if (li) return new AbortController();
				}
				u(fi, "createAbortController");
				const Vr = class Vr$1 {
					constructor(o$1 = {}, a = {}) {
						o$1 === void 0 ? o$1 = null : hn(o$1, "First parameter");
						const p = zt(a, "Second parameter"), y = ni(o$1, "First parameter");
						if (Hn(this), y.type !== void 0) throw new RangeError("Invalid type is specified");
						const S = Ot(p), C = dt(p, 1);
						Ci(this, y, C, S);
					}
					get locked() {
						if (!Ve(this)) throw $t("locked");
						return Qe(this);
					}
					abort(o$1 = void 0) {
						return Ve(this) ? Qe(this) ? T(/* @__PURE__ */ new TypeError("Cannot abort a stream that already has a writer")) : Ft(this, o$1) : T($t("abort"));
					}
					close() {
						return Ve(this) ? Qe(this) ? T(/* @__PURE__ */ new TypeError("Cannot close a stream that already has a writer")) : be(this) ? T(/* @__PURE__ */ new TypeError("Cannot close an already-closing stream")) : Vn(this) : T($t("close"));
					}
					getWriter() {
						if (!Ve(this)) throw $t("getWriter");
						return Nn(this);
					}
				};
				u(Vr, "WritableStream");
				let pe = Vr;
				Object.defineProperties(pe.prototype, {
					abort: { enumerable: !0 },
					close: { enumerable: !0 },
					getWriter: { enumerable: !0 },
					locked: { enumerable: !0 }
				}), w(pe.prototype.abort, "abort"), w(pe.prototype.close, "close"), w(pe.prototype.getWriter, "getWriter"), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(pe.prototype, Symbol.toStringTag, {
					value: "WritableStream",
					configurable: !0
				});
				function Nn(n) {
					return new se(n);
				}
				u(Nn, "AcquireWritableStreamDefaultWriter");
				function ci(n, o$1, a, p, y = 1, _ = () => 1) {
					const S = Object.create(pe.prototype);
					Hn(S);
					const C = Object.create(Be.prototype);
					return Jn(S, C, n, o$1, a, p, y, _), S;
				}
				u(ci, "CreateWritableStream");
				function Hn(n) {
					n._state = "writable", n._storedError = void 0, n._writer = void 0, n._writableStreamController = void 0, n._writeRequests = new Q(), n._inFlightWriteRequest = void 0, n._closeRequest = void 0, n._inFlightCloseRequest = void 0, n._pendingAbortRequest = void 0, n._backpressure = !1;
				}
				u(Hn, "InitializeWritableStream");
				function Ve(n) {
					return !b(n) || !Object.prototype.hasOwnProperty.call(n, "_writableStreamController") ? !1 : n instanceof pe;
				}
				u(Ve, "IsWritableStream");
				function Qe(n) {
					return n._writer !== void 0;
				}
				u(Qe, "IsWritableStreamLocked");
				function Ft(n, o$1) {
					var a;
					if (n._state === "closed" || n._state === "errored") return k(void 0);
					n._writableStreamController._abortReason = o$1, (a = n._writableStreamController._abortController) === null || a === void 0 || a.abort(o$1);
					const p = n._state;
					if (p === "closed" || p === "errored") return k(void 0);
					if (n._pendingAbortRequest !== void 0) return n._pendingAbortRequest._promise;
					let y = !1;
					p === "erroring" && (y = !0, o$1 = void 0);
					const _ = I((S, C) => {
						n._pendingAbortRequest = {
							_promise: void 0,
							_resolve: S,
							_reject: C,
							_reason: o$1,
							_wasAlreadyErroring: y
						};
					});
					return n._pendingAbortRequest._promise = _, y || Pr(n, o$1), _;
				}
				u(Ft, "WritableStreamAbort");
				function Vn(n) {
					const o$1 = n._state;
					if (o$1 === "closed" || o$1 === "errored") return T(/* @__PURE__ */ new TypeError(`The stream (in ${o$1} state) is not in the writable state and cannot be closed`));
					const a = I((y, _) => {
						const S = {
							_resolve: y,
							_reject: _
						};
						n._closeRequest = S;
					}), p = n._writer;
					return p !== void 0 && n._backpressure && o$1 === "writable" && Or(p), Pi(n._writableStreamController), a;
				}
				u(Vn, "WritableStreamClose");
				function di(n) {
					return I((a, p) => {
						const y = {
							_resolve: a,
							_reject: p
						};
						n._writeRequests.push(y);
					});
				}
				u(di, "WritableStreamAddWriteRequest");
				function Cr(n, o$1) {
					if (n._state === "writable") {
						Pr(n, o$1);
						return;
					}
					vr(n);
				}
				u(Cr, "WritableStreamDealWithRejection");
				function Pr(n, o$1) {
					const a = n._writableStreamController;
					n._state = "erroring", n._storedError = o$1;
					const p = n._writer;
					p !== void 0 && Yn(p, o$1), !yi(n) && a._started && vr(n);
				}
				u(Pr, "WritableStreamStartErroring");
				function vr(n) {
					n._state = "errored", n._writableStreamController[un]();
					const o$1 = n._storedError;
					if (n._writeRequests.forEach((y) => {
						y._reject(o$1);
					}), n._writeRequests = new Q(), n._pendingAbortRequest === void 0) {
						It(n);
						return;
					}
					const a = n._pendingAbortRequest;
					if (n._pendingAbortRequest = void 0, a._wasAlreadyErroring) {
						a._reject(o$1), It(n);
						return;
					}
					const p = n._writableStreamController[wt](a._reason);
					v(p, () => (a._resolve(), It(n), null), (y) => (a._reject(y), It(n), null));
				}
				u(vr, "WritableStreamFinishErroring");
				function hi(n) {
					n._inFlightWriteRequest._resolve(void 0), n._inFlightWriteRequest = void 0;
				}
				u(hi, "WritableStreamFinishInFlightWrite");
				function pi(n, o$1) {
					n._inFlightWriteRequest._reject(o$1), n._inFlightWriteRequest = void 0, Cr(n, o$1);
				}
				u(pi, "WritableStreamFinishInFlightWriteWithError");
				function bi(n) {
					n._inFlightCloseRequest._resolve(void 0), n._inFlightCloseRequest = void 0, n._state === "erroring" && (n._storedError = void 0, n._pendingAbortRequest !== void 0 && (n._pendingAbortRequest._resolve(), n._pendingAbortRequest = void 0)), n._state = "closed";
					const a = n._writer;
					a !== void 0 && ro(a);
				}
				u(bi, "WritableStreamFinishInFlightClose");
				function mi(n, o$1) {
					n._inFlightCloseRequest._reject(o$1), n._inFlightCloseRequest = void 0, n._pendingAbortRequest !== void 0 && (n._pendingAbortRequest._reject(o$1), n._pendingAbortRequest = void 0), Cr(n, o$1);
				}
				u(mi, "WritableStreamFinishInFlightCloseWithError");
				function be(n) {
					return !(n._closeRequest === void 0 && n._inFlightCloseRequest === void 0);
				}
				u(be, "WritableStreamCloseQueuedOrInFlight");
				function yi(n) {
					return !(n._inFlightWriteRequest === void 0 && n._inFlightCloseRequest === void 0);
				}
				u(yi, "WritableStreamHasOperationMarkedInFlight");
				function gi(n) {
					n._inFlightCloseRequest = n._closeRequest, n._closeRequest = void 0;
				}
				u(gi, "WritableStreamMarkCloseRequestInFlight");
				function _i(n) {
					n._inFlightWriteRequest = n._writeRequests.shift();
				}
				u(_i, "WritableStreamMarkFirstWriteRequestInFlight");
				function It(n) {
					n._closeRequest !== void 0 && (n._closeRequest._reject(n._storedError), n._closeRequest = void 0);
					const o$1 = n._writer;
					o$1 !== void 0 && kr(o$1, n._storedError);
				}
				u(It, "WritableStreamRejectCloseAndClosedPromiseIfNeeded");
				function Er(n, o$1) {
					const a = n._writer;
					a !== void 0 && o$1 !== n._backpressure && (o$1 ? Wi(a) : Or(a)), n._backpressure = o$1;
				}
				u(Er, "WritableStreamUpdateBackpressure");
				const Qr = class Qr$1 {
					constructor(o$1) {
						if (Se(o$1, 1, "WritableStreamDefaultWriter"), Un(o$1, "First parameter"), Qe(o$1)) throw new TypeError("This stream has already been locked for exclusive writing by another writer");
						this._ownerWritableStream = o$1, o$1._writer = this;
						const a = o$1._state;
						if (a === "writable") !be(o$1) && o$1._backpressure ? Mt(this) : no(this), Dt(this);
						else if (a === "erroring") Wr(this, o$1._storedError), Dt(this);
						else if (a === "closed") no(this), qi(this);
						else {
							const p = o$1._storedError;
							Wr(this, p), to(this, p);
						}
					}
					get closed() {
						return je(this) ? this._closedPromise : T(Le("closed"));
					}
					get desiredSize() {
						if (!je(this)) throw Le("desiredSize");
						if (this._ownerWritableStream === void 0) throw pt("desiredSize");
						return Ti(this);
					}
					get ready() {
						return je(this) ? this._readyPromise : T(Le("ready"));
					}
					abort(o$1 = void 0) {
						return je(this) ? this._ownerWritableStream === void 0 ? T(pt("abort")) : Si(this, o$1) : T(Le("abort"));
					}
					close() {
						if (!je(this)) return T(Le("close"));
						const o$1 = this._ownerWritableStream;
						return o$1 === void 0 ? T(pt("close")) : be(o$1) ? T(/* @__PURE__ */ new TypeError("Cannot close an already-closing stream")) : Qn(this);
					}
					releaseLock() {
						if (!je(this)) throw Le("releaseLock");
						this._ownerWritableStream !== void 0 && Gn(this);
					}
					write(o$1 = void 0) {
						return je(this) ? this._ownerWritableStream === void 0 ? T(pt("write to")) : Zn(this, o$1) : T(Le("write"));
					}
				};
				u(Qr, "WritableStreamDefaultWriter");
				let se = Qr;
				Object.defineProperties(se.prototype, {
					abort: { enumerable: !0 },
					close: { enumerable: !0 },
					releaseLock: { enumerable: !0 },
					write: { enumerable: !0 },
					closed: { enumerable: !0 },
					desiredSize: { enumerable: !0 },
					ready: { enumerable: !0 }
				}), w(se.prototype.abort, "abort"), w(se.prototype.close, "close"), w(se.prototype.releaseLock, "releaseLock"), w(se.prototype.write, "write"), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(se.prototype, Symbol.toStringTag, {
					value: "WritableStreamDefaultWriter",
					configurable: !0
				});
				function je(n) {
					return !b(n) || !Object.prototype.hasOwnProperty.call(n, "_ownerWritableStream") ? !1 : n instanceof se;
				}
				u(je, "IsWritableStreamDefaultWriter");
				function Si(n, o$1) {
					const a = n._ownerWritableStream;
					return Ft(a, o$1);
				}
				u(Si, "WritableStreamDefaultWriterAbort");
				function Qn(n) {
					const o$1 = n._ownerWritableStream;
					return Vn(o$1);
				}
				u(Qn, "WritableStreamDefaultWriterClose");
				function wi(n) {
					const o$1 = n._ownerWritableStream, a = o$1._state;
					return be(o$1) || a === "closed" ? k(void 0) : a === "errored" ? T(o$1._storedError) : Qn(n);
				}
				u(wi, "WritableStreamDefaultWriterCloseWithErrorPropagation");
				function Ri(n, o$1) {
					n._closedPromiseState === "pending" ? kr(n, o$1) : ki(n, o$1);
				}
				u(Ri, "WritableStreamDefaultWriterEnsureClosedPromiseRejected");
				function Yn(n, o$1) {
					n._readyPromiseState === "pending" ? oo(n, o$1) : Oi(n, o$1);
				}
				u(Yn, "WritableStreamDefaultWriterEnsureReadyPromiseRejected");
				function Ti(n) {
					const o$1 = n._ownerWritableStream, a = o$1._state;
					return a === "errored" || a === "erroring" ? null : a === "closed" ? 0 : Xn(o$1._writableStreamController);
				}
				u(Ti, "WritableStreamDefaultWriterGetDesiredSize");
				function Gn(n) {
					const o$1 = n._ownerWritableStream, a = /* @__PURE__ */ new TypeError("Writer was released and can no longer be used to monitor the stream's closedness");
					Yn(n, a), Ri(n, a), o$1._writer = void 0, n._ownerWritableStream = void 0;
				}
				u(Gn, "WritableStreamDefaultWriterRelease");
				function Zn(n, o$1) {
					const a = n._ownerWritableStream, p = a._writableStreamController, y = vi(p, o$1);
					if (a !== n._ownerWritableStream) return T(pt("write to"));
					const _ = a._state;
					if (_ === "errored") return T(a._storedError);
					if (be(a) || _ === "closed") return T(/* @__PURE__ */ new TypeError("The stream is closing or closed and cannot be written to"));
					if (_ === "erroring") return T(a._storedError);
					const S = di(a);
					return Ei(p, o$1, y), S;
				}
				u(Zn, "WritableStreamDefaultWriterWrite");
				const Kn = {}, Yr = class Yr$1 {
					constructor() {
						throw new TypeError("Illegal constructor");
					}
					get abortReason() {
						if (!Ar(this)) throw qr("abortReason");
						return this._abortReason;
					}
					get signal() {
						if (!Ar(this)) throw qr("signal");
						if (this._abortController === void 0) throw new TypeError("WritableStreamDefaultController.prototype.signal is not supported");
						return this._abortController.signal;
					}
					error(o$1 = void 0) {
						if (!Ar(this)) throw qr("error");
						this._controlledWritableStream._state === "writable" && eo(this, o$1);
					}
					[wt](o$1) {
						const a = this._abortAlgorithm(o$1);
						return jt(this), a;
					}
					[un]() {
						Ae(this);
					}
				};
				u(Yr, "WritableStreamDefaultController");
				let Be = Yr;
				Object.defineProperties(Be.prototype, {
					abortReason: { enumerable: !0 },
					signal: { enumerable: !0 },
					error: { enumerable: !0 }
				}), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(Be.prototype, Symbol.toStringTag, {
					value: "WritableStreamDefaultController",
					configurable: !0
				});
				function Ar(n) {
					return !b(n) || !Object.prototype.hasOwnProperty.call(n, "_controlledWritableStream") ? !1 : n instanceof Be;
				}
				u(Ar, "IsWritableStreamDefaultController");
				function Jn(n, o$1, a, p, y, _, S, C) {
					o$1._controlledWritableStream = n, n._writableStreamController = o$1, o$1._queue = void 0, o$1._queueTotalSize = void 0, Ae(o$1), o$1._abortReason = void 0, o$1._abortController = fi(), o$1._started = !1, o$1._strategySizeAlgorithm = C, o$1._strategyHWM = S, o$1._writeAlgorithm = p, o$1._closeAlgorithm = y, o$1._abortAlgorithm = _;
					const q = Br(o$1);
					Er(n, q);
					const P = a(), W = k(P);
					v(W, () => (o$1._started = !0, Lt(o$1), null), (O) => (o$1._started = !0, Cr(n, O), null));
				}
				u(Jn, "SetUpWritableStreamDefaultController");
				function Ci(n, o$1, a, p) {
					const y = Object.create(Be.prototype);
					let _, S, C, q;
					o$1.start !== void 0 ? _ = u(() => o$1.start(y), "startAlgorithm") : _ = u(() => {}, "startAlgorithm"), o$1.write !== void 0 ? S = u((P) => o$1.write(P, y), "writeAlgorithm") : S = u(() => k(void 0), "writeAlgorithm"), o$1.close !== void 0 ? C = u(() => o$1.close(), "closeAlgorithm") : C = u(() => k(void 0), "closeAlgorithm"), o$1.abort !== void 0 ? q = u((P) => o$1.abort(P), "abortAlgorithm") : q = u(() => k(void 0), "abortAlgorithm"), Jn(n, y, _, S, C, q, a, p);
				}
				u(Ci, "SetUpWritableStreamDefaultControllerFromUnderlyingSink");
				function jt(n) {
					n._writeAlgorithm = void 0, n._closeAlgorithm = void 0, n._abortAlgorithm = void 0, n._strategySizeAlgorithm = void 0;
				}
				u(jt, "WritableStreamDefaultControllerClearAlgorithms");
				function Pi(n) {
					mr(n, Kn, 0), Lt(n);
				}
				u(Pi, "WritableStreamDefaultControllerClose");
				function vi(n, o$1) {
					try {
						return n._strategySizeAlgorithm(o$1);
					} catch (a) {
						return ht(n, a), 1;
					}
				}
				u(vi, "WritableStreamDefaultControllerGetChunkSize");
				function Xn(n) {
					return n._strategyHWM - n._queueTotalSize;
				}
				u(Xn, "WritableStreamDefaultControllerGetDesiredSize");
				function Ei(n, o$1, a) {
					try {
						mr(n, o$1, a);
					} catch (y) {
						ht(n, y);
						return;
					}
					const p = n._controlledWritableStream;
					if (!be(p) && p._state === "writable") {
						const y = Br(n);
						Er(p, y);
					}
					Lt(n);
				}
				u(Ei, "WritableStreamDefaultControllerWrite");
				function Lt(n) {
					const o$1 = n._controlledWritableStream;
					if (!n._started || o$1._inFlightWriteRequest !== void 0) return;
					if (o$1._state === "erroring") {
						vr(o$1);
						return;
					}
					if (n._queue.length === 0) return;
					const p = Mo(n);
					p === Kn ? Ai(n) : Bi(n, p);
				}
				u(Lt, "WritableStreamDefaultControllerAdvanceQueueIfNeeded");
				function ht(n, o$1) {
					n._controlledWritableStream._state === "writable" && eo(n, o$1);
				}
				u(ht, "WritableStreamDefaultControllerErrorIfNeeded");
				function Ai(n) {
					const o$1 = n._controlledWritableStream;
					gi(o$1), br(n);
					const a = n._closeAlgorithm();
					jt(n), v(a, () => (bi(o$1), null), (p) => (mi(o$1, p), null));
				}
				u(Ai, "WritableStreamDefaultControllerProcessClose");
				function Bi(n, o$1) {
					const a = n._controlledWritableStream;
					_i(a);
					const p = n._writeAlgorithm(o$1);
					v(p, () => {
						hi(a);
						const y = a._state;
						if (br(n), !be(a) && y === "writable") {
							const _ = Br(n);
							Er(a, _);
						}
						return Lt(n), null;
					}, (y) => (a._state === "writable" && jt(n), pi(a, y), null));
				}
				u(Bi, "WritableStreamDefaultControllerProcessWrite");
				function Br(n) {
					return Xn(n) <= 0;
				}
				u(Br, "WritableStreamDefaultControllerGetBackpressure");
				function eo(n, o$1) {
					const a = n._controlledWritableStream;
					jt(n), Pr(a, o$1);
				}
				u(eo, "WritableStreamDefaultControllerError");
				function $t(n) {
					return /* @__PURE__ */ new TypeError(`WritableStream.prototype.${n} can only be used on a WritableStream`);
				}
				u($t, "streamBrandCheckException$2");
				function qr(n) {
					return /* @__PURE__ */ new TypeError(`WritableStreamDefaultController.prototype.${n} can only be used on a WritableStreamDefaultController`);
				}
				u(qr, "defaultControllerBrandCheckException$2");
				function Le(n) {
					return /* @__PURE__ */ new TypeError(`WritableStreamDefaultWriter.prototype.${n} can only be used on a WritableStreamDefaultWriter`);
				}
				u(Le, "defaultWriterBrandCheckException");
				function pt(n) {
					return /* @__PURE__ */ new TypeError("Cannot " + n + " a stream using a released writer");
				}
				u(pt, "defaultWriterLockException");
				function Dt(n) {
					n._closedPromise = I((o$1, a) => {
						n._closedPromise_resolve = o$1, n._closedPromise_reject = a, n._closedPromiseState = "pending";
					});
				}
				u(Dt, "defaultWriterClosedPromiseInitialize");
				function to(n, o$1) {
					Dt(n), kr(n, o$1);
				}
				u(to, "defaultWriterClosedPromiseInitializeAsRejected");
				function qi(n) {
					Dt(n), ro(n);
				}
				u(qi, "defaultWriterClosedPromiseInitializeAsResolved");
				function kr(n, o$1) {
					n._closedPromise_reject !== void 0 && (J(n._closedPromise), n._closedPromise_reject(o$1), n._closedPromise_resolve = void 0, n._closedPromise_reject = void 0, n._closedPromiseState = "rejected");
				}
				u(kr, "defaultWriterClosedPromiseReject");
				function ki(n, o$1) {
					to(n, o$1);
				}
				u(ki, "defaultWriterClosedPromiseResetToRejected");
				function ro(n) {
					n._closedPromise_resolve !== void 0 && (n._closedPromise_resolve(void 0), n._closedPromise_resolve = void 0, n._closedPromise_reject = void 0, n._closedPromiseState = "resolved");
				}
				u(ro, "defaultWriterClosedPromiseResolve");
				function Mt(n) {
					n._readyPromise = I((o$1, a) => {
						n._readyPromise_resolve = o$1, n._readyPromise_reject = a;
					}), n._readyPromiseState = "pending";
				}
				u(Mt, "defaultWriterReadyPromiseInitialize");
				function Wr(n, o$1) {
					Mt(n), oo(n, o$1);
				}
				u(Wr, "defaultWriterReadyPromiseInitializeAsRejected");
				function no(n) {
					Mt(n), Or(n);
				}
				u(no, "defaultWriterReadyPromiseInitializeAsResolved");
				function oo(n, o$1) {
					n._readyPromise_reject !== void 0 && (J(n._readyPromise), n._readyPromise_reject(o$1), n._readyPromise_resolve = void 0, n._readyPromise_reject = void 0, n._readyPromiseState = "rejected");
				}
				u(oo, "defaultWriterReadyPromiseReject");
				function Wi(n) {
					Mt(n);
				}
				u(Wi, "defaultWriterReadyPromiseReset");
				function Oi(n, o$1) {
					Wr(n, o$1);
				}
				u(Oi, "defaultWriterReadyPromiseResetToRejected");
				function Or(n) {
					n._readyPromise_resolve !== void 0 && (n._readyPromise_resolve(void 0), n._readyPromise_resolve = void 0, n._readyPromise_reject = void 0, n._readyPromiseState = "fulfilled");
				}
				u(Or, "defaultWriterReadyPromiseResolve");
				function zi() {
					if (typeof globalThis < "u") return globalThis;
					if (typeof self < "u") return self;
					if (typeof _commonjsHelpers.commonjsGlobal < "u") return _commonjsHelpers.commonjsGlobal;
				}
				u(zi, "getGlobals");
				const zr = zi();
				function Fi(n) {
					if (!(typeof n == "function" || typeof n == "object") || n.name !== "DOMException") return !1;
					try {
						return new n(), !0;
					} catch {
						return !1;
					}
				}
				u(Fi, "isDOMExceptionConstructor");
				function Ii() {
					const n = zr?.DOMException;
					return Fi(n) ? n : void 0;
				}
				u(Ii, "getFromGlobal");
				function ji() {
					const n = u(function(a, p) {
						this.message = a || "", this.name = p || "Error", Error.captureStackTrace && Error.captureStackTrace(this, this.constructor);
					}, "DOMException");
					return w(n, "DOMException"), n.prototype = Object.create(Error.prototype), Object.defineProperty(n.prototype, "constructor", {
						value: n,
						writable: !0,
						configurable: !0
					}), n;
				}
				u(ji, "createPolyfill");
				const Li = Ii() || ji();
				function io(n, o$1, a, p, y, _) {
					const S = Ne(n), C = Nn(o$1);
					n._disturbed = !0;
					let q = !1, P = k(void 0);
					return I((W, O) => {
						let j;
						if (_ !== void 0) {
							if (j = u(() => {
								const E = _.reason !== void 0 ? _.reason : new Li("Aborted", "AbortError"), F = [];
								p || F.push(() => o$1._state === "writable" ? Ft(o$1, E) : k(void 0)), y || F.push(() => n._state === "readable" ? le(n, E) : k(void 0)), Z(() => Promise.all(F.map((L) => L())), !0, E);
							}, "abortAlgorithm"), _.aborted) {
								j();
								return;
							}
							_.addEventListener("abort", j);
						}
						function fe() {
							return I((E, F) => {
								function L(X) {
									X ? E() : $(et(), L, F);
								}
								u(L, "next"), L(!1);
							});
						}
						u(fe, "pipeLoop");
						function et() {
							return q ? k(!0) : $(C._readyPromise, () => I((E, F) => {
								ut(S, {
									_chunkSteps: u((L) => {
										P = $(Zn(C, L), void 0, g), E(!1);
									}, "_chunkSteps"),
									_closeSteps: u(() => E(!0), "_closeSteps"),
									_errorSteps: F
								});
							}));
						}
						if (u(et, "pipeStep"), Te(n, S._closedPromise, (E) => (p ? re(!0, E) : Z(() => Ft(o$1, E), !0, E), null)), Te(o$1, C._closedPromise, (E) => (y ? re(!0, E) : Z(() => le(n, E), !0, E), null)), G(n, S._closedPromise, () => (a ? re() : Z(() => wi(C)), null)), be(o$1) || o$1._state === "closed") {
							const E = /* @__PURE__ */ new TypeError("the destination writable stream closed before all data could be piped to it");
							y ? re(!0, E) : Z(() => le(n, E), !0, E);
						}
						J(fe());
						function We() {
							const E = P;
							return $(P, () => E !== P ? We() : void 0);
						}
						u(We, "waitForWritesToFinish");
						function Te(E, F, L) {
							E._state === "errored" ? L(E._storedError) : U(F, L);
						}
						u(Te, "isOrBecomesErrored");
						function G(E, F, L) {
							E._state === "closed" ? L() : K(F, L);
						}
						u(G, "isOrBecomesClosed");
						function Z(E, F, L) {
							if (q) return;
							q = !0, o$1._state === "writable" && !be(o$1) ? K(We(), X) : X();
							function X() {
								return v(E(), () => Ce(F, L), (tt) => Ce(!0, tt)), null;
							}
							u(X, "doTheRest");
						}
						u(Z, "shutdownWithAction");
						function re(E, F) {
							q || (q = !0, o$1._state === "writable" && !be(o$1) ? K(We(), () => Ce(E, F)) : Ce(E, F));
						}
						u(re, "shutdown");
						function Ce(E, F) {
							return Gn(C), _e(S), _ !== void 0 && _.removeEventListener("abort", j), E ? O(F) : W(void 0), null;
						}
						u(Ce, "finalize");
					});
				}
				u(io, "ReadableStreamPipeTo");
				const Gr = class Gr$1 {
					constructor() {
						throw new TypeError("Illegal constructor");
					}
					get desiredSize() {
						if (!xt(this)) throw Nt("desiredSize");
						return Fr(this);
					}
					close() {
						if (!xt(this)) throw Nt("close");
						if (!Ge(this)) throw new TypeError("The stream is not in a state that permits close");
						$e(this);
					}
					enqueue(o$1 = void 0) {
						if (!xt(this)) throw Nt("enqueue");
						if (!Ge(this)) throw new TypeError("The stream is not in a state that permits enqueue");
						return Ye(this, o$1);
					}
					error(o$1 = void 0) {
						if (!xt(this)) throw Nt("error");
						ue(this, o$1);
					}
					[er](o$1) {
						Ae(this);
						const a = this._cancelAlgorithm(o$1);
						return Ut(this), a;
					}
					[tr](o$1) {
						const a = this._controlledReadableStream;
						if (this._queue.length > 0) {
							const p = br(this);
							this._closeRequested && this._queue.length === 0 ? (Ut(this), yt(a)) : bt(this), o$1._chunkSteps(p);
						} else bn(a, o$1), bt(this);
					}
					[rr]() {}
				};
				u(Gr, "ReadableStreamDefaultController");
				let ae = Gr;
				Object.defineProperties(ae.prototype, {
					close: { enumerable: !0 },
					enqueue: { enumerable: !0 },
					error: { enumerable: !0 },
					desiredSize: { enumerable: !0 }
				}), w(ae.prototype.close, "close"), w(ae.prototype.enqueue, "enqueue"), w(ae.prototype.error, "error"), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(ae.prototype, Symbol.toStringTag, {
					value: "ReadableStreamDefaultController",
					configurable: !0
				});
				function xt(n) {
					return !b(n) || !Object.prototype.hasOwnProperty.call(n, "_controlledReadableStream") ? !1 : n instanceof ae;
				}
				u(xt, "IsReadableStreamDefaultController");
				function bt(n) {
					if (!so(n)) return;
					if (n._pulling) {
						n._pullAgain = !0;
						return;
					}
					n._pulling = !0;
					const a = n._pullAlgorithm();
					v(a, () => (n._pulling = !1, n._pullAgain && (n._pullAgain = !1, bt(n)), null), (p) => (ue(n, p), null));
				}
				u(bt, "ReadableStreamDefaultControllerCallPullIfNeeded");
				function so(n) {
					const o$1 = n._controlledReadableStream;
					return !Ge(n) || !n._started ? !1 : !!(ke(o$1) && Tt(o$1) > 0 || Fr(n) > 0);
				}
				u(so, "ReadableStreamDefaultControllerShouldCallPull");
				function Ut(n) {
					n._pullAlgorithm = void 0, n._cancelAlgorithm = void 0, n._strategySizeAlgorithm = void 0;
				}
				u(Ut, "ReadableStreamDefaultControllerClearAlgorithms");
				function $e(n) {
					if (!Ge(n)) return;
					const o$1 = n._controlledReadableStream;
					n._closeRequested = !0, n._queue.length === 0 && (Ut(n), yt(o$1));
				}
				u($e, "ReadableStreamDefaultControllerClose");
				function Ye(n, o$1) {
					if (!Ge(n)) return;
					const a = n._controlledReadableStream;
					if (ke(a) && Tt(a) > 0) fr(a, o$1, !1);
					else {
						let p;
						try {
							p = n._strategySizeAlgorithm(o$1);
						} catch (y) {
							throw ue(n, y), y;
						}
						try {
							mr(n, o$1, p);
						} catch (y) {
							throw ue(n, y), y;
						}
					}
					bt(n);
				}
				u(Ye, "ReadableStreamDefaultControllerEnqueue");
				function ue(n, o$1) {
					const a = n._controlledReadableStream;
					a._state === "readable" && (Ae(n), Ut(n), fo(a, o$1));
				}
				u(ue, "ReadableStreamDefaultControllerError");
				function Fr(n) {
					const o$1 = n._controlledReadableStream._state;
					return o$1 === "errored" ? null : o$1 === "closed" ? 0 : n._strategyHWM - n._queueTotalSize;
				}
				u(Fr, "ReadableStreamDefaultControllerGetDesiredSize");
				function $i(n) {
					return !so(n);
				}
				u($i, "ReadableStreamDefaultControllerHasBackpressure");
				function Ge(n) {
					const o$1 = n._controlledReadableStream._state;
					return !n._closeRequested && o$1 === "readable";
				}
				u(Ge, "ReadableStreamDefaultControllerCanCloseOrEnqueue");
				function ao(n, o$1, a, p, y, _, S) {
					o$1._controlledReadableStream = n, o$1._queue = void 0, o$1._queueTotalSize = void 0, Ae(o$1), o$1._started = !1, o$1._closeRequested = !1, o$1._pullAgain = !1, o$1._pulling = !1, o$1._strategySizeAlgorithm = S, o$1._strategyHWM = _, o$1._pullAlgorithm = p, o$1._cancelAlgorithm = y, n._readableStreamController = o$1;
					const C = a();
					v(k(C), () => (o$1._started = !0, bt(o$1), null), (q) => (ue(o$1, q), null));
				}
				u(ao, "SetUpReadableStreamDefaultController");
				function Di(n, o$1, a, p) {
					const y = Object.create(ae.prototype);
					let _, S, C;
					o$1.start !== void 0 ? _ = u(() => o$1.start(y), "startAlgorithm") : _ = u(() => {}, "startAlgorithm"), o$1.pull !== void 0 ? S = u(() => o$1.pull(y), "pullAlgorithm") : S = u(() => k(void 0), "pullAlgorithm"), o$1.cancel !== void 0 ? C = u((q) => o$1.cancel(q), "cancelAlgorithm") : C = u(() => k(void 0), "cancelAlgorithm"), ao(n, y, _, S, C, a, p);
				}
				u(Di, "SetUpReadableStreamDefaultControllerFromUnderlyingSource");
				function Nt(n) {
					return /* @__PURE__ */ new TypeError(`ReadableStreamDefaultController.prototype.${n} can only be used on a ReadableStreamDefaultController`);
				}
				u(Nt, "defaultControllerBrandCheckException$1");
				function Mi(n, o$1) {
					return ze(n._readableStreamController) ? Ui(n) : xi(n);
				}
				u(Mi, "ReadableStreamTee");
				function xi(n, o$1) {
					const a = Ne(n);
					let p = !1, y = !1, _ = !1, S = !1, C, q, P, W, O;
					const j = I((G) => {
						O = G;
					});
					function fe() {
						return p ? (y = !0, k(void 0)) : (p = !0, ut(a, {
							_chunkSteps: u((Z) => {
								ge(() => {
									y = !1;
									const re = Z, Ce = Z;
									_ || Ye(P._readableStreamController, re), S || Ye(W._readableStreamController, Ce), p = !1, y && fe();
								});
							}, "_chunkSteps"),
							_closeSteps: u(() => {
								p = !1, _ || $e(P._readableStreamController), S || $e(W._readableStreamController), (!_ || !S) && O(void 0);
							}, "_closeSteps"),
							_errorSteps: u(() => {
								p = !1;
							}, "_errorSteps")
						}), k(void 0));
					}
					u(fe, "pullAlgorithm");
					function et(G) {
						if (_ = !0, C = G, S) {
							const Z = lt([C, q]), re = le(n, Z);
							O(re);
						}
						return j;
					}
					u(et, "cancel1Algorithm");
					function We(G) {
						if (S = !0, q = G, _) {
							const Z = lt([C, q]), re = le(n, Z);
							O(re);
						}
						return j;
					}
					u(We, "cancel2Algorithm");
					function Te() {}
					return u(Te, "startAlgorithm"), P = mt(Te, fe, et), W = mt(Te, fe, We), U(a._closedPromise, (G) => (ue(P._readableStreamController, G), ue(W._readableStreamController, G), (!_ || !S) && O(void 0), null)), [P, W];
				}
				u(xi, "ReadableStreamDefaultTee");
				function Ui(n) {
					let o$1 = Ne(n), a = !1, p = !1, y = !1, _ = !1, S = !1, C, q, P, W, O;
					const j = I((E) => {
						O = E;
					});
					function fe(E) {
						U(E._closedPromise, (F) => (E !== o$1 || (te(P._readableStreamController, F), te(W._readableStreamController, F), (!_ || !S) && O(void 0)), null));
					}
					u(fe, "forwardReaderError");
					function et() {
						Ie(o$1) && (_e(o$1), o$1 = Ne(n), fe(o$1)), ut(o$1, {
							_chunkSteps: u((F) => {
								ge(() => {
									p = !1, y = !1;
									const L = F;
									let X = F;
									if (!_ && !S) try {
										X = Pn(F);
									} catch (tt) {
										te(P._readableStreamController, tt), te(W._readableStreamController, tt), O(le(n, tt));
										return;
									}
									_ || Bt(P._readableStreamController, L), S || Bt(W._readableStreamController, X), a = !1, p ? Te() : y && G();
								});
							}, "_chunkSteps"),
							_closeSteps: u(() => {
								a = !1, _ || ft(P._readableStreamController), S || ft(W._readableStreamController), P._readableStreamController._pendingPullIntos.length > 0 && qt(P._readableStreamController, 0), W._readableStreamController._pendingPullIntos.length > 0 && qt(W._readableStreamController, 0), (!_ || !S) && O(void 0);
							}, "_closeSteps"),
							_errorSteps: u(() => {
								a = !1;
							}, "_errorSteps")
						});
					}
					u(et, "pullWithDefaultReader");
					function We(E, F) {
						ve(o$1) && (_e(o$1), o$1 = Ln(n), fe(o$1));
						const L = F ? W : P, X = F ? P : W;
						Mn(o$1, E, 1, {
							_chunkSteps: u((rt) => {
								ge(() => {
									p = !1, y = !1;
									const nt = F ? S : _;
									if (F ? _ : S) nt || kt(L._readableStreamController, rt);
									else {
										let Co;
										try {
											Co = Pn(rt);
										} catch (tn) {
											te(L._readableStreamController, tn), te(X._readableStreamController, tn), O(le(n, tn));
											return;
										}
										nt || kt(L._readableStreamController, rt), Bt(X._readableStreamController, Co);
									}
									a = !1, p ? Te() : y && G();
								});
							}, "_chunkSteps"),
							_closeSteps: u((rt) => {
								a = !1;
								const nt = F ? S : _, Gt = F ? _ : S;
								nt || ft(L._readableStreamController), Gt || ft(X._readableStreamController), rt !== void 0 && (nt || kt(L._readableStreamController, rt), !Gt && X._readableStreamController._pendingPullIntos.length > 0 && qt(X._readableStreamController, 0)), (!nt || !Gt) && O(void 0);
							}, "_closeSteps"),
							_errorSteps: u(() => {
								a = !1;
							}, "_errorSteps")
						});
					}
					u(We, "pullWithBYOBReader");
					function Te() {
						if (a) return p = !0, k(void 0);
						a = !0;
						const E = wr(P._readableStreamController);
						return E === null ? et() : We(E._view, !1), k(void 0);
					}
					u(Te, "pull1Algorithm");
					function G() {
						if (a) return y = !0, k(void 0);
						a = !0;
						const E = wr(W._readableStreamController);
						return E === null ? et() : We(E._view, !0), k(void 0);
					}
					u(G, "pull2Algorithm");
					function Z(E) {
						if (_ = !0, C = E, S) {
							const F = lt([C, q]), L = le(n, F);
							O(L);
						}
						return j;
					}
					u(Z, "cancel1Algorithm");
					function re(E) {
						if (S = !0, q = E, _) {
							const F = lt([C, q]), L = le(n, F);
							O(L);
						}
						return j;
					}
					u(re, "cancel2Algorithm");
					function Ce() {}
					return u(Ce, "startAlgorithm"), P = lo(Ce, Te, Z), W = lo(Ce, G, re), fe(o$1), [P, W];
				}
				u(Ui, "ReadableByteStreamTee");
				function Ni(n) {
					return b(n) && typeof n.getReader < "u";
				}
				u(Ni, "isReadableStreamLike");
				function Hi(n) {
					return Ni(n) ? Qi(n.getReader()) : Vi(n);
				}
				u(Hi, "ReadableStreamFrom");
				function Vi(n) {
					let o$1;
					const a = Cn(n, "async"), p = g;
					function y() {
						let S;
						try {
							S = jo(a);
						} catch (q) {
							return T(q);
						}
						const C = k(S);
						return N(C, (q) => {
							if (!b(q)) throw new TypeError("The promise returned by the iterator.next() method must fulfill with an object");
							if (Lo(q)) $e(o$1._readableStreamController);
							else {
								const W = $o(q);
								Ye(o$1._readableStreamController, W);
							}
						});
					}
					u(y, "pullAlgorithm");
					function _(S) {
						const C = a.iterator;
						let q;
						try {
							q = vt(C, "return");
						} catch (O) {
							return T(O);
						}
						if (q === void 0) return k(void 0);
						let P;
						try {
							P = M(q, C, [S]);
						} catch (O) {
							return T(O);
						}
						const W = k(P);
						return N(W, (O) => {
							if (!b(O)) throw new TypeError("The promise returned by the iterator.return() method must fulfill with an object");
						});
					}
					return u(_, "cancelAlgorithm"), o$1 = mt(p, y, _, 0), o$1;
				}
				u(Vi, "ReadableStreamFromIterable");
				function Qi(n) {
					let o$1;
					const a = g;
					function p() {
						let _;
						try {
							_ = n.read();
						} catch (S) {
							return T(S);
						}
						return N(_, (S) => {
							if (!b(S)) throw new TypeError("The promise returned by the reader.read() method must fulfill with an object");
							if (S.done) $e(o$1._readableStreamController);
							else {
								const C = S.value;
								Ye(o$1._readableStreamController, C);
							}
						});
					}
					u(p, "pullAlgorithm");
					function y(_) {
						try {
							return k(n.cancel(_));
						} catch (S) {
							return T(S);
						}
					}
					return u(y, "cancelAlgorithm"), o$1 = mt(a, p, y, 0), o$1;
				}
				u(Qi, "ReadableStreamFromDefaultReader");
				function Yi(n, o$1) {
					ce(n, o$1);
					const a = n, p = a?.autoAllocateChunkSize, y = a?.cancel, _ = a?.pull, S = a?.start, C = a?.type;
					return {
						autoAllocateChunkSize: p === void 0 ? void 0 : ur(p, `${o$1} has member 'autoAllocateChunkSize' that`),
						cancel: y === void 0 ? void 0 : Gi(y, a, `${o$1} has member 'cancel' that`),
						pull: _ === void 0 ? void 0 : Zi(_, a, `${o$1} has member 'pull' that`),
						start: S === void 0 ? void 0 : Ki(S, a, `${o$1} has member 'start' that`),
						type: C === void 0 ? void 0 : Ji(C, `${o$1} has member 'type' that`)
					};
				}
				u(Yi, "convertUnderlyingDefaultOrByteSource");
				function Gi(n, o$1, a) {
					return ee(n, a), (p) => H(n, o$1, [p]);
				}
				u(Gi, "convertUnderlyingSourceCancelCallback");
				function Zi(n, o$1, a) {
					return ee(n, a), (p) => H(n, o$1, [p]);
				}
				u(Zi, "convertUnderlyingSourcePullCallback");
				function Ki(n, o$1, a) {
					return ee(n, a), (p) => M(n, o$1, [p]);
				}
				u(Ki, "convertUnderlyingSourceStartCallback");
				function Ji(n, o$1) {
					if (n = `${n}`, n !== "bytes") throw new TypeError(`${o$1} '${n}' is not a valid enumeration value for ReadableStreamType`);
					return n;
				}
				u(Ji, "convertReadableStreamType");
				function Xi(n, o$1) {
					return ce(n, o$1), { preventCancel: !!n?.preventCancel };
				}
				u(Xi, "convertIteratorOptions");
				function uo(n, o$1) {
					ce(n, o$1);
					const a = n?.preventAbort, p = n?.preventCancel, y = n?.preventClose, _ = n?.signal;
					return _ !== void 0 && es(_, `${o$1} has member 'signal' that`), {
						preventAbort: !!a,
						preventCancel: !!p,
						preventClose: !!y,
						signal: _
					};
				}
				u(uo, "convertPipeOptions");
				function es(n, o$1) {
					if (!ui(n)) throw new TypeError(`${o$1} is not an AbortSignal.`);
				}
				u(es, "assertAbortSignal");
				function ts(n, o$1) {
					ce(n, o$1);
					const a = n?.readable;
					sr(a, "readable", "ReadableWritablePair"), lr(a, `${o$1} has member 'readable' that`);
					const p = n?.writable;
					return sr(p, "writable", "ReadableWritablePair"), Un(p, `${o$1} has member 'writable' that`), {
						readable: a,
						writable: p
					};
				}
				u(ts, "convertReadableWritablePair");
				const Zr = class Zr$1 {
					constructor(o$1 = {}, a = {}) {
						o$1 === void 0 ? o$1 = null : hn(o$1, "First parameter");
						const p = zt(a, "Second parameter"), y = Yi(o$1, "First parameter");
						if (Ir(this), y.type === "bytes") {
							if (p.size !== void 0) throw new RangeError("The strategy for a byte stream cannot have a size function");
							const _ = dt(p, 0);
							Go(this, y, _);
						} else {
							const _ = Ot(p), S = dt(p, 1);
							Di(this, y, S, _);
						}
					}
					get locked() {
						if (!qe(this)) throw De("locked");
						return ke(this);
					}
					cancel(o$1 = void 0) {
						return qe(this) ? ke(this) ? T(/* @__PURE__ */ new TypeError("Cannot cancel a stream that already has a reader")) : le(this, o$1) : T(De("cancel"));
					}
					getReader(o$1 = void 0) {
						if (!qe(this)) throw De("getReader");
						return Ko(o$1, "First parameter").mode === void 0 ? Ne(this) : Ln(this);
					}
					pipeThrough(o$1, a = {}) {
						if (!qe(this)) throw De("pipeThrough");
						Se(o$1, 1, "pipeThrough");
						const p = ts(o$1, "First parameter"), y = uo(a, "Second parameter");
						if (ke(this)) throw new TypeError("ReadableStream.prototype.pipeThrough cannot be used on a locked ReadableStream");
						if (Qe(p.writable)) throw new TypeError("ReadableStream.prototype.pipeThrough cannot be used on a locked WritableStream");
						const _ = io(this, p.writable, y.preventClose, y.preventAbort, y.preventCancel, y.signal);
						return J(_), p.readable;
					}
					pipeTo(o$1, a = {}) {
						if (!qe(this)) return T(De("pipeTo"));
						if (o$1 === void 0) return T("Parameter 1 is required in 'pipeTo'.");
						if (!Ve(o$1)) return T(/* @__PURE__ */ new TypeError("ReadableStream.prototype.pipeTo's first argument must be a WritableStream"));
						let p;
						try {
							p = uo(a, "Second parameter");
						} catch (y) {
							return T(y);
						}
						return ke(this) ? T(/* @__PURE__ */ new TypeError("ReadableStream.prototype.pipeTo cannot be used on a locked ReadableStream")) : Qe(o$1) ? T(/* @__PURE__ */ new TypeError("ReadableStream.prototype.pipeTo cannot be used on a locked WritableStream")) : io(this, o$1, p.preventClose, p.preventAbort, p.preventCancel, p.signal);
					}
					tee() {
						if (!qe(this)) throw De("tee");
						const o$1 = Mi(this);
						return lt(o$1);
					}
					values(o$1 = void 0) {
						if (!qe(this)) throw De("values");
						const a = Xi(o$1, "First parameter");
						return Fo(this, a.preventCancel);
					}
					[pr](o$1) {
						return this.values(o$1);
					}
					static from(o$1) {
						return Hi(o$1);
					}
				};
				u(Zr, "ReadableStream");
				let V = Zr;
				Object.defineProperties(V, { from: { enumerable: !0 } }), Object.defineProperties(V.prototype, {
					cancel: { enumerable: !0 },
					getReader: { enumerable: !0 },
					pipeThrough: { enumerable: !0 },
					pipeTo: { enumerable: !0 },
					tee: { enumerable: !0 },
					values: { enumerable: !0 },
					locked: { enumerable: !0 }
				}), w(V.from, "from"), w(V.prototype.cancel, "cancel"), w(V.prototype.getReader, "getReader"), w(V.prototype.pipeThrough, "pipeThrough"), w(V.prototype.pipeTo, "pipeTo"), w(V.prototype.tee, "tee"), w(V.prototype.values, "values"), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(V.prototype, Symbol.toStringTag, {
					value: "ReadableStream",
					configurable: !0
				}), Object.defineProperty(V.prototype, pr, {
					value: V.prototype.values,
					writable: !0,
					configurable: !0
				});
				function mt(n, o$1, a, p = 1, y = () => 1) {
					const _ = Object.create(V.prototype);
					Ir(_);
					const S = Object.create(ae.prototype);
					return ao(_, S, n, o$1, a, p, y), _;
				}
				u(mt, "CreateReadableStream");
				function lo(n, o$1, a) {
					const p = Object.create(V.prototype);
					Ir(p);
					const y = Object.create(ie.prototype);
					return jn(p, y, n, o$1, a, 0, void 0), p;
				}
				u(lo, "CreateReadableByteStream");
				function Ir(n) {
					n._state = "readable", n._reader = void 0, n._storedError = void 0, n._disturbed = !1;
				}
				u(Ir, "InitializeReadableStream");
				function qe(n) {
					return !b(n) || !Object.prototype.hasOwnProperty.call(n, "_readableStreamController") ? !1 : n instanceof V;
				}
				u(qe, "IsReadableStream");
				function ke(n) {
					return n._reader !== void 0;
				}
				u(ke, "IsReadableStreamLocked");
				function le(n, o$1) {
					if (n._disturbed = !0, n._state === "closed") return k(void 0);
					if (n._state === "errored") return T(n._storedError);
					yt(n);
					const a = n._reader;
					if (a !== void 0 && Ie(a)) {
						const y = a._readIntoRequests;
						a._readIntoRequests = new Q(), y.forEach((_) => {
							_._closeSteps(void 0);
						});
					}
					const p = n._readableStreamController[er](o$1);
					return N(p, g);
				}
				u(le, "ReadableStreamCancel");
				function yt(n) {
					n._state = "closed";
					const o$1 = n._reader;
					if (o$1 !== void 0 && (cn(o$1), ve(o$1))) {
						const a = o$1._readRequests;
						o$1._readRequests = new Q(), a.forEach((p) => {
							p._closeSteps();
						});
					}
				}
				u(yt, "ReadableStreamClose");
				function fo(n, o$1) {
					n._state = "errored", n._storedError = o$1;
					const a = n._reader;
					a !== void 0 && (ir(a, o$1), ve(a) ? yn(a, o$1) : xn(a, o$1));
				}
				u(fo, "ReadableStreamError");
				function De(n) {
					return /* @__PURE__ */ new TypeError(`ReadableStream.prototype.${n} can only be used on a ReadableStream`);
				}
				u(De, "streamBrandCheckException$1");
				function co(n, o$1) {
					ce(n, o$1);
					const a = n?.highWaterMark;
					return sr(a, "highWaterMark", "QueuingStrategyInit"), { highWaterMark: ar(a) };
				}
				u(co, "convertQueuingStrategyInit");
				const ho = u((n) => n.byteLength, "byteLengthSizeFunction");
				w(ho, "size");
				const Kr = class Kr$1 {
					constructor(o$1) {
						Se(o$1, 1, "ByteLengthQueuingStrategy"), o$1 = co(o$1, "First parameter"), this._byteLengthQueuingStrategyHighWaterMark = o$1.highWaterMark;
					}
					get highWaterMark() {
						if (!bo(this)) throw po("highWaterMark");
						return this._byteLengthQueuingStrategyHighWaterMark;
					}
					get size() {
						if (!bo(this)) throw po("size");
						return ho;
					}
				};
				u(Kr, "ByteLengthQueuingStrategy");
				let Ze = Kr;
				Object.defineProperties(Ze.prototype, {
					highWaterMark: { enumerable: !0 },
					size: { enumerable: !0 }
				}), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(Ze.prototype, Symbol.toStringTag, {
					value: "ByteLengthQueuingStrategy",
					configurable: !0
				});
				function po(n) {
					return /* @__PURE__ */ new TypeError(`ByteLengthQueuingStrategy.prototype.${n} can only be used on a ByteLengthQueuingStrategy`);
				}
				u(po, "byteLengthBrandCheckException");
				function bo(n) {
					return !b(n) || !Object.prototype.hasOwnProperty.call(n, "_byteLengthQueuingStrategyHighWaterMark") ? !1 : n instanceof Ze;
				}
				u(bo, "IsByteLengthQueuingStrategy");
				const mo = u(() => 1, "countSizeFunction");
				w(mo, "size");
				const Jr = class Jr$1 {
					constructor(o$1) {
						Se(o$1, 1, "CountQueuingStrategy"), o$1 = co(o$1, "First parameter"), this._countQueuingStrategyHighWaterMark = o$1.highWaterMark;
					}
					get highWaterMark() {
						if (!go(this)) throw yo("highWaterMark");
						return this._countQueuingStrategyHighWaterMark;
					}
					get size() {
						if (!go(this)) throw yo("size");
						return mo;
					}
				};
				u(Jr, "CountQueuingStrategy");
				let Ke = Jr;
				Object.defineProperties(Ke.prototype, {
					highWaterMark: { enumerable: !0 },
					size: { enumerable: !0 }
				}), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(Ke.prototype, Symbol.toStringTag, {
					value: "CountQueuingStrategy",
					configurable: !0
				});
				function yo(n) {
					return /* @__PURE__ */ new TypeError(`CountQueuingStrategy.prototype.${n} can only be used on a CountQueuingStrategy`);
				}
				u(yo, "countBrandCheckException");
				function go(n) {
					return !b(n) || !Object.prototype.hasOwnProperty.call(n, "_countQueuingStrategyHighWaterMark") ? !1 : n instanceof Ke;
				}
				u(go, "IsCountQueuingStrategy");
				function rs(n, o$1) {
					ce(n, o$1);
					const a = n?.cancel, p = n?.flush, y = n?.readableType, _ = n?.start, S = n?.transform, C = n?.writableType;
					return {
						cancel: a === void 0 ? void 0 : ss(a, n, `${o$1} has member 'cancel' that`),
						flush: p === void 0 ? void 0 : ns(p, n, `${o$1} has member 'flush' that`),
						readableType: y,
						start: _ === void 0 ? void 0 : os(_, n, `${o$1} has member 'start' that`),
						transform: S === void 0 ? void 0 : is(S, n, `${o$1} has member 'transform' that`),
						writableType: C
					};
				}
				u(rs, "convertTransformer");
				function ns(n, o$1, a) {
					return ee(n, a), (p) => H(n, o$1, [p]);
				}
				u(ns, "convertTransformerFlushCallback");
				function os(n, o$1, a) {
					return ee(n, a), (p) => M(n, o$1, [p]);
				}
				u(os, "convertTransformerStartCallback");
				function is(n, o$1, a) {
					return ee(n, a), (p, y) => H(n, o$1, [p, y]);
				}
				u(is, "convertTransformerTransformCallback");
				function ss(n, o$1, a) {
					return ee(n, a), (p) => H(n, o$1, [p]);
				}
				u(ss, "convertTransformerCancelCallback");
				const Xr = class Xr$1 {
					constructor(o$1 = {}, a = {}, p = {}) {
						o$1 === void 0 && (o$1 = null);
						const y = zt(a, "Second parameter"), _ = zt(p, "Third parameter"), S = rs(o$1, "First parameter");
						if (S.readableType !== void 0) throw new RangeError("Invalid readableType specified");
						if (S.writableType !== void 0) throw new RangeError("Invalid writableType specified");
						const C = dt(_, 0), q = Ot(_), P = dt(y, 1), W = Ot(y);
						let O;
						const j = I((fe) => {
							O = fe;
						});
						as(this, j, P, W, C, q), ls(this, S), S.start !== void 0 ? O(S.start(this._transformStreamController)) : O(void 0);
					}
					get readable() {
						if (!_o(this)) throw To("readable");
						return this._readable;
					}
					get writable() {
						if (!_o(this)) throw To("writable");
						return this._writable;
					}
				};
				u(Xr, "TransformStream");
				let Je = Xr;
				Object.defineProperties(Je.prototype, {
					readable: { enumerable: !0 },
					writable: { enumerable: !0 }
				}), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(Je.prototype, Symbol.toStringTag, {
					value: "TransformStream",
					configurable: !0
				});
				function as(n, o$1, a, p, y, _) {
					function S() {
						return o$1;
					}
					u(S, "startAlgorithm");
					function C(j) {
						return ds(n, j);
					}
					u(C, "writeAlgorithm");
					function q(j) {
						return hs(n, j);
					}
					u(q, "abortAlgorithm");
					function P() {
						return ps(n);
					}
					u(P, "closeAlgorithm"), n._writable = ci(S, C, P, q, a, p);
					function W() {
						return bs(n);
					}
					u(W, "pullAlgorithm");
					function O(j) {
						return ms(n, j);
					}
					u(O, "cancelAlgorithm"), n._readable = mt(S, W, O, y, _), n._backpressure = void 0, n._backpressureChangePromise = void 0, n._backpressureChangePromise_resolve = void 0, Ht(n, !0), n._transformStreamController = void 0;
				}
				u(as, "InitializeTransformStream");
				function _o(n) {
					return !b(n) || !Object.prototype.hasOwnProperty.call(n, "_transformStreamController") ? !1 : n instanceof Je;
				}
				u(_o, "IsTransformStream");
				function So(n, o$1) {
					ue(n._readable._readableStreamController, o$1), jr(n, o$1);
				}
				u(So, "TransformStreamError");
				function jr(n, o$1) {
					Qt(n._transformStreamController), ht(n._writable._writableStreamController, o$1), Lr(n);
				}
				u(jr, "TransformStreamErrorWritableAndUnblockWrite");
				function Lr(n) {
					n._backpressure && Ht(n, !1);
				}
				u(Lr, "TransformStreamUnblockWrite");
				function Ht(n, o$1) {
					n._backpressureChangePromise !== void 0 && n._backpressureChangePromise_resolve(), n._backpressureChangePromise = I((a) => {
						n._backpressureChangePromise_resolve = a;
					}), n._backpressure = o$1;
				}
				u(Ht, "TransformStreamSetBackpressure");
				const en = class en$1 {
					constructor() {
						throw new TypeError("Illegal constructor");
					}
					get desiredSize() {
						if (!Vt(this)) throw Yt("desiredSize");
						const o$1 = this._controlledTransformStream._readable._readableStreamController;
						return Fr(o$1);
					}
					enqueue(o$1 = void 0) {
						if (!Vt(this)) throw Yt("enqueue");
						wo(this, o$1);
					}
					error(o$1 = void 0) {
						if (!Vt(this)) throw Yt("error");
						fs(this, o$1);
					}
					terminate() {
						if (!Vt(this)) throw Yt("terminate");
						cs(this);
					}
				};
				u(en, "TransformStreamDefaultController");
				let me = en;
				Object.defineProperties(me.prototype, {
					enqueue: { enumerable: !0 },
					error: { enumerable: !0 },
					terminate: { enumerable: !0 },
					desiredSize: { enumerable: !0 }
				}), w(me.prototype.enqueue, "enqueue"), w(me.prototype.error, "error"), w(me.prototype.terminate, "terminate"), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(me.prototype, Symbol.toStringTag, {
					value: "TransformStreamDefaultController",
					configurable: !0
				});
				function Vt(n) {
					return !b(n) || !Object.prototype.hasOwnProperty.call(n, "_controlledTransformStream") ? !1 : n instanceof me;
				}
				u(Vt, "IsTransformStreamDefaultController");
				function us(n, o$1, a, p, y) {
					o$1._controlledTransformStream = n, n._transformStreamController = o$1, o$1._transformAlgorithm = a, o$1._flushAlgorithm = p, o$1._cancelAlgorithm = y, o$1._finishPromise = void 0, o$1._finishPromise_resolve = void 0, o$1._finishPromise_reject = void 0;
				}
				u(us, "SetUpTransformStreamDefaultController");
				function ls(n, o$1) {
					const a = Object.create(me.prototype);
					let p, y, _;
					o$1.transform !== void 0 ? p = u((S) => o$1.transform(S, a), "transformAlgorithm") : p = u((S) => {
						try {
							return wo(a, S), k(void 0);
						} catch (C) {
							return T(C);
						}
					}, "transformAlgorithm"), o$1.flush !== void 0 ? y = u(() => o$1.flush(a), "flushAlgorithm") : y = u(() => k(void 0), "flushAlgorithm"), o$1.cancel !== void 0 ? _ = u((S) => o$1.cancel(S), "cancelAlgorithm") : _ = u(() => k(void 0), "cancelAlgorithm"), us(n, a, p, y, _);
				}
				u(ls, "SetUpTransformStreamDefaultControllerFromTransformer");
				function Qt(n) {
					n._transformAlgorithm = void 0, n._flushAlgorithm = void 0, n._cancelAlgorithm = void 0;
				}
				u(Qt, "TransformStreamDefaultControllerClearAlgorithms");
				function wo(n, o$1) {
					const a = n._controlledTransformStream, p = a._readable._readableStreamController;
					if (!Ge(p)) throw new TypeError("Readable side is not in a state that permits enqueue");
					try {
						Ye(p, o$1);
					} catch (_) {
						throw jr(a, _), a._readable._storedError;
					}
					$i(p) !== a._backpressure && Ht(a, !0);
				}
				u(wo, "TransformStreamDefaultControllerEnqueue");
				function fs(n, o$1) {
					So(n._controlledTransformStream, o$1);
				}
				u(fs, "TransformStreamDefaultControllerError");
				function Ro(n, o$1) {
					const a = n._transformAlgorithm(o$1);
					return N(a, void 0, (p) => {
						throw So(n._controlledTransformStream, p), p;
					});
				}
				u(Ro, "TransformStreamDefaultControllerPerformTransform");
				function cs(n) {
					const o$1 = n._controlledTransformStream, a = o$1._readable._readableStreamController;
					$e(a);
					const p = /* @__PURE__ */ new TypeError("TransformStream terminated");
					jr(o$1, p);
				}
				u(cs, "TransformStreamDefaultControllerTerminate");
				function ds(n, o$1) {
					const a = n._transformStreamController;
					if (n._backpressure) {
						const p = n._backpressureChangePromise;
						return N(p, () => {
							const y = n._writable;
							if (y._state === "erroring") throw y._storedError;
							return Ro(a, o$1);
						});
					}
					return Ro(a, o$1);
				}
				u(ds, "TransformStreamDefaultSinkWriteAlgorithm");
				function hs(n, o$1) {
					const a = n._transformStreamController;
					if (a._finishPromise !== void 0) return a._finishPromise;
					const p = n._readable;
					a._finishPromise = I((_, S) => {
						a._finishPromise_resolve = _, a._finishPromise_reject = S;
					});
					const y = a._cancelAlgorithm(o$1);
					return Qt(a), v(y, () => (p._state === "errored" ? Xe(a, p._storedError) : (ue(p._readableStreamController, o$1), $r(a)), null), (_) => (ue(p._readableStreamController, _), Xe(a, _), null)), a._finishPromise;
				}
				u(hs, "TransformStreamDefaultSinkAbortAlgorithm");
				function ps(n) {
					const o$1 = n._transformStreamController;
					if (o$1._finishPromise !== void 0) return o$1._finishPromise;
					const a = n._readable;
					o$1._finishPromise = I((y, _) => {
						o$1._finishPromise_resolve = y, o$1._finishPromise_reject = _;
					});
					const p = o$1._flushAlgorithm();
					return Qt(o$1), v(p, () => (a._state === "errored" ? Xe(o$1, a._storedError) : ($e(a._readableStreamController), $r(o$1)), null), (y) => (ue(a._readableStreamController, y), Xe(o$1, y), null)), o$1._finishPromise;
				}
				u(ps, "TransformStreamDefaultSinkCloseAlgorithm");
				function bs(n) {
					return Ht(n, !1), n._backpressureChangePromise;
				}
				u(bs, "TransformStreamDefaultSourcePullAlgorithm");
				function ms(n, o$1) {
					const a = n._transformStreamController;
					if (a._finishPromise !== void 0) return a._finishPromise;
					const p = n._writable;
					a._finishPromise = I((_, S) => {
						a._finishPromise_resolve = _, a._finishPromise_reject = S;
					});
					const y = a._cancelAlgorithm(o$1);
					return Qt(a), v(y, () => (p._state === "errored" ? Xe(a, p._storedError) : (ht(p._writableStreamController, o$1), Lr(n), $r(a)), null), (_) => (ht(p._writableStreamController, _), Lr(n), Xe(a, _), null)), a._finishPromise;
				}
				u(ms, "TransformStreamDefaultSourceCancelAlgorithm");
				function Yt(n) {
					return /* @__PURE__ */ new TypeError(`TransformStreamDefaultController.prototype.${n} can only be used on a TransformStreamDefaultController`);
				}
				u(Yt, "defaultControllerBrandCheckException");
				function $r(n) {
					n._finishPromise_resolve !== void 0 && (n._finishPromise_resolve(), n._finishPromise_resolve = void 0, n._finishPromise_reject = void 0);
				}
				u($r, "defaultControllerFinishPromiseResolve");
				function Xe(n, o$1) {
					n._finishPromise_reject !== void 0 && (J(n._finishPromise), n._finishPromise_reject(o$1), n._finishPromise_resolve = void 0, n._finishPromise_reject = void 0);
				}
				u(Xe, "defaultControllerFinishPromiseReject");
				function To(n) {
					return /* @__PURE__ */ new TypeError(`TransformStream.prototype.${n} can only be used on a TransformStream`);
				}
				u(To, "streamBrandCheckException"), d.ByteLengthQueuingStrategy = Ze, d.CountQueuingStrategy = Ke, d.ReadableByteStreamController = ie, d.ReadableStream = V, d.ReadableStreamBYOBReader = he, d.ReadableStreamBYOBRequest = Re, d.ReadableStreamDefaultController = ae, d.ReadableStreamDefaultReader = de, d.TransformStream = Je, d.TransformStreamDefaultController = me, d.WritableStream = pe, d.WritableStreamDefaultController = Be, d.WritableStreamDefaultWriter = se;
			});
		}(ponyfill_es2018$1, ponyfill_es2018$1.exports)), ponyfill_es2018$1.exports;
	}
	u(requirePonyfill_es2018, "requirePonyfill_es2018");
	var hasRequiredStreams;
	function requireStreams() {
		if (hasRequiredStreams) return streams;
		hasRequiredStreams = 1;
		const c = 65536;
		if (!globalThis.ReadableStream) try {
			const l$1 = __require("node:process"), { emitWarning: d } = l$1;
			try {
				l$1.emitWarning = () => {}, Object.assign(globalThis, __require("node:stream/web")), l$1.emitWarning = d;
			} catch (g) {
				throw l$1.emitWarning = d, g;
			}
		} catch {
			Object.assign(globalThis, requirePonyfill_es2018());
		}
		try {
			const { Blob: l$1 } = __require("buffer");
			l$1 && !l$1.prototype.stream && (l$1.prototype.stream = u(function(g) {
				let b = 0;
				const R = this;
				return new ReadableStream({
					type: "bytes",
					async pull(w) {
						const z = await R.slice(b, Math.min(R.size, b + c)).arrayBuffer();
						b += z.byteLength, w.enqueue(new Uint8Array(z)), b === R.size && w.close();
					}
				});
			}, "name"));
		} catch {}
		return streams;
	}
	u(requireStreams, "requireStreams"), requireStreams();
	/*! fetch-blob. MIT License. Jimmy Wärting <https://jimmy.warting.se/opensource> */ const POOL_SIZE = 65536;
	async function* toIterator(c, l$1 = !0) {
		for (const d of c) if ("stream" in d) yield* d.stream();
		else if (ArrayBuffer.isView(d)) if (l$1) {
			let g = d.byteOffset;
			const b = d.byteOffset + d.byteLength;
			for (; g !== b;) {
				const R = Math.min(b - g, POOL_SIZE), w = d.buffer.slice(g, g + R);
				g += w.byteLength, yield new Uint8Array(w);
			}
		} else yield d;
		else {
			let g = 0, b = d;
			for (; g !== b.size;) {
				const w = await b.slice(g, Math.min(b.size, g + POOL_SIZE)).arrayBuffer();
				g += w.byteLength, yield new Uint8Array(w);
			}
		}
	}
	u(toIterator, "toIterator");
	const _Blob = (Oe = class {
		constructor(l$1 = [], d = {}) {
			ye(this, Pe, []);
			ye(this, gt, "");
			ye(this, ot, 0);
			ye(this, Zt, "transparent");
			if (typeof l$1 != "object" || l$1 === null) throw new TypeError("Failed to construct 'Blob': The provided value cannot be converted to a sequence.");
			if (typeof l$1[Symbol.iterator] != "function") throw new TypeError("Failed to construct 'Blob': The object must have a callable @@iterator property.");
			if (typeof d != "object" && typeof d != "function") throw new TypeError("Failed to construct 'Blob': parameter 2 cannot convert to dictionary.");
			d === null && (d = {});
			const g = new TextEncoder();
			for (const R of l$1) {
				let w;
				ArrayBuffer.isView(R) ? w = new Uint8Array(R.buffer.slice(R.byteOffset, R.byteOffset + R.byteLength)) : R instanceof ArrayBuffer ? w = new Uint8Array(R.slice(0)) : R instanceof Oe ? w = R : w = g.encode(`${R}`), ne(this, ot, D(this, ot) + (ArrayBuffer.isView(w) ? w.byteLength : w.size)), D(this, Pe).push(w);
			}
			ne(this, Zt, `${d.endings === void 0 ? "transparent" : d.endings}`);
			const b = d.type === void 0 ? "" : String(d.type);
			ne(this, gt, /^[\x20-\x7E]*$/.test(b) ? b : "");
		}
		get size() {
			return D(this, ot);
		}
		get type() {
			return D(this, gt);
		}
		async text() {
			const l$1 = new TextDecoder();
			let d = "";
			for await (const g of toIterator(D(this, Pe), !1)) d += l$1.decode(g, { stream: !0 });
			return d += l$1.decode(), d;
		}
		async arrayBuffer() {
			const l$1 = new Uint8Array(this.size);
			let d = 0;
			for await (const g of toIterator(D(this, Pe), !1)) l$1.set(g, d), d += g.length;
			return l$1.buffer;
		}
		stream() {
			const l$1 = toIterator(D(this, Pe), !0);
			return new globalThis.ReadableStream({
				type: "bytes",
				async pull(d) {
					const g = await l$1.next();
					g.done ? d.close() : d.enqueue(g.value);
				},
				async cancel() {
					await l$1.return();
				}
			});
		}
		slice(l$1 = 0, d = this.size, g = "") {
			const { size: b } = this;
			let R = l$1 < 0 ? Math.max(b + l$1, 0) : Math.min(l$1, b), w = d < 0 ? Math.max(b + d, 0) : Math.min(d, b);
			const A = Math.max(w - R, 0), z = D(this, Pe), B = [];
			let I = 0;
			for (const T of z) {
				if (I >= A) break;
				const $ = ArrayBuffer.isView(T) ? T.byteLength : T.size;
				if (R && $ <= R) R -= $, w -= $;
				else {
					let v;
					ArrayBuffer.isView(T) ? (v = T.subarray(R, Math.min($, w)), I += v.byteLength) : (v = T.slice(R, Math.min($, w)), I += v.size), w -= $, B.push(v), R = 0;
				}
			}
			const k = new Oe([], { type: String(g).toLowerCase() });
			return ne(k, ot, A), ne(k, Pe, B), k;
		}
		get [Symbol.toStringTag]() {
			return "Blob";
		}
		static [Symbol.hasInstance](l$1) {
			return l$1 && typeof l$1 == "object" && typeof l$1.constructor == "function" && (typeof l$1.stream == "function" || typeof l$1.arrayBuffer == "function") && /^(Blob|File)$/.test(l$1[Symbol.toStringTag]);
		}
	}, Pe = /* @__PURE__ */ new WeakMap(), gt = /* @__PURE__ */ new WeakMap(), ot = /* @__PURE__ */ new WeakMap(), Zt = /* @__PURE__ */ new WeakMap(), u(Oe, "Blob"), Oe);
	Object.defineProperties(_Blob.prototype, {
		size: { enumerable: !0 },
		type: { enumerable: !0 },
		slice: { enumerable: !0 }
	});
	const Blob = _Blob, _File = (it = class extends Blob {
		constructor(d, g, b = {}) {
			if (arguments.length < 2) throw new TypeError(`Failed to construct 'File': 2 arguments required, but only ${arguments.length} present.`);
			super(d, b);
			ye(this, _t, 0);
			ye(this, St, "");
			b === null && (b = {});
			const R = b.lastModified === void 0 ? Date.now() : Number(b.lastModified);
			Number.isNaN(R) || ne(this, _t, R), ne(this, St, String(g));
		}
		get name() {
			return D(this, St);
		}
		get lastModified() {
			return D(this, _t);
		}
		get [Symbol.toStringTag]() {
			return "File";
		}
		static [Symbol.hasInstance](d) {
			return !!d && d instanceof Blob && /^(File)$/.test(d[Symbol.toStringTag]);
		}
	}, _t = /* @__PURE__ */ new WeakMap(), St = /* @__PURE__ */ new WeakMap(), u(it, "File"), it), File = _File;
	/*! formdata-polyfill. MIT License. Jimmy Wärting <https://jimmy.warting.se/opensource> */ var { toStringTag: t$1, iterator: i, hasInstance: h } = Symbol, r = Math.random, m = "append,set,get,getAll,delete,keys,values,entries,forEach,constructor".split(","), f = u((c, l$1, d) => (c += "", /^(Blob|File)$/.test(l$1 && l$1[t$1]) ? [(d = d !== void 0 ? d + "" : l$1[t$1] == "File" ? l$1.name : "blob", c), l$1.name !== d || l$1[t$1] == "blob" ? new File([l$1], d, l$1) : l$1] : [c, l$1 + ""]), "f"), e$1 = u((c, l$1) => (l$1 ? c : c.replace(/\r?\n|\r/g, `\r
`)).replace(/\n/g, "%0A").replace(/\r/g, "%0D").replace(/"/g, "%22"), "e$1"), x = u((c, l$1, d) => {
		if (l$1.length < d) throw new TypeError(`Failed to execute '${c}' on 'FormData': ${d} arguments required, but only ${l$1.length} present.`);
	}, "x");
	const FormData = (st = class {
		constructor(...l$1) {
			ye(this, oe, []);
			if (l$1.length) throw new TypeError("Failed to construct 'FormData': parameter 1 is not of type 'HTMLFormElement'.");
		}
		get [t$1]() {
			return "FormData";
		}
		[i]() {
			return this.entries();
		}
		static [h](l$1) {
			return l$1 && typeof l$1 == "object" && l$1[t$1] === "FormData" && !m.some((d) => typeof l$1[d] != "function");
		}
		append(...l$1) {
			x("append", arguments, 2), D(this, oe).push(f(...l$1));
		}
		delete(l$1) {
			x("delete", arguments, 1), l$1 += "", ne(this, oe, D(this, oe).filter(([d]) => d !== l$1));
		}
		get(l$1) {
			x("get", arguments, 1), l$1 += "";
			for (var d = D(this, oe), g = d.length, b = 0; b < g; b++) if (d[b][0] === l$1) return d[b][1];
			return null;
		}
		getAll(l$1, d) {
			return x("getAll", arguments, 1), d = [], l$1 += "", D(this, oe).forEach((g) => g[0] === l$1 && d.push(g[1])), d;
		}
		has(l$1) {
			return x("has", arguments, 1), l$1 += "", D(this, oe).some((d) => d[0] === l$1);
		}
		forEach(l$1, d) {
			x("forEach", arguments, 1);
			for (var [g, b] of this) l$1.call(d, b, g, this);
		}
		set(...l$1) {
			x("set", arguments, 2);
			var d = [], g = !0;
			l$1 = f(...l$1), D(this, oe).forEach((b) => {
				b[0] === l$1[0] ? g && (g = !d.push(l$1)) : d.push(b);
			}), g && d.push(l$1), ne(this, oe, d);
		}
		*entries() {
			yield* D(this, oe);
		}
		*keys() {
			for (var [l$1] of this) yield l$1;
		}
		*values() {
			for (var [, l$1] of this) yield l$1;
		}
	}, oe = /* @__PURE__ */ new WeakMap(), u(st, "FormData"), st);
	function formDataToBlob(c, l$1 = Blob) {
		var d = `${r()}${r()}`.replace(/\./g, "").slice(-28).padStart(32, "-"), g = [], b = `--${d}\r
Content-Disposition: form-data; name="`;
		return c.forEach((R, w) => typeof R == "string" ? g.push(b + e$1(w) + `"\r
\r
${R.replace(/\r(?!\n)|(?<!\r)\n/g, `\r
`)}\r
`) : g.push(b + e$1(w) + `"; filename="${e$1(R.name, 1)}"\r
Content-Type: ${R.type || "application/octet-stream"}\r
\r
`, R, `\r
`)), g.push(`--${d}--`), new l$1(g, { type: "multipart/form-data; boundary=" + d });
	}
	u(formDataToBlob, "formDataToBlob");
	const rn = class rn$1 extends Error {
		constructor(l$1, d) {
			super(l$1), Error.captureStackTrace(this, this.constructor), this.type = d;
		}
		get name() {
			return this.constructor.name;
		}
		get [Symbol.toStringTag]() {
			return this.constructor.name;
		}
	};
	u(rn, "FetchBaseError");
	let FetchBaseError = rn;
	const nn = class nn$1 extends FetchBaseError {
		constructor(l$1, d, g) {
			super(l$1, d), g && (this.code = this.errno = g.code, this.erroredSysCall = g.syscall);
		}
	};
	u(nn, "FetchError");
	let FetchError = nn;
	const NAME = Symbol.toStringTag, isURLSearchParameters = u((c) => typeof c == "object" && typeof c.append == "function" && typeof c.delete == "function" && typeof c.get == "function" && typeof c.getAll == "function" && typeof c.has == "function" && typeof c.set == "function" && typeof c.sort == "function" && c[NAME] === "URLSearchParams", "isURLSearchParameters"), isBlob = u((c) => c && typeof c == "object" && typeof c.arrayBuffer == "function" && typeof c.type == "string" && typeof c.stream == "function" && typeof c.constructor == "function" && /^(Blob|File)$/.test(c[NAME]), "isBlob"), isAbortSignal = u((c) => typeof c == "object" && (c[NAME] === "AbortSignal" || c[NAME] === "EventTarget"), "isAbortSignal"), isDomainOrSubdomain = u((c, l$1) => {
		const d = new URL(l$1).hostname, g = new URL(c).hostname;
		return d === g || d.endsWith(`.${g}`);
	}, "isDomainOrSubdomain"), isSameProtocol = u((c, l$1) => {
		const d = new URL(l$1).protocol, g = new URL(c).protocol;
		return d === g;
	}, "isSameProtocol"), pipeline = require$$0$1.promisify(Stream__default.pipeline), INTERNALS$2 = Symbol("Body internals"), on = class on$1 {
		constructor(l$1, { size: d = 0 } = {}) {
			let g = null;
			l$1 === null ? l$1 = null : isURLSearchParameters(l$1) ? l$1 = require$$0.Buffer.from(l$1.toString()) : isBlob(l$1) || require$$0.Buffer.isBuffer(l$1) || (require$$0$1.types.isAnyArrayBuffer(l$1) ? l$1 = require$$0.Buffer.from(l$1) : ArrayBuffer.isView(l$1) ? l$1 = require$$0.Buffer.from(l$1.buffer, l$1.byteOffset, l$1.byteLength) : l$1 instanceof Stream__default || (l$1 instanceof FormData ? (l$1 = formDataToBlob(l$1), g = l$1.type.split("=")[1]) : l$1 = require$$0.Buffer.from(String(l$1))));
			let b = l$1;
			require$$0.Buffer.isBuffer(l$1) ? b = Stream__default.Readable.from(l$1) : isBlob(l$1) && (b = Stream__default.Readable.from(l$1.stream())), this[INTERNALS$2] = {
				body: l$1,
				stream: b,
				boundary: g,
				disturbed: !1,
				error: null
			}, this.size = d, l$1 instanceof Stream__default && l$1.on("error", (R) => {
				const w = R instanceof FetchBaseError ? R : new FetchError(`Invalid response body while trying to fetch ${this.url}: ${R.message}`, "system", R);
				this[INTERNALS$2].error = w;
			});
		}
		get body() {
			return this[INTERNALS$2].stream;
		}
		get bodyUsed() {
			return this[INTERNALS$2].disturbed;
		}
		async arrayBuffer() {
			const { buffer: l$1, byteOffset: d, byteLength: g } = await consumeBody(this);
			return l$1.slice(d, d + g);
		}
		async formData() {
			const l$1 = this.headers.get("content-type");
			if (l$1.startsWith("application/x-www-form-urlencoded")) {
				const g = new FormData(), b = new URLSearchParams(await this.text());
				for (const [R, w] of b) g.append(R, w);
				return g;
			}
			const { toFormData: d } = await import("./multipart-parser-L4nqG476.mjs").then(__toDynamicImportESM(1));
			return d(this.body, l$1);
		}
		async blob() {
			const l$1 = this.headers && this.headers.get("content-type") || this[INTERNALS$2].body && this[INTERNALS$2].body.type || "", d = await this.arrayBuffer();
			return new Blob([d], { type: l$1 });
		}
		async json() {
			const l$1 = await this.text();
			return JSON.parse(l$1);
		}
		async text() {
			const l$1 = await consumeBody(this);
			return new TextDecoder().decode(l$1);
		}
		buffer() {
			return consumeBody(this);
		}
	};
	u(on, "Body");
	let Body = on;
	Body.prototype.buffer = require$$0$1.deprecate(Body.prototype.buffer, "Please use 'response.arrayBuffer()' instead of 'response.buffer()'", "node-fetch#buffer"), Object.defineProperties(Body.prototype, {
		body: { enumerable: !0 },
		bodyUsed: { enumerable: !0 },
		arrayBuffer: { enumerable: !0 },
		blob: { enumerable: !0 },
		json: { enumerable: !0 },
		text: { enumerable: !0 },
		data: { get: require$$0$1.deprecate(() => {}, "data doesn't exist, use json(), text(), arrayBuffer(), or body instead", "https://github.com/node-fetch/node-fetch/issues/1000 (response)") }
	});
	async function consumeBody(c) {
		if (c[INTERNALS$2].disturbed) throw new TypeError(`body used already for: ${c.url}`);
		if (c[INTERNALS$2].disturbed = !0, c[INTERNALS$2].error) throw c[INTERNALS$2].error;
		const { body: l$1 } = c;
		if (l$1 === null || !(l$1 instanceof Stream__default)) return require$$0.Buffer.alloc(0);
		const d = [];
		let g = 0;
		try {
			for await (const b of l$1) {
				if (c.size > 0 && g + b.length > c.size) {
					const R = new FetchError(`content size at ${c.url} over limit: ${c.size}`, "max-size");
					throw l$1.destroy(R), R;
				}
				g += b.length, d.push(b);
			}
		} catch (b) {
			throw b instanceof FetchBaseError ? b : new FetchError(`Invalid response body while trying to fetch ${c.url}: ${b.message}`, "system", b);
		}
		if (l$1.readableEnded === !0 || l$1._readableState.ended === !0) try {
			return d.every((b) => typeof b == "string") ? require$$0.Buffer.from(d.join("")) : require$$0.Buffer.concat(d, g);
		} catch (b) {
			throw new FetchError(`Could not create Buffer from response body for ${c.url}: ${b.message}`, "system", b);
		}
		else throw new FetchError(`Premature close of server response while trying to fetch ${c.url}`);
	}
	u(consumeBody, "consumeBody");
	const clone = u((c, l$1) => {
		let d, g, { body: b } = c[INTERNALS$2];
		if (c.bodyUsed) throw new Error("cannot clone body after it is used");
		return b instanceof Stream__default && typeof b.getBoundary != "function" && (d = new Stream.PassThrough({ highWaterMark: l$1 }), g = new Stream.PassThrough({ highWaterMark: l$1 }), b.pipe(d), b.pipe(g), c[INTERNALS$2].stream = d, b = g), b;
	}, "clone"), getNonSpecFormDataBoundary = require$$0$1.deprecate((c) => c.getBoundary(), "form-data doesn't follow the spec and requires special treatment. Use alternative package", "https://github.com/node-fetch/node-fetch/issues/1167"), extractContentType = u((c, l$1) => c === null ? null : typeof c == "string" ? "text/plain;charset=UTF-8" : isURLSearchParameters(c) ? "application/x-www-form-urlencoded;charset=UTF-8" : isBlob(c) ? c.type || null : require$$0.Buffer.isBuffer(c) || require$$0$1.types.isAnyArrayBuffer(c) || ArrayBuffer.isView(c) ? null : c instanceof FormData ? `multipart/form-data; boundary=${l$1[INTERNALS$2].boundary}` : c && typeof c.getBoundary == "function" ? `multipart/form-data;boundary=${getNonSpecFormDataBoundary(c)}` : c instanceof Stream__default ? null : "text/plain;charset=UTF-8", "extractContentType"), getTotalBytes = u((c) => {
		const { body: l$1 } = c[INTERNALS$2];
		return l$1 === null ? 0 : isBlob(l$1) ? l$1.size : require$$0.Buffer.isBuffer(l$1) ? l$1.length : l$1 && typeof l$1.getLengthSync == "function" && l$1.hasKnownLength && l$1.hasKnownLength() ? l$1.getLengthSync() : null;
	}, "getTotalBytes"), writeToStream = u(async (c, { body: l$1 }) => {
		l$1 === null ? c.end() : await pipeline(l$1, c);
	}, "writeToStream"), validateHeaderName = typeof http__default.validateHeaderName == "function" ? http__default.validateHeaderName : (c) => {
		if (!/^[\^`\-\w!#$%&'*+.|~]+$/.test(c)) {
			const l$1 = /* @__PURE__ */ new TypeError(`Header name must be a valid HTTP token [${c}]`);
			throw Object.defineProperty(l$1, "code", { value: "ERR_INVALID_HTTP_TOKEN" }), l$1;
		}
	}, validateHeaderValue = typeof http__default.validateHeaderValue == "function" ? http__default.validateHeaderValue : (c, l$1) => {
		if (/[^\t\u0020-\u007E\u0080-\u00FF]/.test(l$1)) {
			const d = /* @__PURE__ */ new TypeError(`Invalid character in header content ["${c}"]`);
			throw Object.defineProperty(d, "code", { value: "ERR_INVALID_CHAR" }), d;
		}
	}, Kt = class Kt$1 extends URLSearchParams {
		constructor(l$1) {
			let d = [];
			if (l$1 instanceof Kt$1) {
				const g = l$1.raw();
				for (const [b, R] of Object.entries(g)) d.push(...R.map((w) => [b, w]));
			} else if (l$1 != null) if (typeof l$1 == "object" && !require$$0$1.types.isBoxedPrimitive(l$1)) {
				const g = l$1[Symbol.iterator];
				if (g == null) d.push(...Object.entries(l$1));
				else {
					if (typeof g != "function") throw new TypeError("Header pairs must be iterable");
					d = [...l$1].map((b) => {
						if (typeof b != "object" || require$$0$1.types.isBoxedPrimitive(b)) throw new TypeError("Each header pair must be an iterable object");
						return [...b];
					}).map((b) => {
						if (b.length !== 2) throw new TypeError("Each header pair must be a name/value tuple");
						return [...b];
					});
				}
			} else throw new TypeError("Failed to construct 'Headers': The provided value is not of type '(sequence<sequence<ByteString>> or record<ByteString, ByteString>)");
			return d = d.length > 0 ? d.map(([g, b]) => (validateHeaderName(g), validateHeaderValue(g, String(b)), [String(g).toLowerCase(), String(b)])) : void 0, super(d), new Proxy(this, { get(g, b, R) {
				switch (b) {
					case "append":
					case "set": return (w, A) => (validateHeaderName(w), validateHeaderValue(w, String(A)), URLSearchParams.prototype[b].call(g, String(w).toLowerCase(), String(A)));
					case "delete":
					case "has":
					case "getAll": return (w) => (validateHeaderName(w), URLSearchParams.prototype[b].call(g, String(w).toLowerCase()));
					case "keys": return () => (g.sort(), new Set(URLSearchParams.prototype.keys.call(g)).keys());
					default: return Reflect.get(g, b, R);
				}
			} });
		}
		get [Symbol.toStringTag]() {
			return this.constructor.name;
		}
		toString() {
			return Object.prototype.toString.call(this);
		}
		get(l$1) {
			const d = this.getAll(l$1);
			if (d.length === 0) return null;
			let g = d.join(", ");
			return /^content-encoding$/i.test(l$1) && (g = g.toLowerCase()), g;
		}
		forEach(l$1, d = void 0) {
			for (const g of this.keys()) Reflect.apply(l$1, d, [
				this.get(g),
				g,
				this
			]);
		}
		*values() {
			for (const l$1 of this.keys()) yield this.get(l$1);
		}
		*entries() {
			for (const l$1 of this.keys()) yield [l$1, this.get(l$1)];
		}
		[Symbol.iterator]() {
			return this.entries();
		}
		raw() {
			return [...this.keys()].reduce((l$1, d) => (l$1[d] = this.getAll(d), l$1), {});
		}
		[Symbol.for("nodejs.util.inspect.custom")]() {
			return [...this.keys()].reduce((l$1, d) => {
				const g = this.getAll(d);
				return d === "host" ? l$1[d] = g[0] : l$1[d] = g.length > 1 ? g : g[0], l$1;
			}, {});
		}
	};
	u(Kt, "Headers");
	let Headers = Kt;
	Object.defineProperties(Headers.prototype, [
		"get",
		"entries",
		"forEach",
		"values"
	].reduce((c, l$1) => (c[l$1] = { enumerable: !0 }, c), {}));
	function fromRawHeaders(c = []) {
		return new Headers(c.reduce((l$1, d, g, b) => (g % 2 === 0 && l$1.push(b.slice(g, g + 2)), l$1), []).filter(([l$1, d]) => {
			try {
				return validateHeaderName(l$1), validateHeaderValue(l$1, String(d)), !0;
			} catch {
				return !1;
			}
		}));
	}
	u(fromRawHeaders, "fromRawHeaders");
	const redirectStatus = new Set([
		301,
		302,
		303,
		307,
		308
	]), isRedirect = u((c) => redirectStatus.has(c), "isRedirect"), INTERNALS$1 = Symbol("Response internals"), Me = class Me$1 extends Body {
		constructor(l$1 = null, d = {}) {
			super(l$1, d);
			const g = d.status != null ? d.status : 200, b = new Headers(d.headers);
			if (l$1 !== null && !b.has("Content-Type")) {
				const R = extractContentType(l$1, this);
				R && b.append("Content-Type", R);
			}
			this[INTERNALS$1] = {
				type: "default",
				url: d.url,
				status: g,
				statusText: d.statusText || "",
				headers: b,
				counter: d.counter,
				highWaterMark: d.highWaterMark
			};
		}
		get type() {
			return this[INTERNALS$1].type;
		}
		get url() {
			return this[INTERNALS$1].url || "";
		}
		get status() {
			return this[INTERNALS$1].status;
		}
		get ok() {
			return this[INTERNALS$1].status >= 200 && this[INTERNALS$1].status < 300;
		}
		get redirected() {
			return this[INTERNALS$1].counter > 0;
		}
		get statusText() {
			return this[INTERNALS$1].statusText;
		}
		get headers() {
			return this[INTERNALS$1].headers;
		}
		get highWaterMark() {
			return this[INTERNALS$1].highWaterMark;
		}
		clone() {
			return new Me$1(clone(this, this.highWaterMark), {
				type: this.type,
				url: this.url,
				status: this.status,
				statusText: this.statusText,
				headers: this.headers,
				ok: this.ok,
				redirected: this.redirected,
				size: this.size,
				highWaterMark: this.highWaterMark
			});
		}
		static redirect(l$1, d = 302) {
			if (!isRedirect(d)) throw new RangeError("Failed to execute \"redirect\" on \"response\": Invalid status code");
			return new Me$1(null, {
				headers: { location: new URL(l$1).toString() },
				status: d
			});
		}
		static error() {
			const l$1 = new Me$1(null, {
				status: 0,
				statusText: ""
			});
			return l$1[INTERNALS$1].type = "error", l$1;
		}
		static json(l$1 = void 0, d = {}) {
			const g = JSON.stringify(l$1);
			if (g === void 0) throw new TypeError("data is not JSON serializable");
			const b = new Headers(d && d.headers);
			return b.has("content-type") || b.set("content-type", "application/json"), new Me$1(g, {
				...d,
				headers: b
			});
		}
		get [Symbol.toStringTag]() {
			return "Response";
		}
	};
	u(Me, "Response");
	let Response = Me;
	Object.defineProperties(Response.prototype, {
		type: { enumerable: !0 },
		url: { enumerable: !0 },
		status: { enumerable: !0 },
		ok: { enumerable: !0 },
		redirected: { enumerable: !0 },
		statusText: { enumerable: !0 },
		headers: { enumerable: !0 },
		clone: { enumerable: !0 }
	});
	const getSearch = u((c) => {
		if (c.search) return c.search;
		const l$1 = c.href.length - 1, d = c.hash || (c.href[l$1] === "#" ? "#" : "");
		return c.href[l$1 - d.length] === "?" ? "?" : "";
	}, "getSearch");
	function stripURLForUseAsAReferrer(c, l$1 = !1) {
		return c == null || (c = new URL(c), /^(about|blob|data):$/.test(c.protocol)) ? "no-referrer" : (c.username = "", c.password = "", c.hash = "", l$1 && (c.pathname = "", c.search = ""), c);
	}
	u(stripURLForUseAsAReferrer, "stripURLForUseAsAReferrer");
	const ReferrerPolicy = new Set([
		"",
		"no-referrer",
		"no-referrer-when-downgrade",
		"same-origin",
		"origin",
		"strict-origin",
		"origin-when-cross-origin",
		"strict-origin-when-cross-origin",
		"unsafe-url"
	]), DEFAULT_REFERRER_POLICY = "strict-origin-when-cross-origin";
	function validateReferrerPolicy(c) {
		if (!ReferrerPolicy.has(c)) throw new TypeError(`Invalid referrerPolicy: ${c}`);
		return c;
	}
	u(validateReferrerPolicy, "validateReferrerPolicy");
	function isOriginPotentiallyTrustworthy(c) {
		if (/^(http|ws)s:$/.test(c.protocol)) return !0;
		const l$1 = c.host.replace(/(^\[)|(]$)/g, ""), d = require$$0$2.isIP(l$1);
		return d === 4 && /^127\./.test(l$1) || d === 6 && /^(((0+:){7})|(::(0+:){0,6}))0*1$/.test(l$1) ? !0 : c.host === "localhost" || c.host.endsWith(".localhost") ? !1 : c.protocol === "file:";
	}
	u(isOriginPotentiallyTrustworthy, "isOriginPotentiallyTrustworthy");
	function isUrlPotentiallyTrustworthy(c) {
		return /^about:(blank|srcdoc)$/.test(c) || c.protocol === "data:" || /^(blob|filesystem):$/.test(c.protocol) ? !0 : isOriginPotentiallyTrustworthy(c);
	}
	u(isUrlPotentiallyTrustworthy, "isUrlPotentiallyTrustworthy");
	function determineRequestsReferrer(c, { referrerURLCallback: l$1, referrerOriginCallback: d } = {}) {
		if (c.referrer === "no-referrer" || c.referrerPolicy === "") return null;
		const g = c.referrerPolicy;
		if (c.referrer === "about:client") return "no-referrer";
		const b = c.referrer;
		let R = stripURLForUseAsAReferrer(b), w = stripURLForUseAsAReferrer(b, !0);
		R.toString().length > 4096 && (R = w), l$1 && (R = l$1(R)), d && (w = d(w));
		const A = new URL(c.url);
		switch (g) {
			case "no-referrer": return "no-referrer";
			case "origin": return w;
			case "unsafe-url": return R;
			case "strict-origin": return isUrlPotentiallyTrustworthy(R) && !isUrlPotentiallyTrustworthy(A) ? "no-referrer" : w.toString();
			case "strict-origin-when-cross-origin": return R.origin === A.origin ? R : isUrlPotentiallyTrustworthy(R) && !isUrlPotentiallyTrustworthy(A) ? "no-referrer" : w;
			case "same-origin": return R.origin === A.origin ? R : "no-referrer";
			case "origin-when-cross-origin": return R.origin === A.origin ? R : w;
			case "no-referrer-when-downgrade": return isUrlPotentiallyTrustworthy(R) && !isUrlPotentiallyTrustworthy(A) ? "no-referrer" : R;
			default: throw new TypeError(`Invalid referrerPolicy: ${g}`);
		}
	}
	u(determineRequestsReferrer, "determineRequestsReferrer");
	function parseReferrerPolicyFromHeader(c) {
		const l$1 = (c.get("referrer-policy") || "").split(/[,\s]+/);
		let d = "";
		for (const g of l$1) g && ReferrerPolicy.has(g) && (d = g);
		return d;
	}
	u(parseReferrerPolicyFromHeader, "parseReferrerPolicyFromHeader");
	const INTERNALS = Symbol("Request internals"), isRequest = u((c) => typeof c == "object" && typeof c[INTERNALS] == "object", "isRequest"), doBadDataWarn = require$$0$1.deprecate(() => {}, ".data is not a valid RequestInit property, use .body instead", "https://github.com/node-fetch/node-fetch/issues/1000 (request)"), Jt = class Jt$1 extends Body {
		constructor(l$1, d = {}) {
			let g;
			if (isRequest(l$1) ? g = new URL(l$1.url) : (g = new URL(l$1), l$1 = {}), g.username !== "" || g.password !== "") throw new TypeError(`${g} is an url with embedded credentials.`);
			let b = d.method || l$1.method || "GET";
			if (/^(delete|get|head|options|post|put)$/i.test(b) && (b = b.toUpperCase()), !isRequest(d) && "data" in d && doBadDataWarn(), (d.body != null || isRequest(l$1) && l$1.body !== null) && (b === "GET" || b === "HEAD")) throw new TypeError("Request with GET/HEAD method cannot have body");
			const R = d.body ? d.body : isRequest(l$1) && l$1.body !== null ? clone(l$1) : null;
			super(R, { size: d.size || l$1.size || 0 });
			const w = new Headers(d.headers || l$1.headers || {});
			if (R !== null && !w.has("Content-Type")) {
				const B = extractContentType(R, this);
				B && w.set("Content-Type", B);
			}
			let A = isRequest(l$1) ? l$1.signal : null;
			if ("signal" in d && (A = d.signal), A != null && !isAbortSignal(A)) throw new TypeError("Expected signal to be an instanceof AbortSignal or EventTarget");
			let z = d.referrer == null ? l$1.referrer : d.referrer;
			if (z === "") z = "no-referrer";
			else if (z) {
				const B = new URL(z);
				z = /^about:(\/\/)?client$/.test(B) ? "client" : B;
			} else z = void 0;
			this[INTERNALS] = {
				method: b,
				redirect: d.redirect || l$1.redirect || "follow",
				headers: w,
				parsedURL: g,
				signal: A,
				referrer: z
			}, this.follow = d.follow === void 0 ? l$1.follow === void 0 ? 20 : l$1.follow : d.follow, this.compress = d.compress === void 0 ? l$1.compress === void 0 ? !0 : l$1.compress : d.compress, this.counter = d.counter || l$1.counter || 0, this.agent = d.agent || l$1.agent, this.highWaterMark = d.highWaterMark || l$1.highWaterMark || 16384, this.insecureHTTPParser = d.insecureHTTPParser || l$1.insecureHTTPParser || !1, this.referrerPolicy = d.referrerPolicy || l$1.referrerPolicy || "";
		}
		get method() {
			return this[INTERNALS].method;
		}
		get url() {
			return require$$1.format(this[INTERNALS].parsedURL);
		}
		get headers() {
			return this[INTERNALS].headers;
		}
		get redirect() {
			return this[INTERNALS].redirect;
		}
		get signal() {
			return this[INTERNALS].signal;
		}
		get referrer() {
			if (this[INTERNALS].referrer === "no-referrer") return "";
			if (this[INTERNALS].referrer === "client") return "about:client";
			if (this[INTERNALS].referrer) return this[INTERNALS].referrer.toString();
		}
		get referrerPolicy() {
			return this[INTERNALS].referrerPolicy;
		}
		set referrerPolicy(l$1) {
			this[INTERNALS].referrerPolicy = validateReferrerPolicy(l$1);
		}
		clone() {
			return new Jt$1(this);
		}
		get [Symbol.toStringTag]() {
			return "Request";
		}
	};
	u(Jt, "Request");
	let Request = Jt;
	Object.defineProperties(Request.prototype, {
		method: { enumerable: !0 },
		url: { enumerable: !0 },
		headers: { enumerable: !0 },
		redirect: { enumerable: !0 },
		clone: { enumerable: !0 },
		signal: { enumerable: !0 },
		referrer: { enumerable: !0 },
		referrerPolicy: { enumerable: !0 }
	});
	const getNodeRequestOptions = u((c) => {
		const { parsedURL: l$1 } = c[INTERNALS], d = new Headers(c[INTERNALS].headers);
		d.has("Accept") || d.set("Accept", "*/*");
		let g = null;
		if (c.body === null && /^(post|put)$/i.test(c.method) && (g = "0"), c.body !== null) {
			const A = getTotalBytes(c);
			typeof A == "number" && !Number.isNaN(A) && (g = String(A));
		}
		g && d.set("Content-Length", g), c.referrerPolicy === "" && (c.referrerPolicy = DEFAULT_REFERRER_POLICY), c.referrer && c.referrer !== "no-referrer" ? c[INTERNALS].referrer = determineRequestsReferrer(c) : c[INTERNALS].referrer = "no-referrer", c[INTERNALS].referrer instanceof URL && d.set("Referer", c.referrer), d.has("User-Agent") || d.set("User-Agent", "node-fetch"), c.compress && !d.has("Accept-Encoding") && d.set("Accept-Encoding", "gzip, deflate, br");
		let { agent: b } = c;
		typeof b == "function" && (b = b(l$1));
		const R = getSearch(l$1), w = {
			path: l$1.pathname + R,
			method: c.method,
			headers: d[Symbol.for("nodejs.util.inspect.custom")](),
			insecureHTTPParser: c.insecureHTTPParser,
			agent: b
		};
		return {
			parsedURL: l$1,
			options: w
		};
	}, "getNodeRequestOptions"), sn = class sn$1 extends FetchBaseError {
		constructor(l$1, d = "aborted") {
			super(l$1, d);
		}
	};
	u(sn, "AbortError");
	let AbortError = sn;
	/*! node-domexception. MIT License. Jimmy Wärting <https://jimmy.warting.se/opensource> */ var nodeDomexception, hasRequiredNodeDomexception;
	function requireNodeDomexception() {
		if (hasRequiredNodeDomexception) return nodeDomexception;
		if (hasRequiredNodeDomexception = 1, !globalThis.DOMException) try {
			const { MessageChannel: c } = __require("worker_threads"), l$1 = new c().port1, d = /* @__PURE__ */ new ArrayBuffer();
			l$1.postMessage(d, [d, d]);
		} catch (c) {
			c.constructor.name === "DOMException" && (globalThis.DOMException = c.constructor);
		}
		return nodeDomexception = globalThis.DOMException, nodeDomexception;
	}
	u(requireNodeDomexception, "requireNodeDomexception");
	var nodeDomexceptionExports = requireNodeDomexception();
	const DOMException = _commonjsHelpers.getDefaultExportFromCjs(nodeDomexceptionExports), { stat } = node_fs.promises, blobFromSync = u((c, l$1) => fromBlob(node_fs.statSync(c), c, l$1), "blobFromSync"), blobFrom = u((c, l$1) => stat(c).then((d) => fromBlob(d, c, l$1)), "blobFrom"), fileFrom = u((c, l$1) => stat(c).then((d) => fromFile(d, c, l$1)), "fileFrom"), fileFromSync = u((c, l$1) => fromFile(node_fs.statSync(c), c, l$1), "fileFromSync"), fromBlob = u((c, l$1, d = "") => new Blob([new BlobDataItem({
		path: l$1,
		size: c.size,
		lastModified: c.mtimeMs,
		start: 0
	})], { type: d }), "fromBlob"), fromFile = u((c, l$1, d = "") => new File([new BlobDataItem({
		path: l$1,
		size: c.size,
		lastModified: c.mtimeMs,
		start: 0
	})], node_path.basename(l$1), {
		type: d,
		lastModified: c.mtimeMs
	}), "fromFile"), Xt = class Xt$1 {
		constructor(l$1) {
			ye(this, xe);
			ye(this, Ue);
			ne(this, xe, l$1.path), ne(this, Ue, l$1.start), this.size = l$1.size, this.lastModified = l$1.lastModified;
		}
		slice(l$1, d) {
			return new Xt$1({
				path: D(this, xe),
				lastModified: this.lastModified,
				size: d - l$1,
				start: D(this, Ue) + l$1
			});
		}
		async *stream() {
			const { mtimeMs: l$1 } = await stat(D(this, xe));
			if (l$1 > this.lastModified) throw new DOMException("The requested file could not be read, typically due to permission problems that have occurred after a reference to a file was acquired.", "NotReadableError");
			yield* node_fs.createReadStream(D(this, xe), {
				start: D(this, Ue),
				end: D(this, Ue) + this.size - 1
			});
		}
		get [Symbol.toStringTag]() {
			return "Blob";
		}
	};
	xe = /* @__PURE__ */ new WeakMap(), Ue = /* @__PURE__ */ new WeakMap(), u(Xt, "BlobDataItem");
	let BlobDataItem = Xt;
	const supportedSchemas = new Set([
		"data:",
		"http:",
		"https:"
	]);
	async function fetch$1(c, l$1) {
		return new Promise((d, g) => {
			const b = new Request(c, l$1), { parsedURL: R, options: w } = getNodeRequestOptions(b);
			if (!supportedSchemas.has(R.protocol)) throw new TypeError(`node-fetch cannot load ${c}. URL scheme "${R.protocol.replace(/:$/, "")}" is not supported.`);
			if (R.protocol === "data:") {
				const v = dataUriToBuffer(b.url), K = new Response(v, { headers: { "Content-Type": v.typeFull } });
				d(K);
				return;
			}
			const A = (R.protocol === "https:" ? https__default : http__default).request, { signal: z } = b;
			let B = null;
			const I = u(() => {
				const v = new AbortError("The operation was aborted.");
				g(v), b.body && b.body instanceof Stream__default.Readable && b.body.destroy(v), !(!B || !B.body) && B.body.emit("error", v);
			}, "abort");
			if (z && z.aborted) {
				I();
				return;
			}
			const k = u(() => {
				I(), $();
			}, "abortAndFinalize"), T = A(R.toString(), w);
			z && z.addEventListener("abort", k);
			const $ = u(() => {
				T.abort(), z && z.removeEventListener("abort", k);
			}, "finalize");
			T.on("error", (v) => {
				g(new FetchError(`request to ${b.url} failed, reason: ${v.message}`, "system", v)), $();
			}), fixResponseChunkedTransferBadEnding(T, (v) => {
				B && B.body && B.body.destroy(v);
			}), process.version < "v14" && T.on("socket", (v) => {
				let K;
				v.prependListener("end", () => {
					K = v._eventsCount;
				}), v.prependListener("close", (U) => {
					if (B && K < v._eventsCount && !U) {
						const N = /* @__PURE__ */ new Error("Premature close");
						N.code = "ERR_STREAM_PREMATURE_CLOSE", B.body.emit("error", N);
					}
				});
			}), T.on("response", (v) => {
				T.setTimeout(0);
				const K = fromRawHeaders(v.rawHeaders);
				if (isRedirect(v.statusCode)) {
					const M = K.get("Location");
					let H = null;
					try {
						H = M === null ? null : new URL(M, b.url);
					} catch {
						if (b.redirect !== "manual") {
							g(new FetchError(`uri requested responds with an invalid redirect URL: ${M}`, "invalid-redirect")), $();
							return;
						}
					}
					switch (b.redirect) {
						case "error":
							g(new FetchError(`uri requested responds with a redirect, redirect mode is set to error: ${b.url}`, "no-redirect")), $();
							return;
						case "manual": break;
						case "follow": {
							if (H === null) break;
							if (b.counter >= b.follow) {
								g(new FetchError(`maximum redirect reached at: ${b.url}`, "max-redirect")), $();
								return;
							}
							const Y = {
								headers: new Headers(b.headers),
								follow: b.follow,
								counter: b.counter + 1,
								agent: b.agent,
								compress: b.compress,
								method: b.method,
								body: clone(b),
								signal: b.signal,
								size: b.size,
								referrer: b.referrer,
								referrerPolicy: b.referrerPolicy
							};
							if (!isDomainOrSubdomain(b.url, H) || !isSameProtocol(b.url, H)) for (const wt of [
								"authorization",
								"www-authenticate",
								"cookie",
								"cookie2"
							]) Y.headers.delete(wt);
							if (v.statusCode !== 303 && b.body && l$1.body instanceof Stream__default.Readable) {
								g(new FetchError("Cannot follow redirect with body being a readable stream", "unsupported-redirect")), $();
								return;
							}
							(v.statusCode === 303 || (v.statusCode === 301 || v.statusCode === 302) && b.method === "POST") && (Y.method = "GET", Y.body = void 0, Y.headers.delete("content-length"));
							const Q = parseReferrerPolicyFromHeader(K);
							Q && (Y.referrerPolicy = Q), d(fetch$1(new Request(H, Y))), $();
							return;
						}
						default: return g(/* @__PURE__ */ new TypeError(`Redirect option '${b.redirect}' is not a valid value of RequestRedirect`));
					}
				}
				z && v.once("end", () => {
					z.removeEventListener("abort", k);
				});
				let U = Stream.pipeline(v, new Stream.PassThrough(), (M) => {
					M && g(M);
				});
				process.version < "v12.10" && v.on("aborted", k);
				const N = {
					url: b.url,
					status: v.statusCode,
					statusText: v.statusMessage,
					headers: K,
					size: b.size,
					counter: b.counter,
					highWaterMark: b.highWaterMark
				}, J = K.get("Content-Encoding");
				if (!b.compress || b.method === "HEAD" || J === null || v.statusCode === 204 || v.statusCode === 304) {
					B = new Response(U, N), d(B);
					return;
				}
				const ge = {
					flush: zlib__default.Z_SYNC_FLUSH,
					finishFlush: zlib__default.Z_SYNC_FLUSH
				};
				if (J === "gzip" || J === "x-gzip") {
					U = Stream.pipeline(U, zlib__default.createGunzip(ge), (M) => {
						M && g(M);
					}), B = new Response(U, N), d(B);
					return;
				}
				if (J === "deflate" || J === "x-deflate") {
					const M = Stream.pipeline(v, new Stream.PassThrough(), (H) => {
						H && g(H);
					});
					M.once("data", (H) => {
						(H[0] & 15) === 8 ? U = Stream.pipeline(U, zlib__default.createInflate(), (Y) => {
							Y && g(Y);
						}) : U = Stream.pipeline(U, zlib__default.createInflateRaw(), (Y) => {
							Y && g(Y);
						}), B = new Response(U, N), d(B);
					}), M.once("end", () => {
						B || (B = new Response(U, N), d(B));
					});
					return;
				}
				if (J === "br") {
					U = Stream.pipeline(U, zlib__default.createBrotliDecompress(), (M) => {
						M && g(M);
					}), B = new Response(U, N), d(B);
					return;
				}
				B = new Response(U, N), d(B);
			}), writeToStream(T, b).catch(g);
		});
	}
	u(fetch$1, "fetch$1");
	function fixResponseChunkedTransferBadEnding(c, l$1) {
		const d = require$$0.Buffer.from(`0\r
\r
`);
		let g = !1, b = !1, R;
		c.on("response", (w) => {
			const { headers: A } = w;
			g = A["transfer-encoding"] === "chunked" && !A["content-length"];
		}), c.on("socket", (w) => {
			const A = u(() => {
				if (g && !b) {
					const B = /* @__PURE__ */ new Error("Premature close");
					B.code = "ERR_STREAM_PREMATURE_CLOSE", l$1(B);
				}
			}, "onSocketClose"), z = u((B) => {
				b = require$$0.Buffer.compare(B.slice(-5), d) === 0, !b && R && (b = require$$0.Buffer.compare(R.slice(-3), d.slice(0, 3)) === 0 && require$$0.Buffer.compare(B.slice(-2), d.slice(3)) === 0), R = B;
			}, "onData");
			w.prependListener("close", A), w.on("data", z), c.on("close", () => {
				w.removeListener("close", A), w.removeListener("data", z);
			});
		});
	}
	u(fixResponseChunkedTransferBadEnding, "fixResponseChunkedTransferBadEnding");
	const privateData = /* @__PURE__ */ new WeakMap(), wrappers = /* @__PURE__ */ new WeakMap();
	function pd(c) {
		const l$1 = privateData.get(c);
		return console.assert(l$1 != null, "'this' is expected an Event object, but got", c), l$1;
	}
	u(pd, "pd");
	function setCancelFlag(c) {
		if (c.passiveListener != null) {
			typeof console < "u" && typeof console.error == "function" && console.error("Unable to preventDefault inside passive event listener invocation.", c.passiveListener);
			return;
		}
		c.event.cancelable && (c.canceled = !0, typeof c.event.preventDefault == "function" && c.event.preventDefault());
	}
	u(setCancelFlag, "setCancelFlag");
	function Event(c, l$1) {
		privateData.set(this, {
			eventTarget: c,
			event: l$1,
			eventPhase: 2,
			currentTarget: c,
			canceled: !1,
			stopped: !1,
			immediateStopped: !1,
			passiveListener: null,
			timeStamp: l$1.timeStamp || Date.now()
		}), Object.defineProperty(this, "isTrusted", {
			value: !1,
			enumerable: !0
		});
		const d = Object.keys(l$1);
		for (let g = 0; g < d.length; ++g) {
			const b = d[g];
			b in this || Object.defineProperty(this, b, defineRedirectDescriptor(b));
		}
	}
	u(Event, "Event"), Event.prototype = {
		get type() {
			return pd(this).event.type;
		},
		get target() {
			return pd(this).eventTarget;
		},
		get currentTarget() {
			return pd(this).currentTarget;
		},
		composedPath() {
			const c = pd(this).currentTarget;
			return c == null ? [] : [c];
		},
		get NONE() {
			return 0;
		},
		get CAPTURING_PHASE() {
			return 1;
		},
		get AT_TARGET() {
			return 2;
		},
		get BUBBLING_PHASE() {
			return 3;
		},
		get eventPhase() {
			return pd(this).eventPhase;
		},
		stopPropagation() {
			const c = pd(this);
			c.stopped = !0, typeof c.event.stopPropagation == "function" && c.event.stopPropagation();
		},
		stopImmediatePropagation() {
			const c = pd(this);
			c.stopped = !0, c.immediateStopped = !0, typeof c.event.stopImmediatePropagation == "function" && c.event.stopImmediatePropagation();
		},
		get bubbles() {
			return !!pd(this).event.bubbles;
		},
		get cancelable() {
			return !!pd(this).event.cancelable;
		},
		preventDefault() {
			setCancelFlag(pd(this));
		},
		get defaultPrevented() {
			return pd(this).canceled;
		},
		get composed() {
			return !!pd(this).event.composed;
		},
		get timeStamp() {
			return pd(this).timeStamp;
		},
		get srcElement() {
			return pd(this).eventTarget;
		},
		get cancelBubble() {
			return pd(this).stopped;
		},
		set cancelBubble(c) {
			if (!c) return;
			const l$1 = pd(this);
			l$1.stopped = !0, typeof l$1.event.cancelBubble == "boolean" && (l$1.event.cancelBubble = !0);
		},
		get returnValue() {
			return !pd(this).canceled;
		},
		set returnValue(c) {
			c || setCancelFlag(pd(this));
		},
		initEvent() {}
	}, Object.defineProperty(Event.prototype, "constructor", {
		value: Event,
		configurable: !0,
		writable: !0
	}), typeof window < "u" && typeof window.Event < "u" && (Object.setPrototypeOf(Event.prototype, window.Event.prototype), wrappers.set(window.Event.prototype, Event));
	function defineRedirectDescriptor(c) {
		return {
			get() {
				return pd(this).event[c];
			},
			set(l$1) {
				pd(this).event[c] = l$1;
			},
			configurable: !0,
			enumerable: !0
		};
	}
	u(defineRedirectDescriptor, "defineRedirectDescriptor");
	function defineCallDescriptor(c) {
		return {
			value() {
				const l$1 = pd(this).event;
				return l$1[c].apply(l$1, arguments);
			},
			configurable: !0,
			enumerable: !0
		};
	}
	u(defineCallDescriptor, "defineCallDescriptor");
	function defineWrapper(c, l$1) {
		const d = Object.keys(l$1);
		if (d.length === 0) return c;
		function g(b, R) {
			c.call(this, b, R);
		}
		u(g, "CustomEvent"), g.prototype = Object.create(c.prototype, { constructor: {
			value: g,
			configurable: !0,
			writable: !0
		} });
		for (let b = 0; b < d.length; ++b) {
			const R = d[b];
			if (!(R in c.prototype)) {
				const A = typeof Object.getOwnPropertyDescriptor(l$1, R).value == "function";
				Object.defineProperty(g.prototype, R, A ? defineCallDescriptor(R) : defineRedirectDescriptor(R));
			}
		}
		return g;
	}
	u(defineWrapper, "defineWrapper");
	function getWrapper(c) {
		if (c == null || c === Object.prototype) return Event;
		let l$1 = wrappers.get(c);
		return l$1 ?? (l$1 = defineWrapper(getWrapper(Object.getPrototypeOf(c)), c), wrappers.set(c, l$1)), l$1;
	}
	u(getWrapper, "getWrapper");
	function wrapEvent(c, l$1) {
		const d = getWrapper(Object.getPrototypeOf(l$1));
		return new d(c, l$1);
	}
	u(wrapEvent, "wrapEvent");
	function isStopped(c) {
		return pd(c).immediateStopped;
	}
	u(isStopped, "isStopped");
	function setEventPhase(c, l$1) {
		pd(c).eventPhase = l$1;
	}
	u(setEventPhase, "setEventPhase");
	function setCurrentTarget(c, l$1) {
		pd(c).currentTarget = l$1;
	}
	u(setCurrentTarget, "setCurrentTarget");
	function setPassiveListener(c, l$1) {
		pd(c).passiveListener = l$1;
	}
	u(setPassiveListener, "setPassiveListener");
	const listenersMap = /* @__PURE__ */ new WeakMap(), CAPTURE = 1, BUBBLE = 2, ATTRIBUTE = 3;
	function isObject(c) {
		return c !== null && typeof c == "object";
	}
	u(isObject, "isObject");
	function getListeners(c) {
		const l$1 = listenersMap.get(c);
		if (l$1 == null) throw new TypeError("'this' is expected an EventTarget object, but got another value.");
		return l$1;
	}
	u(getListeners, "getListeners");
	function defineEventAttributeDescriptor(c) {
		return {
			get() {
				let d = getListeners(this).get(c);
				for (; d != null;) {
					if (d.listenerType === ATTRIBUTE) return d.listener;
					d = d.next;
				}
				return null;
			},
			set(l$1) {
				typeof l$1 != "function" && !isObject(l$1) && (l$1 = null);
				const d = getListeners(this);
				let g = null, b = d.get(c);
				for (; b != null;) b.listenerType === ATTRIBUTE ? g !== null ? g.next = b.next : b.next !== null ? d.set(c, b.next) : d.delete(c) : g = b, b = b.next;
				if (l$1 !== null) {
					const R = {
						listener: l$1,
						listenerType: ATTRIBUTE,
						passive: !1,
						once: !1,
						next: null
					};
					g === null ? d.set(c, R) : g.next = R;
				}
			},
			configurable: !0,
			enumerable: !0
		};
	}
	u(defineEventAttributeDescriptor, "defineEventAttributeDescriptor");
	function defineEventAttribute(c, l$1) {
		Object.defineProperty(c, `on${l$1}`, defineEventAttributeDescriptor(l$1));
	}
	u(defineEventAttribute, "defineEventAttribute");
	function defineCustomEventTarget(c) {
		function l$1() {
			EventTarget.call(this);
		}
		u(l$1, "CustomEventTarget"), l$1.prototype = Object.create(EventTarget.prototype, { constructor: {
			value: l$1,
			configurable: !0,
			writable: !0
		} });
		for (let d = 0; d < c.length; ++d) defineEventAttribute(l$1.prototype, c[d]);
		return l$1;
	}
	u(defineCustomEventTarget, "defineCustomEventTarget");
	function EventTarget() {
		if (this instanceof EventTarget) {
			listenersMap.set(this, /* @__PURE__ */ new Map());
			return;
		}
		if (arguments.length === 1 && Array.isArray(arguments[0])) return defineCustomEventTarget(arguments[0]);
		if (arguments.length > 0) {
			const c = new Array(arguments.length);
			for (let l$1 = 0; l$1 < arguments.length; ++l$1) c[l$1] = arguments[l$1];
			return defineCustomEventTarget(c);
		}
		throw new TypeError("Cannot call a class as a function");
	}
	u(EventTarget, "EventTarget"), EventTarget.prototype = {
		addEventListener(c, l$1, d) {
			if (l$1 == null) return;
			if (typeof l$1 != "function" && !isObject(l$1)) throw new TypeError("'listener' should be a function or an object.");
			const g = getListeners(this), b = isObject(d), w = (b ? !!d.capture : !!d) ? CAPTURE : BUBBLE, A = {
				listener: l$1,
				listenerType: w,
				passive: b && !!d.passive,
				once: b && !!d.once,
				next: null
			};
			let z = g.get(c);
			if (z === void 0) {
				g.set(c, A);
				return;
			}
			let B = null;
			for (; z != null;) {
				if (z.listener === l$1 && z.listenerType === w) return;
				B = z, z = z.next;
			}
			B.next = A;
		},
		removeEventListener(c, l$1, d) {
			if (l$1 == null) return;
			const g = getListeners(this), R = (isObject(d) ? !!d.capture : !!d) ? CAPTURE : BUBBLE;
			let w = null, A = g.get(c);
			for (; A != null;) {
				if (A.listener === l$1 && A.listenerType === R) {
					w !== null ? w.next = A.next : A.next !== null ? g.set(c, A.next) : g.delete(c);
					return;
				}
				w = A, A = A.next;
			}
		},
		dispatchEvent(c) {
			if (c == null || typeof c.type != "string") throw new TypeError("\"event.type\" should be a string.");
			const l$1 = getListeners(this), d = c.type;
			let g = l$1.get(d);
			if (g == null) return !0;
			const b = wrapEvent(this, c);
			let R = null;
			for (; g != null;) {
				if (g.once ? R !== null ? R.next = g.next : g.next !== null ? l$1.set(d, g.next) : l$1.delete(d) : R = g, setPassiveListener(b, g.passive ? g.listener : null), typeof g.listener == "function") try {
					g.listener.call(this, b);
				} catch (w) {
					typeof console < "u" && typeof console.error == "function" && console.error(w);
				}
				else g.listenerType !== ATTRIBUTE && typeof g.listener.handleEvent == "function" && g.listener.handleEvent(b);
				if (isStopped(b)) break;
				g = g.next;
			}
			return setPassiveListener(b, null), setEventPhase(b, 0), setCurrentTarget(b, null), !b.defaultPrevented;
		}
	}, Object.defineProperty(EventTarget.prototype, "constructor", {
		value: EventTarget,
		configurable: !0,
		writable: !0
	}), typeof window < "u" && typeof window.EventTarget < "u" && Object.setPrototypeOf(EventTarget.prototype, window.EventTarget.prototype);
	const an = class an$1 extends EventTarget {
		constructor() {
			throw super(), /* @__PURE__ */ new TypeError("AbortSignal cannot be constructed directly");
		}
		get aborted() {
			const l$1 = abortedFlags.get(this);
			if (typeof l$1 != "boolean") throw new TypeError(`Expected 'this' to be an 'AbortSignal' object, but got ${this === null ? "null" : typeof this}`);
			return l$1;
		}
	};
	u(an, "AbortSignal");
	let AbortSignal = an;
	defineEventAttribute(AbortSignal.prototype, "abort");
	function createAbortSignal() {
		const c = Object.create(AbortSignal.prototype);
		return EventTarget.call(c), abortedFlags.set(c, !1), c;
	}
	u(createAbortSignal, "createAbortSignal");
	function abortSignal(c) {
		abortedFlags.get(c) === !1 && (abortedFlags.set(c, !0), c.dispatchEvent({ type: "abort" }));
	}
	u(abortSignal, "abortSignal");
	const abortedFlags = /* @__PURE__ */ new WeakMap();
	Object.defineProperties(AbortSignal.prototype, { aborted: { enumerable: !0 } }), typeof Symbol == "function" && typeof Symbol.toStringTag == "symbol" && Object.defineProperty(AbortSignal.prototype, Symbol.toStringTag, {
		configurable: !0,
		value: "AbortSignal"
	});
	let AbortController$1 = (at = class {
		constructor() {
			signals.set(this, createAbortSignal());
		}
		get signal() {
			return getSignal(this);
		}
		abort() {
			abortSignal(getSignal(this));
		}
	}, u(at, "AbortController"), at);
	const signals = /* @__PURE__ */ new WeakMap();
	function getSignal(c) {
		const l$1 = signals.get(c);
		if (l$1 == null) throw new TypeError(`Expected 'this' to be an 'AbortController' object, but got ${c === null ? "null" : typeof c}`);
		return l$1;
	}
	u(getSignal, "getSignal"), Object.defineProperties(AbortController$1.prototype, {
		signal: { enumerable: !0 },
		abort: { enumerable: !0 }
	}), typeof Symbol == "function" && typeof Symbol.toStringTag == "symbol" && Object.defineProperty(AbortController$1.prototype, Symbol.toStringTag, {
		configurable: !0,
		value: "AbortController"
	});
	var t = Object.defineProperty, e = u((c, l$1) => t(c, "name", {
		value: l$1,
		configurable: !0
	}), "e");
	const fetch = fetch$1;
	s();
	function s() {
		!globalThis.process?.versions?.node && !globalThis.process?.env?.DISABLE_NODE_FETCH_NATIVE_WARN && console.warn("[node-fetch-native] Node.js compatible build of `node-fetch-native` is being used in a non-Node.js environment. Please make sure you are using proper export conditions or report this issue to https://github.com/unjs/node-fetch-native. You can set `process.env.DISABLE_NODE_FETCH_NATIVE_WARN` to disable this warning.");
	}
	u(s, "s"), e(s, "checkNodeEnvironment"), exports.AbortController = AbortController$1, exports.AbortError = AbortError, exports.Blob = Blob, exports.FetchError = FetchError, exports.File = File, exports.FormData = FormData, exports.Headers = Headers, exports.Request = Request, exports.Response = Response, exports.blobFrom = blobFrom, exports.blobFromSync = blobFromSync, exports.default = fetch, exports.fetch = fetch, exports.fileFrom = fileFrom, exports.fileFromSync = fileFromSync, exports.isRedirect = isRedirect;
}) });

//#endregion
export { require_node, require_node_fetch_native_DhEqb06g };
//# sourceMappingURL=node-CUiaG4jB.mjs.map
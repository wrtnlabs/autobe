import { __esm } from "./chunk-Dsqw6BSZ.mjs";

//#region ../../../node_modules/.pnpm/@prisma+schema-engine-wasm@6.13.0-35.361e86d0ea4987e9f53a565309b3eed797a6bcbd/node_modules/@prisma/schema-engine-wasm/schema_engine_bg.js
function __wbg_set_wasm(val) {
	wasm = val;
}
function getUint8ArrayMemory0() {
	if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
	return cachedUint8ArrayMemory0;
}
function passStringToWasm0(arg, malloc, realloc) {
	if (realloc === void 0) {
		const buf = cachedTextEncoder.encode(arg);
		const ptr$1 = malloc(buf.length, 1) >>> 0;
		getUint8ArrayMemory0().subarray(ptr$1, ptr$1 + buf.length).set(buf);
		WASM_VECTOR_LEN = buf.length;
		return ptr$1;
	}
	let len = arg.length;
	let ptr = malloc(len, 1) >>> 0;
	const mem = getUint8ArrayMemory0();
	let offset = 0;
	for (; offset < len; offset++) {
		const code = arg.charCodeAt(offset);
		if (code > 127) break;
		mem[ptr + offset] = code;
	}
	if (offset !== len) {
		if (offset !== 0) arg = arg.slice(offset);
		ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
		const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
		const ret = encodeString(arg, view);
		offset += ret.written;
		ptr = realloc(ptr, len, offset, 1) >>> 0;
	}
	WASM_VECTOR_LEN = offset;
	return ptr;
}
function getDataViewMemory0() {
	if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || cachedDataViewMemory0.buffer.detached === void 0 && cachedDataViewMemory0.buffer !== wasm.memory.buffer) cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
	return cachedDataViewMemory0;
}
function addToExternrefTable0(obj) {
	const idx = wasm.__externref_table_alloc();
	wasm.__wbindgen_export_4.set(idx, obj);
	return idx;
}
function handleError(f, args) {
	try {
		return f.apply(this, args);
	} catch (e) {
		const idx = addToExternrefTable0(e);
		wasm.__wbindgen_exn_store(idx);
	}
}
function getStringFromWasm0(ptr, len) {
	ptr = ptr >>> 0;
	return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}
function isLikeNone(x) {
	return x === void 0 || x === null;
}
function makeMutClosure(arg0, arg1, dtor, f) {
	const state = {
		a: arg0,
		b: arg1,
		cnt: 1,
		dtor
	};
	const real = (...args) => {
		state.cnt++;
		const a = state.a;
		state.a = 0;
		try {
			return f(a, state.b, ...args);
		} finally {
			if (--state.cnt === 0) {
				wasm.__wbindgen_export_5.get(state.dtor)(a, state.b);
				CLOSURE_DTORS.unregister(state);
			} else state.a = a;
		}
	};
	real.original = state;
	CLOSURE_DTORS.register(real, state, state);
	return real;
}
function debugString(val) {
	const type = typeof val;
	if (type == "number" || type == "boolean" || val == null) return `${val}`;
	if (type == "string") return `"${val}"`;
	if (type == "symbol") {
		const description = val.description;
		if (description == null) return "Symbol";
		else return `Symbol(${description})`;
	}
	if (type == "function") {
		const name = val.name;
		if (typeof name == "string" && name.length > 0) return `Function(${name})`;
		else return "Function";
	}
	if (Array.isArray(val)) {
		const length = val.length;
		let debug = "[";
		if (length > 0) debug += debugString(val[0]);
		for (let i = 1; i < length; i++) debug += ", " + debugString(val[i]);
		debug += "]";
		return debug;
	}
	const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
	let className;
	if (builtInMatches && builtInMatches.length > 1) className = builtInMatches[1];
	else return toString.call(val);
	if (className == "Object") try {
		return "Object(" + JSON.stringify(val) + ")";
	} catch (_) {
		return "Object";
	}
	if (val instanceof Error) return `${val.name}: ${val.message}\n${val.stack}`;
	return className;
}
/**
* The version of the @prisma/schema-engine-wasm.
* @returns {string}
*/
function version() {
	let deferred1_0;
	let deferred1_1;
	try {
		const ret = wasm.version();
		deferred1_0 = ret[0];
		deferred1_1 = ret[1];
		return getStringFromWasm0(ret[0], ret[1]);
	} finally {
		wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
	}
}
function __wbg_adapter_52(arg0, arg1, arg2) {
	wasm.closure732_externref_shim(arg0, arg1, arg2);
}
function __wbg_adapter_165(arg0, arg1, arg2, arg3) {
	wasm.closure162_externref_shim(arg0, arg1, arg2, arg3);
}
function __wbg_String_8f0eb39a4a4c2f66(arg0, arg1) {
	const ret = String(arg1);
	const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
	const len1 = WASM_VECTOR_LEN;
	getDataViewMemory0().setInt32(arg0 + 4, len1, true);
	getDataViewMemory0().setInt32(arg0 + 0, ptr1, true);
}
function __wbg_buffer_609cc3eee51ed158(arg0) {
	const ret = arg0.buffer;
	return ret;
}
function __wbg_call_672a4d21634d4a24() {
	return handleError(function(arg0, arg1) {
		const ret = arg0.call(arg1);
		return ret;
	}, arguments);
}
function __wbg_call_7cccdd69e0791ae2() {
	return handleError(function(arg0, arg1, arg2) {
		const ret = arg0.call(arg1, arg2);
		return ret;
	}, arguments);
}
function __wbg_crypto_805be4ce92f1e370(arg0) {
	const ret = arg0.crypto;
	return ret;
}
function __wbg_done_769e5ede4b31c67b(arg0) {
	const ret = arg0.done;
	return ret;
}
function __wbg_entries_3265d4158b33e5dc(arg0) {
	const ret = Object.entries(arg0);
	return ret;
}
function __wbg_exec_3e2d2d0644c927df(arg0, arg1, arg2) {
	const ret = arg0.exec(getStringFromWasm0(arg1, arg2));
	return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
}
function __wbg_getRandomValues_f6a868620c8bab49() {
	return handleError(function(arg0, arg1) {
		arg0.getRandomValues(arg1);
	}, arguments);
}
function __wbg_getTime_46267b1c24877e30(arg0) {
	const ret = arg0.getTime();
	return ret;
}
function __wbg_get_67b2ba62fc30de12() {
	return handleError(function(arg0, arg1) {
		const ret = Reflect.get(arg0, arg1);
		return ret;
	}, arguments);
}
function __wbg_get_b9b93047fe3cf45b(arg0, arg1) {
	const ret = arg0[arg1 >>> 0];
	return ret;
}
function __wbg_get_ece95cf6585650d9() {
	return handleError(function(arg0, arg1) {
		const ret = arg0[arg1];
		return ret;
	}, arguments);
}
function __wbg_getwithrefkey_1dc361bd10053bfe(arg0, arg1) {
	const ret = arg0[arg1];
	return ret;
}
function __wbg_has_a5ea9117f258a0ec() {
	return handleError(function(arg0, arg1) {
		const ret = Reflect.has(arg0, arg1);
		return ret;
	}, arguments);
}
function __wbg_instanceof_ArrayBuffer_e14585432e3737fc(arg0) {
	let result;
	try {
		result = arg0 instanceof ArrayBuffer;
	} catch (_) {
		result = false;
	}
	const ret = result;
	return ret;
}
function __wbg_instanceof_Map_f3469ce2244d2430(arg0) {
	let result;
	try {
		result = arg0 instanceof Map;
	} catch (_) {
		result = false;
	}
	const ret = result;
	return ret;
}
function __wbg_instanceof_Promise_935168b8f4b49db3(arg0) {
	let result;
	try {
		result = arg0 instanceof Promise;
	} catch (_) {
		result = false;
	}
	const ret = result;
	return ret;
}
function __wbg_instanceof_Uint8Array_17156bcf118086a9(arg0) {
	let result;
	try {
		result = arg0 instanceof Uint8Array;
	} catch (_) {
		result = false;
	}
	const ret = result;
	return ret;
}
function __wbg_isArray_a1eab7e0d067391b(arg0) {
	const ret = Array.isArray(arg0);
	return ret;
}
function __wbg_isSafeInteger_343e2beeeece1bb0(arg0) {
	const ret = Number.isSafeInteger(arg0);
	return ret;
}
function __wbg_iterator_9a24c88df860dc65() {
	const ret = Symbol.iterator;
	return ret;
}
function __wbg_length_a446193dc22c12f8(arg0) {
	const ret = arg0.length;
	return ret;
}
function __wbg_length_e2d2a49132c1b256(arg0) {
	const ret = arg0.length;
	return ret;
}
function __wbg_msCrypto_2ac4d17c4748234a(arg0) {
	const ret = arg0.msCrypto;
	return ret;
}
function __wbg_new0_f788a2397c7ca929() {
	const ret = /* @__PURE__ */ new Date();
	return ret;
}
function __wbg_new_23a2665fac83c611(arg0, arg1) {
	try {
		var state0 = {
			a: arg0,
			b: arg1
		};
		var cb0 = (arg0$1, arg1$1) => {
			const a = state0.a;
			state0.a = 0;
			try {
				return __wbg_adapter_165(a, state0.b, arg0$1, arg1$1);
			} finally {
				state0.a = a;
			}
		};
		const ret = new Promise(cb0);
		return ret;
	} finally {
		state0.a = state0.b = 0;
	}
}
function __wbg_new_405e22f390576ce2() {
	const ret = /* @__PURE__ */ new Object();
	return ret;
}
function __wbg_new_5e0be73521bc8c17() {
	const ret = /* @__PURE__ */ new Map();
	return ret;
}
function __wbg_new_63847613cde5d4bc(arg0, arg1, arg2, arg3) {
	const ret = new RegExp(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3));
	return ret;
}
function __wbg_new_78feb108b6472713() {
	const ret = new Array();
	return ret;
}
function __wbg_new_a12002a7f91c75be(arg0) {
	const ret = new Uint8Array(arg0);
	return ret;
}
function __wbg_new_c68d7209be747379(arg0, arg1) {
	const ret = new Error(getStringFromWasm0(arg0, arg1));
	return ret;
}
function __wbg_newnoargs_105ed471475aaf50(arg0, arg1) {
	const ret = new Function(getStringFromWasm0(arg0, arg1));
	return ret;
}
function __wbg_newwithbyteoffsetandlength_d97e637ebe145a9a(arg0, arg1, arg2) {
	const ret = new Uint8Array(arg0, arg1 >>> 0, arg2 >>> 0);
	return ret;
}
function __wbg_newwithlength_a381634e90c276d4(arg0) {
	const ret = new Uint8Array(arg0 >>> 0);
	return ret;
}
function __wbg_next_25feadfc0913fea9(arg0) {
	const ret = arg0.next;
	return ret;
}
function __wbg_next_6574e1a8a62d1055() {
	return handleError(function(arg0) {
		const ret = arg0.next();
		return ret;
	}, arguments);
}
function __wbg_node_ecc8306b9857f33d(arg0) {
	const ret = arg0.node;
	return ret;
}
function __wbg_now_7fd00a794a07d388(arg0) {
	const ret = arg0.now();
	return ret;
}
function __wbg_now_807e54c39636c349() {
	const ret = Date.now();
	return ret;
}
function __wbg_process_5cff2739921be718(arg0) {
	const ret = arg0.process;
	return ret;
}
function __wbg_push_737cfc8c1432c2c6(arg0, arg1) {
	const ret = arg0.push(arg1);
	return ret;
}
function __wbg_queueMicrotask_5a8a9131f3f0b37b(arg0) {
	const ret = arg0.queueMicrotask;
	return ret;
}
function __wbg_queueMicrotask_6d79674585219521(arg0) {
	queueMicrotask(arg0);
}
function __wbg_randomFillSync_d3c85af7e31cf1f8() {
	return handleError(function(arg0, arg1) {
		arg0.randomFillSync(arg1);
	}, arguments);
}
function __wbg_require_0c566c6f2eef6c79() {
	return handleError(function() {
		const ret = module.require;
		return ret;
	}, arguments);
}
function __wbg_resolve_4851785c9c5f573d(arg0) {
	const ret = Promise.resolve(arg0);
	return ret;
}
function __wbg_schemaengine_new(arg0) {
	const ret = SchemaEngine.__wrap(arg0);
	return ret;
}
function __wbg_setTimeout_5d6a1d4fc51ea450(arg0, arg1) {
	const ret = setTimeout(arg0, arg1 >>> 0);
	return ret;
}
function __wbg_set_37837023f3d740e8(arg0, arg1, arg2) {
	arg0[arg1 >>> 0] = arg2;
}
function __wbg_set_3f1d0b984ed272ed(arg0, arg1, arg2) {
	arg0[arg1] = arg2;
}
function __wbg_set_65595bdd868b3009(arg0, arg1, arg2) {
	arg0.set(arg1, arg2 >>> 0);
}
function __wbg_set_8fc6bf8a5b1071d1(arg0, arg1, arg2) {
	const ret = arg0.set(arg1, arg2);
	return ret;
}
function __wbg_set_bb8cecf6a62b9f46() {
	return handleError(function(arg0, arg1, arg2) {
		const ret = Reflect.set(arg0, arg1, arg2);
		return ret;
	}, arguments);
}
function __wbg_setmessage_f18c00fbf3b3e80e(arg0, arg1) {
	global.PRISMA_WASM_PANIC_REGISTRY.set_message(getStringFromWasm0(arg0, arg1));
}
function __wbg_setname_6df54b7ebf9404a9(arg0, arg1, arg2) {
	arg0.name = getStringFromWasm0(arg1, arg2);
}
function __wbg_static_accessor_GLOBAL_88a902d13a557d07() {
	const ret = typeof global === "undefined" ? null : global;
	return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
}
function __wbg_static_accessor_GLOBAL_THIS_56578be7e9f832b0() {
	const ret = typeof globalThis === "undefined" ? null : globalThis;
	return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
}
function __wbg_static_accessor_SELF_37c5d418e4bf5819() {
	const ret = typeof self === "undefined" ? null : self;
	return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
}
function __wbg_static_accessor_WINDOW_5de37043a91a9c40() {
	const ret = typeof window === "undefined" ? null : window;
	return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
}
function __wbg_subarray_aa9065fa9dc5df96(arg0, arg1, arg2) {
	const ret = arg0.subarray(arg1 >>> 0, arg2 >>> 0);
	return ret;
}
function __wbg_then_44b73946d2fb3e7d(arg0, arg1) {
	const ret = arg0.then(arg1);
	return ret;
}
function __wbg_then_48b406749878a531(arg0, arg1, arg2) {
	const ret = arg0.then(arg1, arg2);
	return ret;
}
function __wbg_valueOf_7392193dd78c6b97(arg0) {
	const ret = arg0.valueOf();
	return ret;
}
function __wbg_value_cd1ffa7b1ab794f1(arg0) {
	const ret = arg0.value;
	return ret;
}
function __wbg_versions_a8e5a362e1f16442(arg0) {
	const ret = arg0.versions;
	return ret;
}
function __wbindgen_as_number(arg0) {
	const ret = +arg0;
	return ret;
}
function __wbindgen_bigint_from_i64(arg0) {
	const ret = arg0;
	return ret;
}
function __wbindgen_bigint_from_u64(arg0) {
	const ret = BigInt.asUintN(64, arg0);
	return ret;
}
function __wbindgen_bigint_get_as_i64(arg0, arg1) {
	const v = arg1;
	const ret = typeof v === "bigint" ? v : void 0;
	getDataViewMemory0().setBigInt64(arg0 + 8, isLikeNone(ret) ? BigInt(0) : ret, true);
	getDataViewMemory0().setInt32(arg0 + 0, !isLikeNone(ret), true);
}
function __wbindgen_boolean_get(arg0) {
	const v = arg0;
	const ret = typeof v === "boolean" ? v ? 1 : 0 : 2;
	return ret;
}
function __wbindgen_cb_drop(arg0) {
	const obj = arg0.original;
	if (obj.cnt-- == 1) {
		obj.a = 0;
		return true;
	}
	const ret = false;
	return ret;
}
function __wbindgen_closure_wrapper7001(arg0, arg1, arg2) {
	const ret = makeMutClosure(arg0, arg1, 733, __wbg_adapter_52);
	return ret;
}
function __wbindgen_debug_string(arg0, arg1) {
	const ret = debugString(arg1);
	const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
	const len1 = WASM_VECTOR_LEN;
	getDataViewMemory0().setInt32(arg0 + 4, len1, true);
	getDataViewMemory0().setInt32(arg0 + 0, ptr1, true);
}
function __wbindgen_error_new(arg0, arg1) {
	const ret = new Error(getStringFromWasm0(arg0, arg1));
	return ret;
}
function __wbindgen_in(arg0, arg1) {
	const ret = arg0 in arg1;
	return ret;
}
function __wbindgen_init_externref_table() {
	const table = wasm.__wbindgen_export_4;
	const offset = table.grow(4);
	table.set(0, void 0);
	table.set(offset + 0, void 0);
	table.set(offset + 1, null);
	table.set(offset + 2, true);
	table.set(offset + 3, false);
}
function __wbindgen_is_bigint(arg0) {
	const ret = typeof arg0 === "bigint";
	return ret;
}
function __wbindgen_is_function(arg0) {
	const ret = typeof arg0 === "function";
	return ret;
}
function __wbindgen_is_object(arg0) {
	const val = arg0;
	const ret = typeof val === "object" && val !== null;
	return ret;
}
function __wbindgen_is_string(arg0) {
	const ret = typeof arg0 === "string";
	return ret;
}
function __wbindgen_is_undefined(arg0) {
	const ret = arg0 === void 0;
	return ret;
}
function __wbindgen_jsval_eq(arg0, arg1) {
	const ret = arg0 === arg1;
	return ret;
}
function __wbindgen_jsval_loose_eq(arg0, arg1) {
	const ret = arg0 == arg1;
	return ret;
}
function __wbindgen_memory() {
	const ret = wasm.memory;
	return ret;
}
function __wbindgen_number_get(arg0, arg1) {
	const obj = arg1;
	const ret = typeof obj === "number" ? obj : void 0;
	getDataViewMemory0().setFloat64(arg0 + 8, isLikeNone(ret) ? 0 : ret, true);
	getDataViewMemory0().setInt32(arg0 + 0, !isLikeNone(ret), true);
}
function __wbindgen_number_new(arg0) {
	const ret = arg0;
	return ret;
}
function __wbindgen_string_get(arg0, arg1) {
	const obj = arg1;
	const ret = typeof obj === "string" ? obj : void 0;
	var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
	var len1 = WASM_VECTOR_LEN;
	getDataViewMemory0().setInt32(arg0 + 4, len1, true);
	getDataViewMemory0().setInt32(arg0 + 0, ptr1, true);
}
function __wbindgen_string_new(arg0, arg1) {
	const ret = getStringFromWasm0(arg0, arg1);
	return ret;
}
function __wbindgen_throw(arg0, arg1) {
	throw new Error(getStringFromWasm0(arg0, arg1));
}
var wasm, WASM_VECTOR_LEN, cachedUint8ArrayMemory0, lTextEncoder, cachedTextEncoder, encodeString, cachedDataViewMemory0, lTextDecoder, cachedTextDecoder, CLOSURE_DTORS, SchemaEngineFinalization, SchemaEngine;
var init_schema_engine_bg = __esm({ "../../../node_modules/.pnpm/@prisma+schema-engine-wasm@6.13.0-35.361e86d0ea4987e9f53a565309b3eed797a6bcbd/node_modules/@prisma/schema-engine-wasm/schema_engine_bg.js": (() => {
	;
	WASM_VECTOR_LEN = 0;
	cachedUint8ArrayMemory0 = null;
	lTextEncoder = typeof TextEncoder === "undefined" ? (0, module.require)("util").TextEncoder : TextEncoder;
	cachedTextEncoder = new lTextEncoder("utf-8");
	encodeString = typeof cachedTextEncoder.encodeInto === "function" ? function(arg, view) {
		return cachedTextEncoder.encodeInto(arg, view);
	} : function(arg, view) {
		const buf = cachedTextEncoder.encode(arg);
		view.set(buf);
		return {
			read: arg.length,
			written: buf.length
		};
	};
	cachedDataViewMemory0 = null;
	lTextDecoder = typeof TextDecoder === "undefined" ? (0, module.require)("util").TextDecoder : TextDecoder;
	cachedTextDecoder = new lTextDecoder("utf-8", {
		ignoreBOM: true,
		fatal: true
	});
	cachedTextDecoder.decode();
	CLOSURE_DTORS = typeof FinalizationRegistry === "undefined" ? {
		register: () => {},
		unregister: () => {}
	} : new FinalizationRegistry((state) => {
		wasm.__wbindgen_export_5.get(state.dtor)(state.a, state.b);
	});
	SchemaEngineFinalization = typeof FinalizationRegistry === "undefined" ? {
		register: () => {},
		unregister: () => {}
	} : new FinalizationRegistry((ptr) => wasm.__wbg_schemaengine_free(ptr >>> 0, 1));
	SchemaEngine = class SchemaEngine {
		static __wrap(ptr) {
			ptr = ptr >>> 0;
			const obj = Object.create(SchemaEngine.prototype);
			obj.__wbg_ptr = ptr;
			SchemaEngineFinalization.register(obj, obj.__wbg_ptr, obj);
			return obj;
		}
		__destroy_into_raw() {
			const ptr = this.__wbg_ptr;
			this.__wbg_ptr = 0;
			SchemaEngineFinalization.unregister(this);
			return ptr;
		}
		free() {
			const ptr = this.__destroy_into_raw();
			wasm.__wbg_schemaengine_free(ptr, 0);
		}
		/**
		* @param {ConstructorOptions} options
		* @param {Function} callback
		* @param {object} adapter
		* @returns {Promise<SchemaEngine>}
		*/
		static new(options, callback, adapter) {
			const ret = wasm.schemaengine_new(options, callback, adapter);
			return ret;
		}
		/**
		* Debugging method that only panics, for tests.
		*/
		debugPanic() {
			wasm.schemaengine_debugPanic(this.__wbg_ptr);
		}
		/**
		* Return the database version as a string.
		* @param {GetDatabaseVersionInput | null} [_params]
		* @returns {Promise<string>}
		*/
		version(_params) {
			const ret = wasm.schemaengine_version(this.__wbg_ptr, isLikeNone(_params) ? 0 : addToExternrefTable0(_params));
			return ret;
		}
		/**
		* Apply all the unapplied migrations from the migrations folder.
		* @param {ApplyMigrationsInput} input
		* @returns {Promise<ApplyMigrationsOutput>}
		*/
		applyMigrations(input) {
			const ret = wasm.schemaengine_applyMigrations(this.__wbg_ptr, input);
			return ret;
		}
		/**
		* Generate a new migration, based on the provided schema and existing migrations history.
		* @param {CreateMigrationInput} input
		* @returns {Promise<CreateMigrationOutput>}
		*/
		createMigration(input) {
			const ret = wasm.schemaengine_createMigration(this.__wbg_ptr, input);
			return ret;
		}
		/**
		* Send a raw command to the database.
		* @param {DbExecuteParams} params
		* @returns {Promise<void>}
		*/
		dbExecute(params) {
			const ret = wasm.schemaengine_dbExecute(this.__wbg_ptr, params);
			return ret;
		}
		/**
		* Tells the CLI what to do in `migrate dev`.
		* @param {DevDiagnosticInput} input
		* @returns {Promise<DevDiagnosticOutput>}
		*/
		devDiagnostic(input) {
			const ret = wasm.schemaengine_devDiagnostic(this.__wbg_ptr, input);
			return ret;
		}
		/**
		* Create a migration between any two sources of database schemas.
		* @param {DiffParams} params
		* @returns {Promise<DiffResult>}
		*/
		diff(params) {
			const ret = wasm.schemaengine_diff(this.__wbg_ptr, params);
			return ret;
		}
		/**
		* Looks at the migrations folder and the database, and returns a bunch of useful information.
		* @param {DiagnoseMigrationHistoryInput} input
		* @returns {Promise<DiagnoseMigrationHistoryOutput>}
		*/
		diagnoseMigrationHistory(input) {
			const ret = wasm.schemaengine_diagnoseMigrationHistory(this.__wbg_ptr, input);
			return ret;
		}
		/**
		* Make sure the connection to the database is established and valid.
		* Connectors can choose to connect lazily, but this method should force
		* them to connect.
		* @param {EnsureConnectionValidityParams} _params
		* @returns {Promise<EnsureConnectionValidityResult>}
		*/
		ensureConnectionValidity(_params) {
			const ret = wasm.schemaengine_ensureConnectionValidity(this.__wbg_ptr, _params);
			return ret;
		}
		/**
		* Evaluate the consequences of running the next migration we would generate, given the current state of a Prisma schema.
		* @param {EvaluateDataLossInput} input
		* @returns {Promise<EvaluateDataLossOutput>}
		*/
		evaluateDataLoss(input) {
			const ret = wasm.schemaengine_evaluateDataLoss(this.__wbg_ptr, input);
			return ret;
		}
		/**
		* Introspect the database schema.
		* @param {IntrospectParams} params
		* @returns {Promise<IntrospectResult>}
		*/
		introspect(params) {
			const ret = wasm.schemaengine_introspect(this.__wbg_ptr, params);
			return ret;
		}
		/**
		* Introspects a SQL query and returns types information.
		* Note: this will fail on SQLite, as it requires Wasm-compatible sqlx implementation.
		* @param {IntrospectSqlParams} params
		* @returns {Promise<IntrospectSqlResult>}
		*/
		introspectSql(params) {
			const ret = wasm.schemaengine_introspectSql(this.__wbg_ptr, params);
			return ret;
		}
		/**
		* Mark a migration from the migrations folder as applied, without actually applying it.
		* @param {MarkMigrationAppliedInput} input
		* @returns {Promise<MarkMigrationAppliedOutput>}
		*/
		markMigrationApplied(input) {
			const ret = wasm.schemaengine_markMigrationApplied(this.__wbg_ptr, input);
			return ret;
		}
		/**
		* Mark a migration as rolled back.
		* @param {MarkMigrationRolledBackInput} input
		* @returns {Promise<MarkMigrationRolledBackOutput>}
		*/
		markMigrationRolledBack(input) {
			const ret = wasm.schemaengine_markMigrationRolledBack(this.__wbg_ptr, input);
			return ret;
		}
		/**
		* Reset a database to an empty state (no data, no schema).
		* @param {ResetInput} input
		* @returns {Promise<void>}
		*/
		reset(input) {
			const ret = wasm.schemaengine_reset(this.__wbg_ptr, input);
			return ret;
		}
		/**
		* The command behind `prisma db push`.
		* @param {SchemaPushInput} input
		* @returns {Promise<SchemaPushOutput>}
		*/
		schemaPush(input) {
			const ret = wasm.schemaengine_schemaPush(this.__wbg_ptr, input);
			return ret;
		}
	};
}) });

//#endregion
init_schema_engine_bg();
export { SchemaEngine, __wbg_String_8f0eb39a4a4c2f66, __wbg_buffer_609cc3eee51ed158, __wbg_call_672a4d21634d4a24, __wbg_call_7cccdd69e0791ae2, __wbg_crypto_805be4ce92f1e370, __wbg_done_769e5ede4b31c67b, __wbg_entries_3265d4158b33e5dc, __wbg_exec_3e2d2d0644c927df, __wbg_getRandomValues_f6a868620c8bab49, __wbg_getTime_46267b1c24877e30, __wbg_get_67b2ba62fc30de12, __wbg_get_b9b93047fe3cf45b, __wbg_get_ece95cf6585650d9, __wbg_getwithrefkey_1dc361bd10053bfe, __wbg_has_a5ea9117f258a0ec, __wbg_instanceof_ArrayBuffer_e14585432e3737fc, __wbg_instanceof_Map_f3469ce2244d2430, __wbg_instanceof_Promise_935168b8f4b49db3, __wbg_instanceof_Uint8Array_17156bcf118086a9, __wbg_isArray_a1eab7e0d067391b, __wbg_isSafeInteger_343e2beeeece1bb0, __wbg_iterator_9a24c88df860dc65, __wbg_length_a446193dc22c12f8, __wbg_length_e2d2a49132c1b256, __wbg_msCrypto_2ac4d17c4748234a, __wbg_new0_f788a2397c7ca929, __wbg_new_23a2665fac83c611, __wbg_new_405e22f390576ce2, __wbg_new_5e0be73521bc8c17, __wbg_new_63847613cde5d4bc, __wbg_new_78feb108b6472713, __wbg_new_a12002a7f91c75be, __wbg_new_c68d7209be747379, __wbg_newnoargs_105ed471475aaf50, __wbg_newwithbyteoffsetandlength_d97e637ebe145a9a, __wbg_newwithlength_a381634e90c276d4, __wbg_next_25feadfc0913fea9, __wbg_next_6574e1a8a62d1055, __wbg_node_ecc8306b9857f33d, __wbg_now_7fd00a794a07d388, __wbg_now_807e54c39636c349, __wbg_process_5cff2739921be718, __wbg_push_737cfc8c1432c2c6, __wbg_queueMicrotask_5a8a9131f3f0b37b, __wbg_queueMicrotask_6d79674585219521, __wbg_randomFillSync_d3c85af7e31cf1f8, __wbg_require_0c566c6f2eef6c79, __wbg_resolve_4851785c9c5f573d, __wbg_schemaengine_new, __wbg_setTimeout_5d6a1d4fc51ea450, __wbg_set_37837023f3d740e8, __wbg_set_3f1d0b984ed272ed, __wbg_set_65595bdd868b3009, __wbg_set_8fc6bf8a5b1071d1, __wbg_set_bb8cecf6a62b9f46, __wbg_set_wasm, __wbg_setmessage_f18c00fbf3b3e80e, __wbg_setname_6df54b7ebf9404a9, __wbg_static_accessor_GLOBAL_88a902d13a557d07, __wbg_static_accessor_GLOBAL_THIS_56578be7e9f832b0, __wbg_static_accessor_SELF_37c5d418e4bf5819, __wbg_static_accessor_WINDOW_5de37043a91a9c40, __wbg_subarray_aa9065fa9dc5df96, __wbg_then_44b73946d2fb3e7d, __wbg_then_48b406749878a531, __wbg_valueOf_7392193dd78c6b97, __wbg_value_cd1ffa7b1ab794f1, __wbg_versions_a8e5a362e1f16442, __wbindgen_as_number, __wbindgen_bigint_from_i64, __wbindgen_bigint_from_u64, __wbindgen_bigint_get_as_i64, __wbindgen_boolean_get, __wbindgen_cb_drop, __wbindgen_closure_wrapper7001, __wbindgen_debug_string, __wbindgen_error_new, __wbindgen_in, __wbindgen_init_externref_table, __wbindgen_is_bigint, __wbindgen_is_function, __wbindgen_is_object, __wbindgen_is_string, __wbindgen_is_undefined, __wbindgen_jsval_eq, __wbindgen_jsval_loose_eq, __wbindgen_memory, __wbindgen_number_get, __wbindgen_number_new, __wbindgen_string_get, __wbindgen_string_new, __wbindgen_throw, version };
//# sourceMappingURL=schema_engine_bg-DSUTdwTU.mjs.map
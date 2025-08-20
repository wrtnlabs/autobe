import { __commonJS, __esm, __require, __toESM } from "./chunk-Dsqw6BSZ.mjs";
import { basename, defu, dirname, extname, findWorkspaceDir, init_defu, init_dist as init_dist$2, init_dist$1, init_dist$2 as init_dist, join, normalize, readPackageJSON, resolve, resolveModulePath } from "./dist-CyEe98Vh.mjs";
import { createJiti, init_jiti } from "./jiti-BkX-gwZU.mjs";
import "./confbox.DA7CpUDY-OEXYll-I.mjs";
import "./json5-5WJYCdQo.mjs";
import "./confbox.DnMsyigM-CswRG8Y_.mjs";
import "./yaml-GCVX7Hri.mjs";
import "./toml-rJR_s7-k.mjs";
import { resolve as resolve$1 } from "node:path";
import { pathToFileURL } from "node:url";
import { readFile, rm } from "node:fs/promises";
import { existsSync, promises, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";

//#region ../../../node_modules/.pnpm/destr@2.0.5/node_modules/destr/dist/index.mjs
function jsonParseTransform(key, value) {
	if (key === "__proto__" || key === "constructor" && value && typeof value === "object" && "prototype" in value) {
		warnKeyDropped(key);
		return;
	}
	return value;
}
function warnKeyDropped(key) {
	console.warn(`[destr] Dropping "${key}" key to prevent prototype pollution.`);
}
function destr(value, options = {}) {
	if (typeof value !== "string") return value;
	if (value[0] === "\"" && value[value.length - 1] === "\"" && value.indexOf("\\") === -1) return value.slice(1, -1);
	const _value = value.trim();
	if (_value.length <= 9) switch (_value.toLowerCase()) {
		case "true": return true;
		case "false": return false;
		case "undefined": return void 0;
		case "null": return null;
		case "nan": return NaN;
		case "infinity": return Number.POSITIVE_INFINITY;
		case "-infinity": return Number.NEGATIVE_INFINITY;
	}
	if (!JsonSigRx.test(value)) {
		if (options.strict) throw new SyntaxError("[destr] Invalid JSON");
		return value;
	}
	try {
		if (suspectProtoRx.test(value) || suspectConstructorRx.test(value)) {
			if (options.strict) throw new Error("[destr] Possible prototype pollution");
			return JSON.parse(value, jsonParseTransform);
		}
		return JSON.parse(value);
	} catch (error) {
		if (options.strict) throw error;
		return value;
	}
}
var suspectProtoRx, suspectConstructorRx, JsonSigRx;
var init_dist$5 = __esm({ "../../../node_modules/.pnpm/destr@2.0.5/node_modules/destr/dist/index.mjs": (() => {
	suspectProtoRx = /"(?:_|\\u0{2}5[Ff]){2}(?:p|\\u0{2}70)(?:r|\\u0{2}72)(?:o|\\u0{2}6[Ff])(?:t|\\u0{2}74)(?:o|\\u0{2}6[Ff])(?:_|\\u0{2}5[Ff]){2}"\s*:/;
	suspectConstructorRx = /"(?:c|\\u0063)(?:o|\\u006[Ff])(?:n|\\u006[Ee])(?:s|\\u0073)(?:t|\\u0074)(?:r|\\u0072)(?:u|\\u0075)(?:c|\\u0063)(?:t|\\u0074)(?:o|\\u006[Ff])(?:r|\\u0072)"\s*:/;
	JsonSigRx = /^\s*["[{]|^\s*-?\d{1,16}(\.\d{1,17})?([Ee][+-]?\d+)?\s*$/;
}) });

//#endregion
//#region ../../../node_modules/.pnpm/rc9@2.1.2/node_modules/rc9/dist/index.mjs
function isBuffer(obj) {
	return obj && obj.constructor && typeof obj.constructor.isBuffer === "function" && obj.constructor.isBuffer(obj);
}
function keyIdentity(key) {
	return key;
}
function flatten(target, opts) {
	opts = opts || {};
	const delimiter = opts.delimiter || ".";
	const maxDepth = opts.maxDepth;
	const transformKey = opts.transformKey || keyIdentity;
	const output = {};
	function step(object, prev, currentDepth) {
		currentDepth = currentDepth || 1;
		Object.keys(object).forEach(function(key) {
			const value = object[key];
			const isarray = opts.safe && Array.isArray(value);
			const type = Object.prototype.toString.call(value);
			const isbuffer = isBuffer(value);
			const isobject = type === "[object Object]" || type === "[object Array]";
			const newKey = prev ? prev + delimiter + transformKey(key) : transformKey(key);
			if (!isarray && !isbuffer && isobject && Object.keys(value).length && (!opts.maxDepth || currentDepth < maxDepth)) return step(value, newKey, currentDepth + 1);
			output[newKey] = value;
		});
	}
	step(target);
	return output;
}
function unflatten(target, opts) {
	opts = opts || {};
	const delimiter = opts.delimiter || ".";
	const overwrite = opts.overwrite || false;
	const transformKey = opts.transformKey || keyIdentity;
	const result = {};
	const isbuffer = isBuffer(target);
	if (isbuffer || Object.prototype.toString.call(target) !== "[object Object]") return target;
	function getkey(key) {
		const parsedKey = Number(key);
		return isNaN(parsedKey) || key.indexOf(".") !== -1 || opts.object ? key : parsedKey;
	}
	function addKeys(keyPrefix, recipient, target$1) {
		return Object.keys(target$1).reduce(function(result$1, key) {
			result$1[keyPrefix + delimiter + key] = target$1[key];
			return result$1;
		}, recipient);
	}
	function isEmpty(val) {
		const type = Object.prototype.toString.call(val);
		const isArray = type === "[object Array]";
		const isObject = type === "[object Object]";
		if (!val) return true;
		else if (isArray) return !val.length;
		else if (isObject) return !Object.keys(val).length;
	}
	target = Object.keys(target).reduce(function(result$1, key) {
		const type = Object.prototype.toString.call(target[key]);
		const isObject = type === "[object Object]" || type === "[object Array]";
		if (!isObject || isEmpty(target[key])) {
			result$1[key] = target[key];
			return result$1;
		} else return addKeys(key, result$1, flatten(target[key], opts));
	}, {});
	Object.keys(target).forEach(function(key) {
		const split = key.split(delimiter).map(transformKey);
		let key1 = getkey(split.shift());
		let key2 = getkey(split[0]);
		let recipient = result;
		while (key2 !== void 0) {
			if (key1 === "__proto__") return;
			const type = Object.prototype.toString.call(recipient[key1]);
			const isobject = type === "[object Object]" || type === "[object Array]";
			if (!overwrite && !isobject && typeof recipient[key1] !== "undefined") return;
			if (overwrite && !isobject || !overwrite && recipient[key1] == null) recipient[key1] = typeof key2 === "number" && !opts.object ? [] : {};
			recipient = recipient[key1];
			if (split.length > 0) {
				key1 = getkey(split.shift());
				key2 = getkey(split[0]);
			}
		}
		recipient[key1] = unflatten(target[key], opts);
	});
	return result;
}
function withDefaults(options) {
	if (typeof options === "string") options = { name: options };
	return {
		...defaults,
		...options
	};
}
function parse$1(contents, options = {}) {
	const config$1 = {};
	const lines = contents.split(RE_LINES);
	for (const line of lines) {
		const match = line.match(RE_KEY_VAL);
		if (!match) continue;
		const key = match[1];
		if (!key || key === "__proto__" || key === "constructor") continue;
		const value = destr((match[2] || "").trim());
		if (key.endsWith("[]")) {
			const nkey = key.slice(0, Math.max(0, key.length - 2));
			config$1[nkey] = (config$1[nkey] || []).concat(value);
			continue;
		}
		config$1[key] = value;
	}
	return options.flat ? config$1 : unflatten(config$1, { overwrite: true });
}
function parseFile(path$2, options) {
	if (!existsSync(path$2)) return {};
	return parse$1(readFileSync(path$2, "utf8"), options);
}
function read(options) {
	options = withDefaults(options);
	return parseFile(resolve$1(options.dir, options.name), options);
}
function readUser(options) {
	options = withDefaults(options);
	options.dir = process.env.XDG_CONFIG_HOME || homedir();
	return read(options);
}
var RE_KEY_VAL, RE_LINES, defaults;
var init_dist$4 = __esm({ "../../../node_modules/.pnpm/rc9@2.1.2/node_modules/rc9/dist/index.mjs": (() => {
	init_dist$5();
	init_defu();
	RE_KEY_VAL = /^\s*([^\s=]+)\s*=\s*(.*)?\s*$/;
	RE_LINES = /\n|\r|\r\n/;
	defaults = {
		name: ".conf",
		dir: process.cwd(),
		flat: false
	};
}) });

//#endregion
//#region ../../../node_modules/.pnpm/dotenv@16.6.1/node_modules/dotenv/package.json
var require_package = /* @__PURE__ */ __commonJS({ "../../../node_modules/.pnpm/dotenv@16.6.1/node_modules/dotenv/package.json": ((exports, module) => {
	module.exports = {
		"name": "dotenv",
		"version": "16.6.1",
		"description": "Loads environment variables from .env file",
		"main": "lib/main.js",
		"types": "lib/main.d.ts",
		"exports": {
			".": {
				"types": "./lib/main.d.ts",
				"require": "./lib/main.js",
				"default": "./lib/main.js"
			},
			"./config": "./config.js",
			"./config.js": "./config.js",
			"./lib/env-options": "./lib/env-options.js",
			"./lib/env-options.js": "./lib/env-options.js",
			"./lib/cli-options": "./lib/cli-options.js",
			"./lib/cli-options.js": "./lib/cli-options.js",
			"./package.json": "./package.json"
		},
		"scripts": {
			"dts-check": "tsc --project tests/types/tsconfig.json",
			"lint": "standard",
			"pretest": "npm run lint && npm run dts-check",
			"test": "tap run --allow-empty-coverage --disable-coverage --timeout=60000",
			"test:coverage": "tap run --show-full-coverage --timeout=60000 --coverage-report=text --coverage-report=lcov",
			"prerelease": "npm test",
			"release": "standard-version"
		},
		"repository": {
			"type": "git",
			"url": "git://github.com/motdotla/dotenv.git"
		},
		"homepage": "https://github.com/motdotla/dotenv#readme",
		"funding": "https://dotenvx.com",
		"keywords": [
			"dotenv",
			"env",
			".env",
			"environment",
			"variables",
			"config",
			"settings"
		],
		"readmeFilename": "README.md",
		"license": "BSD-2-Clause",
		"devDependencies": {
			"@types/node": "^18.11.3",
			"decache": "^4.6.2",
			"sinon": "^14.0.1",
			"standard": "^17.0.0",
			"standard-version": "^9.5.0",
			"tap": "^19.2.0",
			"typescript": "^4.8.4"
		},
		"engines": { "node": ">=12" },
		"browser": { "fs": false }
	};
}) });

//#endregion
//#region ../../../node_modules/.pnpm/dotenv@16.6.1/node_modules/dotenv/lib/main.js
var require_main = /* @__PURE__ */ __commonJS({ "../../../node_modules/.pnpm/dotenv@16.6.1/node_modules/dotenv/lib/main.js": ((exports, module) => {
	const fs$1 = __require("fs");
	const path$1 = __require("path");
	const os = __require("os");
	const crypto = __require("crypto");
	const packageJson = require_package();
	const version = packageJson.version;
	const LINE = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/gm;
	function parse(src) {
		const obj = {};
		let lines = src.toString();
		lines = lines.replace(/\r\n?/gm, "\n");
		let match;
		while ((match = LINE.exec(lines)) != null) {
			const key = match[1];
			let value = match[2] || "";
			value = value.trim();
			const maybeQuote = value[0];
			value = value.replace(/^(['"`])([\s\S]*)\1$/gm, "$2");
			if (maybeQuote === "\"") {
				value = value.replace(/\\n/g, "\n");
				value = value.replace(/\\r/g, "\r");
			}
			obj[key] = value;
		}
		return obj;
	}
	function _parseVault(options) {
		options = options || {};
		const vaultPath = _vaultPath(options);
		options.path = vaultPath;
		const result = DotenvModule.configDotenv(options);
		if (!result.parsed) {
			const err = /* @__PURE__ */ new Error(`MISSING_DATA: Cannot parse ${vaultPath} for an unknown reason`);
			err.code = "MISSING_DATA";
			throw err;
		}
		const keys = _dotenvKey(options).split(",");
		const length = keys.length;
		let decrypted;
		for (let i = 0; i < length; i++) try {
			const key = keys[i].trim();
			const attrs = _instructions(result, key);
			decrypted = DotenvModule.decrypt(attrs.ciphertext, attrs.key);
			break;
		} catch (error) {
			if (i + 1 >= length) throw error;
		}
		return DotenvModule.parse(decrypted);
	}
	function _warn(message) {
		console.log(`[dotenv@${version}][WARN] ${message}`);
	}
	function _debug(message) {
		console.log(`[dotenv@${version}][DEBUG] ${message}`);
	}
	function _log(message) {
		console.log(`[dotenv@${version}] ${message}`);
	}
	function _dotenvKey(options) {
		if (options && options.DOTENV_KEY && options.DOTENV_KEY.length > 0) return options.DOTENV_KEY;
		if (process.env.DOTENV_KEY && process.env.DOTENV_KEY.length > 0) return process.env.DOTENV_KEY;
		return "";
	}
	function _instructions(result, dotenvKey) {
		let uri;
		try {
			uri = new URL(dotenvKey);
		} catch (error) {
			if (error.code === "ERR_INVALID_URL") {
				const err = /* @__PURE__ */ new Error("INVALID_DOTENV_KEY: Wrong format. Must be in valid uri format like dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=development");
				err.code = "INVALID_DOTENV_KEY";
				throw err;
			}
			throw error;
		}
		const key = uri.password;
		if (!key) {
			const err = /* @__PURE__ */ new Error("INVALID_DOTENV_KEY: Missing key part");
			err.code = "INVALID_DOTENV_KEY";
			throw err;
		}
		const environment = uri.searchParams.get("environment");
		if (!environment) {
			const err = /* @__PURE__ */ new Error("INVALID_DOTENV_KEY: Missing environment part");
			err.code = "INVALID_DOTENV_KEY";
			throw err;
		}
		const environmentKey = `DOTENV_VAULT_${environment.toUpperCase()}`;
		const ciphertext = result.parsed[environmentKey];
		if (!ciphertext) {
			const err = /* @__PURE__ */ new Error(`NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment ${environmentKey} in your .env.vault file.`);
			err.code = "NOT_FOUND_DOTENV_ENVIRONMENT";
			throw err;
		}
		return {
			ciphertext,
			key
		};
	}
	function _vaultPath(options) {
		let possibleVaultPath = null;
		if (options && options.path && options.path.length > 0) if (Array.isArray(options.path)) {
			for (const filepath of options.path) if (fs$1.existsSync(filepath)) possibleVaultPath = filepath.endsWith(".vault") ? filepath : `${filepath}.vault`;
		} else possibleVaultPath = options.path.endsWith(".vault") ? options.path : `${options.path}.vault`;
		else possibleVaultPath = path$1.resolve(process.cwd(), ".env.vault");
		if (fs$1.existsSync(possibleVaultPath)) return possibleVaultPath;
		return null;
	}
	function _resolveHome(envPath) {
		return envPath[0] === "~" ? path$1.join(os.homedir(), envPath.slice(1)) : envPath;
	}
	function _configVault(options) {
		const debug = Boolean(options && options.debug);
		const quiet = options && "quiet" in options ? options.quiet : true;
		if (debug || !quiet) _log("Loading env from encrypted .env.vault");
		const parsed = DotenvModule._parseVault(options);
		let processEnv = process.env;
		if (options && options.processEnv != null) processEnv = options.processEnv;
		DotenvModule.populate(processEnv, parsed, options);
		return { parsed };
	}
	function configDotenv(options) {
		const dotenvPath = path$1.resolve(process.cwd(), ".env");
		let encoding = "utf8";
		const debug = Boolean(options && options.debug);
		const quiet = options && "quiet" in options ? options.quiet : true;
		if (options && options.encoding) encoding = options.encoding;
		else if (debug) _debug("No encoding is specified. UTF-8 is used by default");
		let optionPaths = [dotenvPath];
		if (options && options.path) if (!Array.isArray(options.path)) optionPaths = [_resolveHome(options.path)];
		else {
			optionPaths = [];
			for (const filepath of options.path) optionPaths.push(_resolveHome(filepath));
		}
		let lastError;
		const parsedAll = {};
		for (const path$2 of optionPaths) try {
			const parsed = DotenvModule.parse(fs$1.readFileSync(path$2, { encoding }));
			DotenvModule.populate(parsedAll, parsed, options);
		} catch (e) {
			if (debug) _debug(`Failed to load ${path$2} ${e.message}`);
			lastError = e;
		}
		let processEnv = process.env;
		if (options && options.processEnv != null) processEnv = options.processEnv;
		DotenvModule.populate(processEnv, parsedAll, options);
		if (debug || !quiet) {
			const keysCount = Object.keys(parsedAll).length;
			const shortPaths = [];
			for (const filePath of optionPaths) try {
				const relative = path$1.relative(process.cwd(), filePath);
				shortPaths.push(relative);
			} catch (e) {
				if (debug) _debug(`Failed to load ${filePath} ${e.message}`);
				lastError = e;
			}
			_log(`injecting env (${keysCount}) from ${shortPaths.join(",")}`);
		}
		if (lastError) return {
			parsed: parsedAll,
			error: lastError
		};
		else return { parsed: parsedAll };
	}
	function config(options) {
		if (_dotenvKey(options).length === 0) return DotenvModule.configDotenv(options);
		const vaultPath = _vaultPath(options);
		if (!vaultPath) {
			_warn(`You set DOTENV_KEY but you are missing a .env.vault file at ${vaultPath}. Did you forget to build it?`);
			return DotenvModule.configDotenv(options);
		}
		return DotenvModule._configVault(options);
	}
	function decrypt(encrypted, keyStr) {
		const key = Buffer.from(keyStr.slice(-64), "hex");
		let ciphertext = Buffer.from(encrypted, "base64");
		const nonce = ciphertext.subarray(0, 12);
		const authTag = ciphertext.subarray(-16);
		ciphertext = ciphertext.subarray(12, -16);
		try {
			const aesgcm = crypto.createDecipheriv("aes-256-gcm", key, nonce);
			aesgcm.setAuthTag(authTag);
			return `${aesgcm.update(ciphertext)}${aesgcm.final()}`;
		} catch (error) {
			const isRange = error instanceof RangeError;
			const invalidKeyLength = error.message === "Invalid key length";
			const decryptionFailed = error.message === "Unsupported state or unable to authenticate data";
			if (isRange || invalidKeyLength) {
				const err = /* @__PURE__ */ new Error("INVALID_DOTENV_KEY: It must be 64 characters long (or more)");
				err.code = "INVALID_DOTENV_KEY";
				throw err;
			} else if (decryptionFailed) {
				const err = /* @__PURE__ */ new Error("DECRYPTION_FAILED: Please check your DOTENV_KEY");
				err.code = "DECRYPTION_FAILED";
				throw err;
			} else throw error;
		}
	}
	function populate(processEnv, parsed, options = {}) {
		const debug = Boolean(options && options.debug);
		const override = Boolean(options && options.override);
		if (typeof parsed !== "object") {
			const err = /* @__PURE__ */ new Error("OBJECT_REQUIRED: Please check the processEnv argument being passed to populate");
			err.code = "OBJECT_REQUIRED";
			throw err;
		}
		for (const key of Object.keys(parsed)) if (Object.prototype.hasOwnProperty.call(processEnv, key)) {
			if (override === true) processEnv[key] = parsed[key];
			if (debug) if (override === true) _debug(`"${key}" is already defined and WAS overwritten`);
			else _debug(`"${key}" is already defined and was NOT overwritten`);
		} else processEnv[key] = parsed[key];
	}
	const DotenvModule = {
		configDotenv,
		_configVault,
		_parseVault,
		config,
		decrypt,
		parse,
		populate
	};
	module.exports.configDotenv = DotenvModule.configDotenv;
	module.exports._configVault = DotenvModule._configVault;
	module.exports._parseVault = DotenvModule._parseVault;
	module.exports.config = DotenvModule.config;
	module.exports.decrypt = DotenvModule.decrypt;
	module.exports.parse = DotenvModule.parse;
	module.exports.populate = DotenvModule.populate;
	module.exports = DotenvModule;
}) });

//#endregion
//#region ../../../node_modules/.pnpm/c12@3.1.0/node_modules/c12/dist/shared/c12.BXpNC6YI.mjs
async function setupDotenv(options) {
	const targetEnvironment = options.env ?? process.env;
	const environment = await loadDotenv({
		cwd: options.cwd,
		fileName: options.fileName ?? ".env",
		env: targetEnvironment,
		interpolate: options.interpolate ?? true
	});
	const dotenvVars = getDotEnvVars(targetEnvironment);
	for (const key in environment) {
		if (key.startsWith("_")) continue;
		if (targetEnvironment[key] === void 0 || dotenvVars.has(key)) targetEnvironment[key] = environment[key];
	}
	return environment;
}
async function loadDotenv(options) {
	const environment = /* @__PURE__ */ Object.create(null);
	const dotenvFile = resolve(options.cwd, options.fileName);
	const dotenvVars = getDotEnvVars(options.env || {});
	Object.assign(environment, options.env);
	if (statSync(dotenvFile, { throwIfNoEntry: false })?.isFile()) {
		const parsed = import_main$1.parse(await promises.readFile(dotenvFile, "utf8"));
		for (const key in parsed) {
			if (key in environment && !dotenvVars.has(key)) continue;
			environment[key] = parsed[key];
			dotenvVars.add(key);
		}
	}
	if (options.interpolate) interpolate(environment);
	return environment;
}
function interpolate(target, source = {}, parse$2 = (v) => v) {
	function getValue(key) {
		return source[key] === void 0 ? target[key] : source[key];
	}
	function interpolate2(value, parents = []) {
		if (typeof value !== "string") return value;
		const matches = value.match(/(.?\${?(?:[\w:]+)?}?)/g) || [];
		return parse$2(matches.reduce((newValue, match) => {
			const parts = /(.?)\${?([\w:]+)?}?/g.exec(match) || [];
			const prefix = parts[1];
			let value2, replacePart;
			if (prefix === "\\") {
				replacePart = parts[0] || "";
				value2 = replacePart.replace(String.raw`\$`, "$");
			} else {
				const key = parts[2];
				replacePart = (parts[0] || "").slice(prefix.length);
				if (parents.includes(key)) {
					console.warn(`Please avoid recursive environment variables ( loop: ${parents.join(" > ")} > ${key} )`);
					return "";
				}
				value2 = getValue(key);
				value2 = interpolate2(value2, [...parents, key]);
			}
			return value2 === void 0 ? newValue : newValue.replace(replacePart, value2);
		}, value));
	}
	for (const key in target) target[key] = interpolate2(getValue(key));
}
function getDotEnvVars(targetEnvironment) {
	const globalRegistry = globalThis.__c12_dotenv_vars__ ||= /* @__PURE__ */ new Map();
	if (!globalRegistry.has(targetEnvironment)) globalRegistry.set(targetEnvironment, /* @__PURE__ */ new Set());
	return globalRegistry.get(targetEnvironment);
}
async function loadConfig(options) {
	options.cwd = resolve(process.cwd(), options.cwd || ".");
	options.name = options.name || "config";
	options.envName = options.envName ?? process.env.NODE_ENV;
	options.configFile = options.configFile ?? (options.name === "config" ? "config" : `${options.name}.config`);
	options.rcFile = options.rcFile ?? `.${options.name}rc`;
	if (options.extend !== false) options.extend = {
		extendKey: "extends",
		...options.extend
	};
	const _merger = options.merger || defu;
	options.jiti = options.jiti || createJiti(join(options.cwd, options.configFile), {
		interopDefault: true,
		moduleCache: false,
		extensions: [...SUPPORTED_EXTENSIONS],
		...options.jitiOptions
	});
	const r = {
		config: {},
		cwd: options.cwd,
		configFile: resolve(options.cwd, options.configFile),
		layers: []
	};
	const rawConfigs = {
		overrides: options.overrides,
		main: void 0,
		rc: void 0,
		packageJson: void 0,
		defaultConfig: options.defaultConfig
	};
	if (options.dotenv) await setupDotenv({
		cwd: options.cwd,
		...options.dotenv === true ? {} : options.dotenv
	});
	const _mainConfig = await resolveConfig(".", options);
	if (_mainConfig.configFile) {
		rawConfigs.main = _mainConfig.config;
		r.configFile = _mainConfig.configFile;
	}
	if (_mainConfig.meta) r.meta = _mainConfig.meta;
	if (options.rcFile) {
		const rcSources = [];
		rcSources.push(read({
			name: options.rcFile,
			dir: options.cwd
		}));
		if (options.globalRc) {
			const workspaceDir = await findWorkspaceDir(options.cwd).catch(() => {});
			if (workspaceDir) rcSources.push(read({
				name: options.rcFile,
				dir: workspaceDir
			}));
			rcSources.push(readUser({
				name: options.rcFile,
				dir: options.cwd
			}));
		}
		rawConfigs.rc = _merger({}, ...rcSources);
	}
	if (options.packageJson) {
		const keys = (Array.isArray(options.packageJson) ? options.packageJson : [typeof options.packageJson === "string" ? options.packageJson : options.name]).filter((t) => t && typeof t === "string");
		const pkgJsonFile = await readPackageJSON(options.cwd).catch(() => {});
		const values = keys.map((key) => pkgJsonFile?.[key]);
		rawConfigs.packageJson = _merger({}, ...values);
	}
	const configs = {};
	for (const key in rawConfigs) {
		const value = rawConfigs[key];
		configs[key] = await (typeof value === "function" ? value({
			configs,
			rawConfigs
		}) : value);
	}
	r.config = _merger(configs.overrides, configs.main, configs.rc, configs.packageJson, configs.defaultConfig);
	if (options.extend) {
		await extendConfig(r.config, options);
		r.layers = r.config._layers;
		delete r.config._layers;
		r.config = _merger(r.config, ...r.layers.map((e) => e.config));
	}
	const baseLayers = [
		configs.overrides && {
			config: configs.overrides,
			configFile: void 0,
			cwd: void 0
		},
		{
			config: configs.main,
			configFile: options.configFile,
			cwd: options.cwd
		},
		configs.rc && {
			config: configs.rc,
			configFile: options.rcFile
		},
		configs.packageJson && {
			config: configs.packageJson,
			configFile: "package.json"
		}
	].filter((l) => l && l.config);
	r.layers = [...baseLayers, ...r.layers];
	if (options.defaults) r.config = _merger(r.config, options.defaults);
	if (options.omit$Keys) {
		for (const key in r.config) if (key.startsWith("$")) delete r.config[key];
	}
	return r;
}
async function extendConfig(config$1, options) {
	config$1._layers = config$1._layers || [];
	if (!options.extend) return;
	let keys = options.extend.extendKey;
	if (typeof keys === "string") keys = [keys];
	const extendSources = [];
	for (const key of keys) {
		extendSources.push(...(Array.isArray(config$1[key]) ? config$1[key] : [config$1[key]]).filter(Boolean));
		delete config$1[key];
	}
	for (let extendSource of extendSources) {
		const originalExtendSource = extendSource;
		let sourceOptions = {};
		if (extendSource.source) {
			sourceOptions = extendSource.options || {};
			extendSource = extendSource.source;
		}
		if (Array.isArray(extendSource)) {
			sourceOptions = extendSource[1] || {};
			extendSource = extendSource[0];
		}
		if (typeof extendSource !== "string") {
			console.warn(`Cannot extend config from \`${JSON.stringify(originalExtendSource)}\` in ${options.cwd}`);
			continue;
		}
		const _config = await resolveConfig(extendSource, options, sourceOptions);
		if (!_config.config) {
			console.warn(`Cannot extend config from \`${extendSource}\` in ${options.cwd}`);
			continue;
		}
		await extendConfig(_config.config, {
			...options,
			cwd: _config.cwd
		});
		config$1._layers.push(_config);
		if (_config.config._layers) {
			config$1._layers.push(..._config.config._layers);
			delete _config.config._layers;
		}
	}
}
async function resolveConfig(source, options, sourceOptions = {}) {
	if (options.resolve) {
		const res2 = await options.resolve(source, options);
		if (res2) return res2;
	}
	const _merger = options.merger || defu;
	const customProviderKeys = Object.keys(sourceOptions.giget?.providers || {}).map((key) => `${key}:`);
	const gigetPrefixes = customProviderKeys.length > 0 ? [.../* @__PURE__ */ new Set([...customProviderKeys, ...GIGET_PREFIXES])] : GIGET_PREFIXES;
	if (options.giget !== false && gigetPrefixes.some((prefix) => source.startsWith(prefix))) {
		const { downloadTemplate } = await import("./dist-CHlpKDK4.mjs");
		const { digest } = await import("./dist-BZRtjVW3.mjs");
		const cloneName = source.replace(/\W+/g, "_").split("_").splice(0, 3).join("_") + "_" + digest(source).slice(0, 10).replace(/[-_]/g, "");
		let cloneDir;
		const localNodeModules = resolve(options.cwd, "node_modules");
		const parentDir = dirname(options.cwd);
		if (basename(parentDir) === ".c12") cloneDir = join(parentDir, cloneName);
		else if (existsSync(localNodeModules)) cloneDir = join(localNodeModules, ".c12", cloneName);
		else cloneDir = process.env.XDG_CACHE_HOME ? resolve(process.env.XDG_CACHE_HOME, "c12", cloneName) : resolve(homedir(), ".cache/c12", cloneName);
		if (existsSync(cloneDir) && !sourceOptions.install) await rm(cloneDir, { recursive: true });
		const cloned = await downloadTemplate(source, {
			dir: cloneDir,
			install: sourceOptions.install,
			force: sourceOptions.install,
			auth: sourceOptions.auth,
			...options.giget,
			...sourceOptions.giget
		});
		source = cloned.dir;
	}
	if (NPM_PACKAGE_RE.test(source)) source = tryResolve(source, options) || source;
	const ext = extname(source);
	const isDir = !ext || ext === basename(source);
	const cwd = resolve(options.cwd, isDir ? source : dirname(source));
	if (isDir) source = options.configFile;
	const res = {
		config: void 0,
		configFile: void 0,
		cwd,
		source,
		sourceOptions
	};
	res.configFile = tryResolve(resolve(cwd, source), options) || tryResolve(resolve(cwd, ".config", source.replace(/\.config$/, "")), options) || tryResolve(resolve(cwd, ".config", source), options) || source;
	if (!existsSync(res.configFile)) return res;
	const configFileExt = extname(res.configFile) || "";
	if (configFileExt in ASYNC_LOADERS) {
		const asyncLoader = await ASYNC_LOADERS[configFileExt]();
		const contents = await readFile(res.configFile, "utf8");
		res.config = asyncLoader(contents);
	} else res.config = await options.jiti.import(res.configFile, { default: true });
	if (typeof res.config === "function") res.config = await res.config();
	if (options.envName) {
		const envConfig = {
			...res.config["$" + options.envName],
			...res.config.$env?.[options.envName]
		};
		if (Object.keys(envConfig).length > 0) res.config = _merger(envConfig, res.config);
	}
	res.meta = defu(res.sourceOptions.meta, res.config.$meta);
	delete res.config.$meta;
	if (res.sourceOptions.overrides) res.config = _merger(res.sourceOptions.overrides, res.config);
	res.configFile = _normalize(res.configFile);
	res.source = _normalize(res.source);
	return res;
}
function tryResolve(id, options) {
	const res = resolveModulePath(id, {
		try: true,
		from: pathToFileURL(join(options.cwd || ".", options.configFile || "/")),
		suffixes: ["", "/index"],
		extensions: SUPPORTED_EXTENSIONS,
		cache: false
	});
	return res ? normalize(res) : void 0;
}
var import_main$1, _normalize, ASYNC_LOADERS, SUPPORTED_EXTENSIONS, GIGET_PREFIXES, NPM_PACKAGE_RE;
var init_c12_BXpNC6YI = __esm({ "../../../node_modules/.pnpm/c12@3.1.0/node_modules/c12/dist/shared/c12.BXpNC6YI.mjs": (() => {
	init_dist();
	init_dist$1();
	init_jiti();
	init_dist$4();
	init_defu();
	init_dist$2();
	import_main$1 = /* @__PURE__ */ __toESM(require_main(), 1);
	_normalize = (p) => p?.replace(/\\/g, "/");
	ASYNC_LOADERS = {
		".yaml": () => import("./yaml-CPXzsNx8.mjs").then((r) => r.parseYAML),
		".yml": () => import("./yaml-CPXzsNx8.mjs").then((r) => r.parseYAML),
		".jsonc": () => import("./jsonc-CE_RJIao.mjs").then((r) => r.parseJSONC),
		".json5": () => import("./json5-hnJ0hHtt.mjs").then((r) => r.parseJSON5),
		".toml": () => import("./toml-WNYnwce9.mjs").then((r) => r.parseTOML)
	};
	SUPPORTED_EXTENSIONS = Object.freeze([
		".js",
		".ts",
		".mjs",
		".cjs",
		".mts",
		".cts",
		".json",
		".jsonc",
		".json5",
		".yaml",
		".yml",
		".toml"
	]);
	GIGET_PREFIXES = [
		"gh:",
		"github:",
		"gitlab:",
		"bitbucket:",
		"https://",
		"http://"
	];
	NPM_PACKAGE_RE = /^(@[\da-z~-][\d._a-z~-]*\/)?[\da-z~-][\d._a-z~-]*($|\/.*)/;
}) });

//#endregion
//#region ../../../node_modules/.pnpm/c12@3.1.0/node_modules/c12/dist/index.mjs
var import_main;
var init_dist$3 = __esm({ "../../../node_modules/.pnpm/c12@3.1.0/node_modules/c12/dist/index.mjs": (() => {
	init_c12_BXpNC6YI();
	init_jiti();
	init_defu();
	import_main = /* @__PURE__ */ __toESM(require_main(), 1);
}) });

//#endregion
init_dist$3();
export { loadConfig };
//# sourceMappingURL=dist-Bd9NsUIK.mjs.map
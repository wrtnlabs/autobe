import { __esm } from "./chunk-Dsqw6BSZ.mjs";
import { h, init_confbox_DnMsyigM, x } from "./confbox.DnMsyigM-CswRG8Y_.mjs";
import path, { isAbsolute } from "node:path";
import { URL as URL$1, fileURLToPath, pathToFileURL } from "node:url";
import { readFile, writeFile } from "node:fs/promises";
import fs, { lstatSync, promises, realpathSync, statSync } from "node:fs";
import { format, inspect } from "node:util";
import assert from "node:assert";
import process$1 from "node:process";
import v8 from "node:v8";

//#region ../../../node_modules/.pnpm/pathe@2.0.3/node_modules/pathe/dist/shared/pathe.M-eThtNZ.mjs
function normalizeWindowsPath(input = "") {
	if (!input) return input;
	return input.replace(/\\/g, "/").replace(_DRIVE_LETTER_START_RE, (r) => r.toUpperCase());
}
function cwd() {
	if (typeof process !== "undefined" && typeof process.cwd === "function") return process.cwd().replace(/\\/g, "/");
	return "/";
}
function normalizeString(path$1, allowAboveRoot) {
	let res = "";
	let lastSegmentLength = 0;
	let lastSlash = -1;
	let dots = 0;
	let char = null;
	for (let index = 0; index <= path$1.length; ++index) {
		if (index < path$1.length) char = path$1[index];
		else if (char === "/") break;
		else char = "/";
		if (char === "/") {
			if (lastSlash === index - 1 || dots === 1);
			else if (dots === 2) {
				if (res.length < 2 || lastSegmentLength !== 2 || res[res.length - 1] !== "." || res[res.length - 2] !== ".") {
					if (res.length > 2) {
						const lastSlashIndex = res.lastIndexOf("/");
						if (lastSlashIndex === -1) {
							res = "";
							lastSegmentLength = 0;
						} else {
							res = res.slice(0, lastSlashIndex);
							lastSegmentLength = res.length - 1 - res.lastIndexOf("/");
						}
						lastSlash = index;
						dots = 0;
						continue;
					} else if (res.length > 0) {
						res = "";
						lastSegmentLength = 0;
						lastSlash = index;
						dots = 0;
						continue;
					}
				}
				if (allowAboveRoot) {
					res += res.length > 0 ? "/.." : "..";
					lastSegmentLength = 2;
				}
			} else {
				if (res.length > 0) res += `/${path$1.slice(lastSlash + 1, index)}`;
				else res = path$1.slice(lastSlash + 1, index);
				lastSegmentLength = index - lastSlash - 1;
			}
			lastSlash = index;
			dots = 0;
		} else if (char === "." && dots !== -1) ++dots;
		else dots = -1;
	}
	return res;
}
var _DRIVE_LETTER_START_RE, _UNC_REGEX, _IS_ABSOLUTE_RE, _DRIVE_LETTER_RE, _EXTNAME_RE, normalize, join, resolve$1, isAbsolute$1, extname$1, dirname, basename;
var init_pathe_M_eThtNZ = __esm({ "../../../node_modules/.pnpm/pathe@2.0.3/node_modules/pathe/dist/shared/pathe.M-eThtNZ.mjs": (() => {
	_DRIVE_LETTER_START_RE = /^[A-Za-z]:\//;
	_UNC_REGEX = /^[/\\]{2}/;
	_IS_ABSOLUTE_RE = /^[/\\](?![/\\])|^[/\\]{2}(?!\.)|^[A-Za-z]:[/\\]/;
	_DRIVE_LETTER_RE = /^[A-Za-z]:$/;
	_EXTNAME_RE = /.(\.[^./]+|\.)$/;
	normalize = function(path$1) {
		if (path$1.length === 0) return ".";
		path$1 = normalizeWindowsPath(path$1);
		const isUNCPath = path$1.match(_UNC_REGEX);
		const isPathAbsolute = isAbsolute$1(path$1);
		const trailingSeparator = path$1[path$1.length - 1] === "/";
		path$1 = normalizeString(path$1, !isPathAbsolute);
		if (path$1.length === 0) {
			if (isPathAbsolute) return "/";
			return trailingSeparator ? "./" : ".";
		}
		if (trailingSeparator) path$1 += "/";
		if (_DRIVE_LETTER_RE.test(path$1)) path$1 += "/";
		if (isUNCPath) {
			if (!isPathAbsolute) return `//./${path$1}`;
			return `//${path$1}`;
		}
		return isPathAbsolute && !isAbsolute$1(path$1) ? `/${path$1}` : path$1;
	};
	join = function(...segments) {
		let path$1 = "";
		for (const seg of segments) {
			if (!seg) continue;
			if (path$1.length > 0) {
				const pathTrailing = path$1[path$1.length - 1] === "/";
				const segLeading = seg[0] === "/";
				const both = pathTrailing && segLeading;
				if (both) path$1 += seg.slice(1);
				else path$1 += pathTrailing || segLeading ? seg : `/${seg}`;
			} else path$1 += seg;
		}
		return normalize(path$1);
	};
	resolve$1 = function(...arguments_) {
		arguments_ = arguments_.map((argument) => normalizeWindowsPath(argument));
		let resolvedPath = "";
		let resolvedAbsolute = false;
		for (let index = arguments_.length - 1; index >= -1 && !resolvedAbsolute; index--) {
			const path$1 = index >= 0 ? arguments_[index] : cwd();
			if (!path$1 || path$1.length === 0) continue;
			resolvedPath = `${path$1}/${resolvedPath}`;
			resolvedAbsolute = isAbsolute$1(path$1);
		}
		resolvedPath = normalizeString(resolvedPath, !resolvedAbsolute);
		if (resolvedAbsolute && !isAbsolute$1(resolvedPath)) return `/${resolvedPath}`;
		return resolvedPath.length > 0 ? resolvedPath : ".";
	};
	isAbsolute$1 = function(p) {
		return _IS_ABSOLUTE_RE.test(p);
	};
	extname$1 = function(p) {
		if (p === "..") return "";
		const match = _EXTNAME_RE.exec(normalizeWindowsPath(p));
		return match && match[1] || "";
	};
	dirname = function(p) {
		const segments = normalizeWindowsPath(p).replace(/\/$/, "").split("/").slice(0, -1);
		if (segments.length === 1 && _DRIVE_LETTER_RE.test(segments[0])) segments[0] += "/";
		return segments.join("/") || (isAbsolute$1(p) ? "/" : ".");
	};
	basename = function(p, extension) {
		const segments = normalizeWindowsPath(p).split("/");
		let lastSegment = "";
		for (let i = segments.length - 1; i >= 0; i--) {
			const val = segments[i];
			if (val) {
				lastSegment = val;
				break;
			}
		}
		return extension && lastSegment.endsWith(extension) ? lastSegment.slice(0, -extension.length) : lastSegment;
	};
}) });

//#endregion
//#region ../../../node_modules/.pnpm/pathe@2.0.3/node_modules/pathe/dist/index.mjs
var init_dist$3 = __esm({ "../../../node_modules/.pnpm/pathe@2.0.3/node_modules/pathe/dist/index.mjs": (() => {
	init_pathe_M_eThtNZ();
}) });

//#endregion
//#region ../../../node_modules/.pnpm/exsolve@1.0.7/node_modules/exsolve/dist/index.mjs
function formatList(array, type = "and") {
	return array.length < 3 ? array.join(` ${type} `) : `${array.slice(0, -1).join(", ")}, ${type} ${array.at(-1)}`;
}
function createError(sym, value, constructor) {
	messages.set(sym, value);
	return makeNodeErrorWithCode(constructor, sym);
}
function makeNodeErrorWithCode(Base, key) {
	return function NodeError(...parameters) {
		const limit = Error.stackTraceLimit;
		if (isErrorStackTraceLimitWritable()) Error.stackTraceLimit = 0;
		const error = new Base();
		if (isErrorStackTraceLimitWritable()) Error.stackTraceLimit = limit;
		const message = getMessage(key, parameters, error);
		Object.defineProperties(error, {
			message: {
				value: message,
				enumerable: false,
				writable: true,
				configurable: true
			},
			toString: {
				value() {
					return `${this.name} [${key}]: ${this.message}`;
				},
				enumerable: false,
				writable: true,
				configurable: true
			}
		});
		captureLargerStackTrace(error);
		error.code = key;
		return error;
	};
}
function isErrorStackTraceLimitWritable() {
	try {
		if (v8.startupSnapshot.isBuildingSnapshot()) return false;
	} catch {}
	const desc = Object.getOwnPropertyDescriptor(Error, "stackTraceLimit");
	if (desc === void 0) return Object.isExtensible(Error);
	return own$1.call(desc, "writable") && desc.writable !== void 0 ? desc.writable : desc.set !== void 0;
}
function hideStackFrames(wrappedFunction) {
	const hidden = nodeInternalPrefix + wrappedFunction.name;
	Object.defineProperty(wrappedFunction, "name", { value: hidden });
	return wrappedFunction;
}
function getMessage(key, parameters, self) {
	const message = messages.get(key);
	assert(message !== void 0, "expected `message` to be found");
	if (typeof message === "function") {
		assert(message.length <= parameters.length, `Code: ${key}; The provided arguments length (${parameters.length}) does not match the required ones (${message.length}).`);
		return Reflect.apply(message, self, parameters);
	}
	const regex = /%[dfijoOs]/g;
	let expectedLength = 0;
	while (regex.exec(message) !== null) expectedLength++;
	assert(expectedLength === parameters.length, `Code: ${key}; The provided arguments length (${parameters.length}) does not match the required ones (${expectedLength}).`);
	if (parameters.length === 0) return message;
	parameters.unshift(message);
	return Reflect.apply(format, null, parameters);
}
function determineSpecificType(value) {
	if (value === null || value === void 0) return String(value);
	if (typeof value === "function" && value.name) return `function ${value.name}`;
	if (typeof value === "object") {
		if (value.constructor && value.constructor.name) return `an instance of ${value.constructor.name}`;
		return `${inspect(value, { depth: -1 })}`;
	}
	let inspected = inspect(value, { colors: false });
	if (inspected.length > 28) inspected = `${inspected.slice(0, 25)}...`;
	return `type ${typeof value} (${inspected})`;
}
function read(jsonPath, { base, specifier }) {
	const existing = cache.get(jsonPath);
	if (existing) return existing;
	let string;
	try {
		string = fs.readFileSync(path.toNamespacedPath(jsonPath), "utf8");
	} catch (error) {
		const exception = error;
		if (exception.code !== "ENOENT") throw exception;
	}
	const result = {
		exists: false,
		pjsonPath: jsonPath,
		main: void 0,
		name: void 0,
		type: "none",
		exports: void 0,
		imports: void 0
	};
	if (string !== void 0) {
		let parsed;
		try {
			parsed = JSON.parse(string);
		} catch (error_) {
			const error = new ERR_INVALID_PACKAGE_CONFIG(jsonPath, (base ? `"${specifier}" from ` : "") + fileURLToPath(base || specifier), error_.message);
			error.cause = error_;
			throw error;
		}
		result.exists = true;
		if (hasOwnProperty$1.call(parsed, "name") && typeof parsed.name === "string") result.name = parsed.name;
		if (hasOwnProperty$1.call(parsed, "main") && typeof parsed.main === "string") result.main = parsed.main;
		if (hasOwnProperty$1.call(parsed, "exports")) result.exports = parsed.exports;
		if (hasOwnProperty$1.call(parsed, "imports")) result.imports = parsed.imports;
		if (hasOwnProperty$1.call(parsed, "type") && (parsed.type === "commonjs" || parsed.type === "module")) result.type = parsed.type;
	}
	cache.set(jsonPath, result);
	return result;
}
function getPackageScopeConfig(resolved) {
	let packageJSONUrl = new URL("package.json", resolved);
	while (true) {
		const packageJSONPath2 = packageJSONUrl.pathname;
		if (packageJSONPath2.endsWith("node_modules/package.json")) break;
		const packageConfig = read(fileURLToPath(packageJSONUrl), { specifier: resolved });
		if (packageConfig.exists) return packageConfig;
		const lastPackageJSONUrl = packageJSONUrl;
		packageJSONUrl = new URL("../package.json", packageJSONUrl);
		if (packageJSONUrl.pathname === lastPackageJSONUrl.pathname) break;
	}
	const packageJSONPath = fileURLToPath(packageJSONUrl);
	return {
		pjsonPath: packageJSONPath,
		exists: false,
		type: "none"
	};
}
function mimeToFormat(mime) {
	if (mime && /\s*(text|application)\/javascript\s*(;\s*charset=utf-?8\s*)?/i.test(mime)) return "module";
	if (mime === "application/json") return "json";
	return null;
}
function getDataProtocolModuleFormat(parsed) {
	const { 1: mime } = /^([^/]+\/[^;,]+)[^,]*?(;base64)?,/.exec(parsed.pathname) || [
		null,
		null,
		null
	];
	return mimeToFormat(mime);
}
function extname(url) {
	const pathname = url.pathname;
	let index = pathname.length;
	while (index--) {
		const code = pathname.codePointAt(index);
		if (code === 47) return "";
		if (code === 46) return pathname.codePointAt(index - 1) === 47 ? "" : pathname.slice(index);
	}
	return "";
}
function getFileProtocolModuleFormat(url, _context, ignoreErrors) {
	const ext = extname(url);
	if (ext === ".js") {
		const { type: packageType } = getPackageScopeConfig(url);
		if (packageType !== "none") return packageType;
		return "commonjs";
	}
	if (ext === "") {
		const { type: packageType } = getPackageScopeConfig(url);
		if (packageType === "none" || packageType === "commonjs") return "commonjs";
		return "module";
	}
	const format$2 = extensionFormatMap[ext];
	if (format$2) return format$2;
	if (ignoreErrors) return void 0;
	const filepath = fileURLToPath(url);
	throw new ERR_UNKNOWN_FILE_EXTENSION(ext, filepath);
}
function defaultGetFormatWithoutErrors(url, context) {
	const protocol = url.protocol;
	if (!hasOwnProperty.call(protocolHandlers, protocol)) return null;
	return protocolHandlers[protocol](url, context, true) || null;
}
function emitInvalidSegmentDeprecation(target, request, match, packageJsonUrl, internal, base, isTarget) {
	if (process$1.noDeprecation) return;
	const pjsonPath = fileURLToPath(packageJsonUrl);
	const double = doubleSlashRegEx.exec(isTarget ? target : request) !== null;
	process$1.emitWarning(`Use of deprecated ${double ? "double slash" : "leading or trailing slash matching"} resolving "${target}" for module request "${request}" ${request === match ? "" : `matched to "${match}" `}in the "${internal ? "imports" : "exports"}" field module resolution of the package at ${pjsonPath}${base ? ` imported from ${fileURLToPath(base)}` : ""}.`, "DeprecationWarning", "DEP0166");
}
function emitLegacyIndexDeprecation(url, packageJsonUrl, base, main) {
	if (process$1.noDeprecation) return;
	const format$2 = defaultGetFormatWithoutErrors(url, { parentURL: base.href });
	if (format$2 !== "module") return;
	const urlPath = fileURLToPath(url.href);
	const packagePath = fileURLToPath(new URL$1(".", packageJsonUrl));
	const basePath = fileURLToPath(base);
	if (!main) process$1.emitWarning(`No "main" or "exports" field defined in the package.json for ${packagePath} resolving the main entry point "${urlPath.slice(packagePath.length)}", imported from ${basePath}.
Default "index" lookups for the main are deprecated for ES modules.`, "DeprecationWarning", "DEP0151");
	else if (path.resolve(packagePath, main) !== urlPath) process$1.emitWarning(`Package ${packagePath} has a "main" field set to "${main}", excluding the full filename and extension to the resolved file at "${urlPath.slice(packagePath.length)}", imported from ${basePath}.
 Automatic extension resolution of the "main" field is deprecated for ES modules.`, "DeprecationWarning", "DEP0151");
}
function tryStatSync(path2) {
	try {
		return statSync(path2);
	} catch {}
}
function fileExists(url) {
	const stats = statSync(url, { throwIfNoEntry: false });
	const isFile = stats ? stats.isFile() : void 0;
	return isFile === null || isFile === void 0 ? false : isFile;
}
function legacyMainResolve(packageJsonUrl, packageConfig, base) {
	let guess;
	if (packageConfig.main !== void 0) {
		guess = new URL$1(packageConfig.main, packageJsonUrl);
		if (fileExists(guess)) return guess;
		const tries2 = [
			`./${packageConfig.main}.js`,
			`./${packageConfig.main}.json`,
			`./${packageConfig.main}.node`,
			`./${packageConfig.main}/index.js`,
			`./${packageConfig.main}/index.json`,
			`./${packageConfig.main}/index.node`
		];
		let i2 = -1;
		while (++i2 < tries2.length) {
			guess = new URL$1(tries2[i2], packageJsonUrl);
			if (fileExists(guess)) break;
			guess = void 0;
		}
		if (guess) {
			emitLegacyIndexDeprecation(guess, packageJsonUrl, base, packageConfig.main);
			return guess;
		}
	}
	const tries = [
		"./index.js",
		"./index.json",
		"./index.node"
	];
	let i = -1;
	while (++i < tries.length) {
		guess = new URL$1(tries[i], packageJsonUrl);
		if (fileExists(guess)) break;
		guess = void 0;
	}
	if (guess) {
		emitLegacyIndexDeprecation(guess, packageJsonUrl, base, packageConfig.main);
		return guess;
	}
	throw new ERR_MODULE_NOT_FOUND(fileURLToPath(new URL$1(".", packageJsonUrl)), fileURLToPath(base));
}
function finalizeResolution(resolved, base, preserveSymlinks) {
	if (encodedSeparatorRegEx.exec(resolved.pathname) !== null) throw new ERR_INVALID_MODULE_SPECIFIER(resolved.pathname, String.raw`must not include encoded "/" or "\" characters`, fileURLToPath(base));
	let filePath;
	try {
		filePath = fileURLToPath(resolved);
	} catch (error) {
		Object.defineProperty(error, "input", { value: String(resolved) });
		Object.defineProperty(error, "module", { value: String(base) });
		throw error;
	}
	const stats = tryStatSync(filePath.endsWith("/") ? filePath.slice(-1) : filePath);
	if (stats && stats.isDirectory()) {
		const error = new ERR_UNSUPPORTED_DIR_IMPORT(filePath, fileURLToPath(base));
		error.url = String(resolved);
		throw error;
	}
	if (!stats || !stats.isFile()) {
		const error = new ERR_MODULE_NOT_FOUND(filePath || resolved.pathname, base && fileURLToPath(base), true);
		error.url = String(resolved);
		throw error;
	}
	{
		const real = realpathSync(filePath);
		const { search, hash } = resolved;
		resolved = pathToFileURL(real + (filePath.endsWith(path.sep) ? "/" : ""));
		resolved.search = search;
		resolved.hash = hash;
	}
	return resolved;
}
function importNotDefined(specifier, packageJsonUrl, base) {
	return new ERR_PACKAGE_IMPORT_NOT_DEFINED(specifier, packageJsonUrl && fileURLToPath(new URL$1(".", packageJsonUrl)), fileURLToPath(base));
}
function exportsNotFound(subpath, packageJsonUrl, base) {
	return new ERR_PACKAGE_PATH_NOT_EXPORTED(fileURLToPath(new URL$1(".", packageJsonUrl)), subpath, base && fileURLToPath(base));
}
function throwInvalidSubpath(request, match, packageJsonUrl, internal, base) {
	const reason = `request is not a valid match in pattern "${match}" for the "${internal ? "imports" : "exports"}" resolution of ${fileURLToPath(packageJsonUrl)}`;
	throw new ERR_INVALID_MODULE_SPECIFIER(request, reason, base && fileURLToPath(base));
}
function invalidPackageTarget(subpath, target, packageJsonUrl, internal, base) {
	target = typeof target === "object" && target !== null ? JSON.stringify(target, null, "") : `${target}`;
	return new ERR_INVALID_PACKAGE_TARGET(fileURLToPath(new URL$1(".", packageJsonUrl)), subpath, target, internal, base && fileURLToPath(base));
}
function resolvePackageTargetString(target, subpath, match, packageJsonUrl, base, pattern, internal, isPathMap, conditions) {
	if (subpath !== "" && !pattern && target.at(-1) !== "/") throw invalidPackageTarget(match, target, packageJsonUrl, internal, base);
	if (!target.startsWith("./")) {
		if (internal && !target.startsWith("../") && !target.startsWith("/")) {
			let isURL = false;
			try {
				new URL$1(target);
				isURL = true;
			} catch {}
			if (!isURL) {
				const exportTarget = pattern ? RegExpPrototypeSymbolReplace.call(patternRegEx, target, () => subpath) : target + subpath;
				return packageResolve(exportTarget, packageJsonUrl, conditions);
			}
		}
		throw invalidPackageTarget(match, target, packageJsonUrl, internal, base);
	}
	if (invalidSegmentRegEx.exec(target.slice(2)) !== null) if (deprecatedInvalidSegmentRegEx.exec(target.slice(2)) === null) {
		if (!isPathMap) {
			const request = pattern ? match.replace("*", () => subpath) : match + subpath;
			const resolvedTarget = pattern ? RegExpPrototypeSymbolReplace.call(patternRegEx, target, () => subpath) : target;
			emitInvalidSegmentDeprecation(resolvedTarget, request, match, packageJsonUrl, internal, base, true);
		}
	} else throw invalidPackageTarget(match, target, packageJsonUrl, internal, base);
	const resolved = new URL$1(target, packageJsonUrl);
	const resolvedPath = resolved.pathname;
	const packagePath = new URL$1(".", packageJsonUrl).pathname;
	if (!resolvedPath.startsWith(packagePath)) throw invalidPackageTarget(match, target, packageJsonUrl, internal, base);
	if (subpath === "") return resolved;
	if (invalidSegmentRegEx.exec(subpath) !== null) {
		const request = pattern ? match.replace("*", () => subpath) : match + subpath;
		if (deprecatedInvalidSegmentRegEx.exec(subpath) === null) {
			if (!isPathMap) {
				const resolvedTarget = pattern ? RegExpPrototypeSymbolReplace.call(patternRegEx, target, () => subpath) : target;
				emitInvalidSegmentDeprecation(resolvedTarget, request, match, packageJsonUrl, internal, base, false);
			}
		} else throwInvalidSubpath(request, match, packageJsonUrl, internal, base);
	}
	if (pattern) return new URL$1(RegExpPrototypeSymbolReplace.call(patternRegEx, resolved.href, () => subpath));
	return new URL$1(subpath, resolved);
}
function isArrayIndex(key) {
	const keyNumber = Number(key);
	if (`${keyNumber}` !== key) return false;
	return keyNumber >= 0 && keyNumber < 4294967295;
}
function resolvePackageTarget(packageJsonUrl, target, subpath, packageSubpath, base, pattern, internal, isPathMap, conditions) {
	if (typeof target === "string") return resolvePackageTargetString(target, subpath, packageSubpath, packageJsonUrl, base, pattern, internal, isPathMap, conditions);
	if (Array.isArray(target)) {
		const targetList = target;
		if (targetList.length === 0) return null;
		let lastException;
		let i = -1;
		while (++i < targetList.length) {
			const targetItem = targetList[i];
			let resolveResult;
			try {
				resolveResult = resolvePackageTarget(packageJsonUrl, targetItem, subpath, packageSubpath, base, pattern, internal, isPathMap, conditions);
			} catch (error) {
				const exception = error;
				lastException = exception;
				if (exception.code === "ERR_INVALID_PACKAGE_TARGET") continue;
				throw error;
			}
			if (resolveResult === void 0) continue;
			if (resolveResult === null) {
				lastException = null;
				continue;
			}
			return resolveResult;
		}
		if (lastException === void 0 || lastException === null) return null;
		throw lastException;
	}
	if (typeof target === "object" && target !== null) {
		const keys = Object.getOwnPropertyNames(target);
		let i = -1;
		while (++i < keys.length) {
			const key = keys[i];
			if (isArrayIndex(key)) throw new ERR_INVALID_PACKAGE_CONFIG(fileURLToPath(packageJsonUrl), fileURLToPath(base), "\"exports\" cannot contain numeric property keys.");
		}
		i = -1;
		while (++i < keys.length) {
			const key = keys[i];
			if (key === "default" || conditions && conditions.has(key)) {
				const conditionalTarget = target[key];
				const resolveResult = resolvePackageTarget(packageJsonUrl, conditionalTarget, subpath, packageSubpath, base, pattern, internal, isPathMap, conditions);
				if (resolveResult === void 0) continue;
				return resolveResult;
			}
		}
		return null;
	}
	if (target === null) return null;
	throw invalidPackageTarget(packageSubpath, target, packageJsonUrl, internal, base);
}
function isConditionalExportsMainSugar(exports, packageJsonUrl, base) {
	if (typeof exports === "string" || Array.isArray(exports)) return true;
	if (typeof exports !== "object" || exports === null) return false;
	const keys = Object.getOwnPropertyNames(exports);
	let isConditionalSugar = false;
	let i = 0;
	let keyIndex = -1;
	while (++keyIndex < keys.length) {
		const key = keys[keyIndex];
		const currentIsConditionalSugar = key === "" || key[0] !== ".";
		if (i++ === 0) isConditionalSugar = currentIsConditionalSugar;
		else if (isConditionalSugar !== currentIsConditionalSugar) throw new ERR_INVALID_PACKAGE_CONFIG(fileURLToPath(packageJsonUrl), fileURLToPath(base), `"exports" cannot contain some keys starting with '.' and some not. The exports object must either be an object of package subpath keys or an object of main entry condition name keys only.`);
	}
	return isConditionalSugar;
}
function emitTrailingSlashPatternDeprecation(match, pjsonUrl, base) {
	if (process$1.noDeprecation) return;
	const pjsonPath = fileURLToPath(pjsonUrl);
	if (emittedPackageWarnings.has(pjsonPath + "|" + match)) return;
	emittedPackageWarnings.add(pjsonPath + "|" + match);
	process$1.emitWarning(`Use of deprecated trailing slash pattern mapping "${match}" in the "exports" field module resolution of the package at ${pjsonPath}${base ? ` imported from ${fileURLToPath(base)}` : ""}. Mapping specifiers ending in "/" is no longer supported.`, "DeprecationWarning", "DEP0155");
}
function packageExportsResolve(packageJsonUrl, packageSubpath, packageConfig, base, conditions) {
	let exports = packageConfig.exports;
	if (isConditionalExportsMainSugar(exports, packageJsonUrl, base)) exports = { ".": exports };
	if (own.call(exports, packageSubpath) && !packageSubpath.includes("*") && !packageSubpath.endsWith("/")) {
		const target = exports[packageSubpath];
		const resolveResult = resolvePackageTarget(packageJsonUrl, target, "", packageSubpath, base, false, false, false, conditions);
		if (resolveResult === null || resolveResult === void 0) throw exportsNotFound(packageSubpath, packageJsonUrl, base);
		return resolveResult;
	}
	let bestMatch = "";
	let bestMatchSubpath = "";
	const keys = Object.getOwnPropertyNames(exports);
	let i = -1;
	while (++i < keys.length) {
		const key = keys[i];
		const patternIndex = key.indexOf("*");
		if (patternIndex !== -1 && packageSubpath.startsWith(key.slice(0, patternIndex))) {
			if (packageSubpath.endsWith("/")) emitTrailingSlashPatternDeprecation(packageSubpath, packageJsonUrl, base);
			const patternTrailer = key.slice(patternIndex + 1);
			if (packageSubpath.length >= key.length && packageSubpath.endsWith(patternTrailer) && patternKeyCompare(bestMatch, key) === 1 && key.lastIndexOf("*") === patternIndex) {
				bestMatch = key;
				bestMatchSubpath = packageSubpath.slice(patternIndex, packageSubpath.length - patternTrailer.length);
			}
		}
	}
	if (bestMatch) {
		const target = exports[bestMatch];
		const resolveResult = resolvePackageTarget(packageJsonUrl, target, bestMatchSubpath, bestMatch, base, true, false, packageSubpath.endsWith("/"), conditions);
		if (resolveResult === null || resolveResult === void 0) throw exportsNotFound(packageSubpath, packageJsonUrl, base);
		return resolveResult;
	}
	throw exportsNotFound(packageSubpath, packageJsonUrl, base);
}
function patternKeyCompare(a, b) {
	const aPatternIndex = a.indexOf("*");
	const bPatternIndex = b.indexOf("*");
	const baseLengthA = aPatternIndex === -1 ? a.length : aPatternIndex + 1;
	const baseLengthB = bPatternIndex === -1 ? b.length : bPatternIndex + 1;
	if (baseLengthA > baseLengthB) return -1;
	if (baseLengthB > baseLengthA) return 1;
	if (aPatternIndex === -1) return 1;
	if (bPatternIndex === -1) return -1;
	if (a.length > b.length) return -1;
	if (b.length > a.length) return 1;
	return 0;
}
function packageImportsResolve(name, base, conditions) {
	if (name === "#" || name.startsWith("#/") || name.endsWith("/")) {
		const reason = "is not a valid internal imports specifier name";
		throw new ERR_INVALID_MODULE_SPECIFIER(name, reason, fileURLToPath(base));
	}
	let packageJsonUrl;
	const packageConfig = getPackageScopeConfig(base);
	if (packageConfig.exists) {
		packageJsonUrl = pathToFileURL(packageConfig.pjsonPath);
		const imports = packageConfig.imports;
		if (imports) if (own.call(imports, name) && !name.includes("*")) {
			const resolveResult = resolvePackageTarget(packageJsonUrl, imports[name], "", name, base, false, true, false, conditions);
			if (resolveResult !== null && resolveResult !== void 0) return resolveResult;
		} else {
			let bestMatch = "";
			let bestMatchSubpath = "";
			const keys = Object.getOwnPropertyNames(imports);
			let i = -1;
			while (++i < keys.length) {
				const key = keys[i];
				const patternIndex = key.indexOf("*");
				if (patternIndex !== -1 && name.startsWith(key.slice(0, -1))) {
					const patternTrailer = key.slice(patternIndex + 1);
					if (name.length >= key.length && name.endsWith(patternTrailer) && patternKeyCompare(bestMatch, key) === 1 && key.lastIndexOf("*") === patternIndex) {
						bestMatch = key;
						bestMatchSubpath = name.slice(patternIndex, name.length - patternTrailer.length);
					}
				}
			}
			if (bestMatch) {
				const target = imports[bestMatch];
				const resolveResult = resolvePackageTarget(packageJsonUrl, target, bestMatchSubpath, bestMatch, base, true, true, false, conditions);
				if (resolveResult !== null && resolveResult !== void 0) return resolveResult;
			}
		}
	}
	throw importNotDefined(name, packageJsonUrl, base);
}
function parsePackageName(specifier, base) {
	let separatorIndex = specifier.indexOf("/");
	let validPackageName = true;
	let isScoped = false;
	if (specifier[0] === "@") {
		isScoped = true;
		if (separatorIndex === -1 || specifier.length === 0) validPackageName = false;
		else separatorIndex = specifier.indexOf("/", separatorIndex + 1);
	}
	const packageName = separatorIndex === -1 ? specifier : specifier.slice(0, separatorIndex);
	if (invalidPackageNameRegEx.exec(packageName) !== null) validPackageName = false;
	if (!validPackageName) throw new ERR_INVALID_MODULE_SPECIFIER(specifier, "is not a valid package name", fileURLToPath(base));
	const packageSubpath = "." + (separatorIndex === -1 ? "" : specifier.slice(separatorIndex));
	return {
		packageName,
		packageSubpath,
		isScoped
	};
}
function packageResolve(specifier, base, conditions) {
	if (nodeBuiltins.includes(specifier)) return new URL$1("node:" + specifier);
	const { packageName, packageSubpath, isScoped } = parsePackageName(specifier, base);
	const packageConfig = getPackageScopeConfig(base);
	if (packageConfig.exists && packageConfig.name === packageName && packageConfig.exports !== void 0 && packageConfig.exports !== null) {
		const packageJsonUrl2 = pathToFileURL(packageConfig.pjsonPath);
		return packageExportsResolve(packageJsonUrl2, packageSubpath, packageConfig, base, conditions);
	}
	let packageJsonUrl = new URL$1("./node_modules/" + packageName + "/package.json", base);
	let packageJsonPath = fileURLToPath(packageJsonUrl);
	let lastPath;
	do {
		const stat = tryStatSync(packageJsonPath.slice(0, -13));
		if (!stat || !stat.isDirectory()) {
			lastPath = packageJsonPath;
			packageJsonUrl = new URL$1((isScoped ? "../../../../node_modules/" : "../../../node_modules/") + packageName + "/package.json", packageJsonUrl);
			packageJsonPath = fileURLToPath(packageJsonUrl);
			continue;
		}
		const packageConfig2 = read(packageJsonPath, {
			base,
			specifier
		});
		if (packageConfig2.exports !== void 0 && packageConfig2.exports !== null) return packageExportsResolve(packageJsonUrl, packageSubpath, packageConfig2, base, conditions);
		if (packageSubpath === ".") return legacyMainResolve(packageJsonUrl, packageConfig2, base);
		return new URL$1(packageSubpath, packageJsonUrl);
	} while (packageJsonPath.length !== lastPath.length);
	throw new ERR_MODULE_NOT_FOUND(packageName, fileURLToPath(base), false);
}
function isRelativeSpecifier(specifier) {
	if (specifier[0] === ".") {
		if (specifier.length === 1 || specifier[1] === "/") return true;
		if (specifier[1] === "." && (specifier.length === 2 || specifier[2] === "/")) return true;
	}
	return false;
}
function shouldBeTreatedAsRelativeOrAbsolutePath(specifier) {
	if (specifier === "") return false;
	if (specifier[0] === "/") return true;
	return isRelativeSpecifier(specifier);
}
function moduleResolve(specifier, base, conditions, preserveSymlinks) {
	const protocol = base.protocol;
	const isData = protocol === "data:";
	let resolved;
	if (shouldBeTreatedAsRelativeOrAbsolutePath(specifier)) try {
		resolved = new URL$1(specifier, base);
	} catch (error_) {
		const error = new ERR_UNSUPPORTED_RESOLVE_REQUEST(specifier, base);
		error.cause = error_;
		throw error;
	}
	else if (protocol === "file:" && specifier[0] === "#") resolved = packageImportsResolve(specifier, base, conditions);
	else try {
		resolved = new URL$1(specifier);
	} catch (error_) {
		if (isData && !nodeBuiltins.includes(specifier)) {
			const error = new ERR_UNSUPPORTED_RESOLVE_REQUEST(specifier, base);
			error.cause = error_;
			throw error;
		}
		resolved = packageResolve(specifier, base, conditions);
	}
	assert(resolved !== void 0, "expected to be defined");
	if (resolved.protocol !== "file:") return resolved;
	return finalizeResolution(resolved, base);
}
function resolveModuleURL(input, options) {
	const parsedInput = _parseInput(input);
	if ("external" in parsedInput) return parsedInput.external;
	const specifier = parsedInput.specifier;
	let url = parsedInput.url;
	let absolutePath = parsedInput.absolutePath;
	let cacheKey;
	let cacheObj;
	if (options?.cache !== false) {
		cacheKey = _cacheKey(absolutePath || specifier, options);
		cacheObj = options?.cache && typeof options?.cache === "object" ? options.cache : globalCache;
	}
	if (cacheObj) {
		const cached = cacheObj.get(cacheKey);
		if (typeof cached === "string") return cached;
		if (cached instanceof Error) {
			if (options?.try) return void 0;
			throw cached;
		}
	}
	if (absolutePath) try {
		const stat = lstatSync(absolutePath);
		if (stat.isSymbolicLink()) {
			absolutePath = realpathSync(absolutePath);
			url = pathToFileURL(absolutePath);
		}
		if (stat.isFile()) {
			if (cacheObj) cacheObj.set(cacheKey, url.href);
			return url.href;
		}
	} catch (error) {
		if (error?.code !== "ENOENT") {
			if (cacheObj) cacheObj.set(cacheKey, error);
			throw error;
		}
	}
	const conditionsSet = options?.conditions ? new Set(options.conditions) : DEFAULT_CONDITIONS_SET;
	const target = specifier || url.href;
	const bases = _normalizeBases(options?.from);
	const suffixes = options?.suffixes || [""];
	const extensions = options?.extensions ? ["", ...options.extensions] : [""];
	let resolved;
	for (const base of bases) {
		for (const suffix of suffixes) {
			let name = _join(target, suffix);
			if (name === ".") name += "/.";
			for (const extension of extensions) {
				resolved = _tryModuleResolve(name + extension, base, conditionsSet);
				if (resolved) break;
			}
			if (resolved) break;
		}
		if (resolved) break;
	}
	if (!resolved) {
		const error = /* @__PURE__ */ new Error(`Cannot resolve module "${input}" (from: ${bases.map((u) => _fmtPath(u)).join(", ")})`);
		error.code = "ERR_MODULE_NOT_FOUND";
		if (cacheObj) cacheObj.set(cacheKey, error);
		if (options?.try) return void 0;
		throw error;
	}
	if (cacheObj) cacheObj.set(cacheKey, resolved.href);
	return resolved.href;
}
function resolveModulePath(id, options) {
	const resolved = resolveModuleURL(id, options);
	if (!resolved) return void 0;
	if (!resolved.startsWith("file://") && options?.try) return void 0;
	const absolutePath = fileURLToPath(resolved);
	return isWindows ? _normalizeWinPath(absolutePath) : absolutePath;
}
function _tryModuleResolve(specifier, base, conditions) {
	try {
		return moduleResolve(specifier, base, conditions);
	} catch (error) {
		if (!NOT_FOUND_ERRORS.has(error?.code)) throw error;
	}
}
function _normalizeBases(inputs) {
	const urls = (Array.isArray(inputs) ? inputs : [inputs]).flatMap((input) => _normalizeBase(input));
	if (urls.length === 0) return [pathToFileURL("./")];
	return urls;
}
function _normalizeBase(input) {
	if (!input) return [];
	if (_isURL(input)) return [input];
	if (typeof input !== "string") return [];
	if (/^(?:node|data|http|https|file):/.test(input)) return new URL(input);
	try {
		if (input.endsWith("/") || statSync(input).isDirectory()) return pathToFileURL(input + "/");
		return pathToFileURL(input);
	} catch {
		return [pathToFileURL(input + "/"), pathToFileURL(input)];
	}
}
function _fmtPath(input) {
	try {
		return fileURLToPath(input);
	} catch {
		return input;
	}
}
function _cacheKey(id, opts) {
	return JSON.stringify([
		id,
		(opts?.conditions || ["node", "import"]).sort(),
		opts?.extensions,
		opts?.from,
		opts?.suffixes
	]);
}
function _join(a, b) {
	if (!a || !b || b === "/") return a;
	return (a.endsWith("/") ? a : a + "/") + (b.startsWith("/") ? b.slice(1) : b);
}
function _normalizeWinPath(path$1) {
	return path$1.replace(/\\/g, "/").replace(/^[a-z]:\//, (r) => r.toUpperCase());
}
function _isURL(input) {
	return input instanceof URL || input?.constructor?.name === "URL";
}
function _parseInput(input) {
	if (typeof input === "string") {
		if (input.startsWith("file:")) {
			const url = new URL(input);
			return {
				url,
				absolutePath: fileURLToPath(url)
			};
		}
		if (isAbsolute(input)) return {
			url: pathToFileURL(input),
			absolutePath: input
		};
		if (/^(?:node|data|http|https):/.test(input)) return { external: input };
		if (nodeBuiltins.includes(input) && !input.includes(":")) return { external: `node:${input}` };
		return { specifier: input };
	}
	if (_isURL(input)) {
		if (input.protocol === "file:") return {
			url: input,
			absolutePath: fileURLToPath(input)
		};
		return { external: input.href };
	}
	throw new TypeError("id must be a `string` or `URL`");
}
var nodeBuiltins, own$1, classRegExp, kTypes, messages, nodeInternalPrefix, userStackTraceLimit, captureLargerStackTrace, ERR_INVALID_MODULE_SPECIFIER, ERR_INVALID_PACKAGE_CONFIG, ERR_INVALID_PACKAGE_TARGET, ERR_MODULE_NOT_FOUND, ERR_PACKAGE_IMPORT_NOT_DEFINED, ERR_PACKAGE_PATH_NOT_EXPORTED, ERR_UNSUPPORTED_DIR_IMPORT, ERR_UNSUPPORTED_RESOLVE_REQUEST, ERR_UNKNOWN_FILE_EXTENSION, hasOwnProperty$1, cache, hasOwnProperty, extensionFormatMap, protocolHandlers, RegExpPrototypeSymbolReplace, own, invalidSegmentRegEx, deprecatedInvalidSegmentRegEx, invalidPackageNameRegEx, patternRegEx, encodedSeparatorRegEx, emittedPackageWarnings, doubleSlashRegEx, DEFAULT_CONDITIONS_SET, isWindows, NOT_FOUND_ERRORS, globalCache;
var init_dist$2 = __esm({ "../../../node_modules/.pnpm/exsolve@1.0.7/node_modules/exsolve/dist/index.mjs": (() => {
	nodeBuiltins = [
		"_http_agent",
		"_http_client",
		"_http_common",
		"_http_incoming",
		"_http_outgoing",
		"_http_server",
		"_stream_duplex",
		"_stream_passthrough",
		"_stream_readable",
		"_stream_transform",
		"_stream_wrap",
		"_stream_writable",
		"_tls_common",
		"_tls_wrap",
		"assert",
		"assert/strict",
		"async_hooks",
		"buffer",
		"child_process",
		"cluster",
		"console",
		"constants",
		"crypto",
		"dgram",
		"diagnostics_channel",
		"dns",
		"dns/promises",
		"domain",
		"events",
		"fs",
		"fs/promises",
		"http",
		"http2",
		"https",
		"inspector",
		"inspector/promises",
		"module",
		"net",
		"os",
		"path",
		"path/posix",
		"path/win32",
		"perf_hooks",
		"process",
		"punycode",
		"querystring",
		"readline",
		"readline/promises",
		"repl",
		"stream",
		"stream/consumers",
		"stream/promises",
		"stream/web",
		"string_decoder",
		"sys",
		"timers",
		"timers/promises",
		"tls",
		"trace_events",
		"tty",
		"url",
		"util",
		"util/types",
		"v8",
		"vm",
		"wasi",
		"worker_threads",
		"zlib"
	];
	own$1 = {}.hasOwnProperty;
	classRegExp = /^([A-Z][a-z\d]*)+$/;
	kTypes = /* @__PURE__ */ new Set([
		"string",
		"function",
		"number",
		"object",
		"Function",
		"Object",
		"boolean",
		"bigint",
		"symbol"
	]);
	messages = /* @__PURE__ */ new Map();
	nodeInternalPrefix = "__node_internal_";
	;
	captureLargerStackTrace = hideStackFrames(function(error) {
		const stackTraceLimitIsWritable = isErrorStackTraceLimitWritable();
		if (stackTraceLimitIsWritable) {
			userStackTraceLimit = Error.stackTraceLimit;
			Error.stackTraceLimit = Number.POSITIVE_INFINITY;
		}
		Error.captureStackTrace(error);
		if (stackTraceLimitIsWritable) Error.stackTraceLimit = userStackTraceLimit;
		return error;
	});
	createError("ERR_INVALID_ARG_TYPE", (name, expected, actual) => {
		assert(typeof name === "string", "'name' must be a string");
		if (!Array.isArray(expected)) expected = [expected];
		let message = "The ";
		if (name.endsWith(" argument")) message += `${name} `;
		else {
			const type = name.includes(".") ? "property" : "argument";
			message += `"${name}" ${type} `;
		}
		message += "must be ";
		const types = [];
		const instances = [];
		const other = [];
		for (const value of expected) {
			assert(typeof value === "string", "All expected entries have to be of type string");
			if (kTypes.has(value)) types.push(value.toLowerCase());
			else if (classRegExp.exec(value) === null) {
				assert(value !== "object", "The value \"object\" should be written as \"Object\"");
				other.push(value);
			} else instances.push(value);
		}
		if (instances.length > 0) {
			const pos = types.indexOf("object");
			if (pos !== -1) {
				types.slice(pos, 1);
				instances.push("Object");
			}
		}
		if (types.length > 0) {
			message += `${types.length > 1 ? "one of type" : "of type"} ${formatList(types, "or")}`;
			if (instances.length > 0 || other.length > 0) message += " or ";
		}
		if (instances.length > 0) {
			message += `an instance of ${formatList(instances, "or")}`;
			if (other.length > 0) message += " or ";
		}
		if (other.length > 0) if (other.length > 1) message += `one of ${formatList(other, "or")}`;
		else {
			if (other[0]?.toLowerCase() !== other[0]) message += "an ";
			message += `${other[0]}`;
		}
		message += `. Received ${determineSpecificType(actual)}`;
		return message;
	}, TypeError);
	ERR_INVALID_MODULE_SPECIFIER = createError(
		"ERR_INVALID_MODULE_SPECIFIER",
		/**
		* @param {string} request
		* @param {string} reason
		* @param {string} [base]
		*/
		(request, reason, base) => {
			return `Invalid module "${request}" ${reason}${base ? ` imported from ${base}` : ""}`;
		},
		TypeError
	);
	ERR_INVALID_PACKAGE_CONFIG = createError("ERR_INVALID_PACKAGE_CONFIG", (path$1, base, message) => {
		return `Invalid package config ${path$1}${base ? ` while importing ${base}` : ""}${message ? `. ${message}` : ""}`;
	}, Error);
	ERR_INVALID_PACKAGE_TARGET = createError("ERR_INVALID_PACKAGE_TARGET", (packagePath, key, target, isImport = false, base) => {
		const relatedError = typeof target === "string" && !isImport && target.length > 0 && !target.startsWith("./");
		if (key === ".") {
			assert(isImport === false);
			return `Invalid "exports" main target ${JSON.stringify(target)} defined in the package config ${packagePath}package.json${base ? ` imported from ${base}` : ""}${relatedError ? "; targets must start with \"./\"" : ""}`;
		}
		return `Invalid "${isImport ? "imports" : "exports"}" target ${JSON.stringify(target)} defined for '${key}' in the package config ${packagePath}package.json${base ? ` imported from ${base}` : ""}${relatedError ? "; targets must start with \"./\"" : ""}`;
	}, Error);
	ERR_MODULE_NOT_FOUND = createError("ERR_MODULE_NOT_FOUND", (path$1, base, exactUrl = false) => {
		return `Cannot find ${exactUrl ? "module" : "package"} '${path$1}' imported from ${base}`;
	}, Error);
	createError("ERR_NETWORK_IMPORT_DISALLOWED", "import of '%s' by %s is not supported: %s", Error);
	ERR_PACKAGE_IMPORT_NOT_DEFINED = createError("ERR_PACKAGE_IMPORT_NOT_DEFINED", (specifier, packagePath, base) => {
		return `Package import specifier "${specifier}" is not defined${packagePath ? ` in package ${packagePath || ""}package.json` : ""} imported from ${base}`;
	}, TypeError);
	ERR_PACKAGE_PATH_NOT_EXPORTED = createError(
		"ERR_PACKAGE_PATH_NOT_EXPORTED",
		/**
		* @param {string} packagePath
		* @param {string} subpath
		* @param {string} [base]
		*/
		(packagePath, subpath, base) => {
			if (subpath === ".") return `No "exports" main defined in ${packagePath}package.json${base ? ` imported from ${base}` : ""}`;
			return `Package subpath '${subpath}' is not defined by "exports" in ${packagePath}package.json${base ? ` imported from ${base}` : ""}`;
		},
		Error
	);
	ERR_UNSUPPORTED_DIR_IMPORT = createError("ERR_UNSUPPORTED_DIR_IMPORT", "Directory import '%s' is not supported resolving ES modules imported from %s", Error);
	ERR_UNSUPPORTED_RESOLVE_REQUEST = createError("ERR_UNSUPPORTED_RESOLVE_REQUEST", "Failed to resolve module specifier \"%s\" from \"%s\": Invalid relative URL or base scheme is not hierarchical.", TypeError);
	ERR_UNKNOWN_FILE_EXTENSION = createError("ERR_UNKNOWN_FILE_EXTENSION", (extension, path$1) => {
		return `Unknown file extension "${extension}" for ${path$1}`;
	}, TypeError);
	createError("ERR_INVALID_ARG_VALUE", (name, value, reason = "is invalid") => {
		let inspected = inspect(value);
		if (inspected.length > 128) inspected = `${inspected.slice(0, 128)}...`;
		const type = name.includes(".") ? "property" : "argument";
		return `The ${type} '${name}' ${reason}. Received ${inspected}`;
	}, TypeError);
	hasOwnProperty$1 = {}.hasOwnProperty;
	cache = /* @__PURE__ */ new Map();
	hasOwnProperty = {}.hasOwnProperty;
	extensionFormatMap = {
		__proto__: null,
		".json": "json",
		".cjs": "commonjs",
		".cts": "commonjs",
		".js": "module",
		".ts": "module",
		".mts": "module",
		".mjs": "module"
	};
	protocolHandlers = {
		__proto__: null,
		"data:": getDataProtocolModuleFormat,
		"file:": getFileProtocolModuleFormat,
		"node:": () => "builtin"
	};
	RegExpPrototypeSymbolReplace = RegExp.prototype[Symbol.replace];
	own = {}.hasOwnProperty;
	invalidSegmentRegEx = /(^|\\|\/)((\.|%2e)(\.|%2e)?|(n|%6e|%4e)(o|%6f|%4f)(d|%64|%44)(e|%65|%45)(_|%5f)(m|%6d|%4d)(o|%6f|%4f)(d|%64|%44)(u|%75|%55)(l|%6c|%4c)(e|%65|%45)(s|%73|%53))?(\\|\/|$)/i;
	deprecatedInvalidSegmentRegEx = /(^|\\|\/)((\.|%2e)(\.|%2e)?|(n|%6e|%4e)(o|%6f|%4f)(d|%64|%44)(e|%65|%45)(_|%5f)(m|%6d|%4d)(o|%6f|%4f)(d|%64|%44)(u|%75|%55)(l|%6c|%4c)(e|%65|%45)(s|%73|%53))(\\|\/|$)/i;
	invalidPackageNameRegEx = /^\.|%|\\/;
	patternRegEx = /\*/g;
	encodedSeparatorRegEx = /%2f|%5c/i;
	emittedPackageWarnings = /* @__PURE__ */ new Set();
	doubleSlashRegEx = /[/\\]{2}/;
	DEFAULT_CONDITIONS_SET = /* @__PURE__ */ new Set(["node", "import"]);
	isWindows = /* @__PURE__ */ (() => process.platform === "win32")();
	NOT_FOUND_ERRORS = /* @__PURE__ */ new Set([
		"ERR_MODULE_NOT_FOUND",
		"ERR_UNSUPPORTED_DIR_IMPORT",
		"MODULE_NOT_FOUND",
		"ERR_PACKAGE_PATH_NOT_EXPORTED",
		"ERR_PACKAGE_IMPORT_NOT_DEFINED"
	]);
	globalCache = /* @__PURE__ */ (() => globalThis["__EXSOLVE_CACHE__"] ||= /* @__PURE__ */ new Map())();
}) });

//#endregion
//#region ../../../node_modules/.pnpm/defu@6.1.4/node_modules/defu/dist/defu.mjs
function isPlainObject(value) {
	if (value === null || typeof value !== "object") return false;
	const prototype = Object.getPrototypeOf(value);
	if (prototype !== null && prototype !== Object.prototype && Object.getPrototypeOf(prototype) !== null) return false;
	if (Symbol.iterator in value) return false;
	if (Symbol.toStringTag in value) return Object.prototype.toString.call(value) === "[object Module]";
	return true;
}
function _defu(baseObject, defaults, namespace = ".", merger) {
	if (!isPlainObject(defaults)) return _defu(baseObject, {}, namespace, merger);
	const object = Object.assign({}, defaults);
	for (const key in baseObject) {
		if (key === "__proto__" || key === "constructor") continue;
		const value = baseObject[key];
		if (value === null || value === void 0) continue;
		if (merger && merger(object, key, value, namespace)) continue;
		if (Array.isArray(value) && Array.isArray(object[key])) object[key] = [...value, ...object[key]];
		else if (isPlainObject(value) && isPlainObject(object[key])) object[key] = _defu(value, object[key], (namespace ? `${namespace}.` : "") + key.toString(), merger);
		else object[key] = value;
	}
	return object;
}
function createDefu(merger) {
	return (...arguments_) => arguments_.reduce((p, c) => _defu(p, c, "", merger), {});
}
var defu, defuFn, defuArrayFn;
var init_defu = __esm({ "../../../node_modules/.pnpm/defu@6.1.4/node_modules/defu/dist/defu.mjs": (() => {
	defu = createDefu();
	defuFn = createDefu((object, key, currentValue) => {
		if (object[key] !== void 0 && typeof currentValue === "function") {
			object[key] = currentValue(object[key]);
			return true;
		}
	});
	defuArrayFn = createDefu((object, key, currentValue) => {
		if (Array.isArray(object[key]) && typeof currentValue === "function") {
			object[key] = currentValue(object[key]);
			return true;
		}
	});
}) });

//#endregion
//#region ../../../node_modules/.pnpm/confbox@0.2.2/node_modules/confbox/dist/index.mjs
var init_dist$1 = __esm({ "../../../node_modules/.pnpm/confbox@0.2.2/node_modules/confbox/dist/index.mjs": (() => {
	init_confbox_DnMsyigM();
}) });

//#endregion
//#region ../../../node_modules/.pnpm/pkg-types@2.2.0/node_modules/pkg-types/dist/index.mjs
async function findFile(filename, _options = {}) {
	const filenames = Array.isArray(filename) ? filename : [filename];
	const options = {
		...defaultFindOptions,
		..._options
	};
	const basePath = resolve$1(options.startingFrom);
	const leadingSlash = basePath[0] === "/";
	const segments = basePath.split("/").filter(Boolean);
	if (filenames.includes(segments.at(-1)) && await options.test(basePath)) return basePath;
	if (leadingSlash) segments[0] = "/" + segments[0];
	let root = segments.findIndex((r) => r.match(options.rootPattern));
	if (root === -1) root = 0;
	if (options.reverse) for (let index = root + 1; index <= segments.length; index++) for (const filename2 of filenames) {
		const filePath = join(...segments.slice(0, index), filename2);
		if (await options.test(filePath)) return filePath;
	}
	else for (let index = segments.length; index > root; index--) for (const filename2 of filenames) {
		const filePath = join(...segments.slice(0, index), filename2);
		if (await options.test(filePath)) return filePath;
	}
	throw new Error(`Cannot find matching ${filename} in ${options.startingFrom} or parent directories`);
}
function findNearestFile(filename, options = {}) {
	return findFile(filename, options);
}
function _resolvePath(id, opts = {}) {
	if (id instanceof URL || id.startsWith("file://")) return normalize(fileURLToPath(id));
	if (isAbsolute$1(id)) return normalize(id);
	return resolveModulePath(id, {
		...opts,
		from: opts.from || opts.parent || opts.url
	});
}
async function readPackageJSON(id, options = {}) {
	const resolvedPath = await resolvePackageJSON(id, options);
	const cache$1 = options.cache && typeof options.cache !== "boolean" ? options.cache : FileCache;
	if (options.cache && cache$1.has(resolvedPath)) return cache$1.get(resolvedPath);
	const blob = await promises.readFile(resolvedPath, "utf8");
	let parsed;
	try {
		parsed = x(blob);
	} catch {
		parsed = h(blob);
	}
	cache$1.set(resolvedPath, parsed);
	return parsed;
}
async function resolvePackageJSON(id = process.cwd(), options = {}) {
	return findNearestFile("package.json", {
		...options,
		startingFrom: _resolvePath(id, options)
	});
}
async function findWorkspaceDir(id = process.cwd(), options = {}) {
	const startingFrom = _resolvePath(id, options);
	const tests = options.tests || [
		"workspaceFile",
		"gitConfig",
		"lockFile",
		"packageJson"
	];
	for (const testName of tests) {
		const test = workspaceTests[testName];
		if (options[testName] === false || !test) continue;
		const direction = options[testName] || (testName === "gitConfig" ? "closest" : "furthest");
		const detected = await test({
			...options,
			startingFrom,
			reverse: direction === "furthest"
		}).catch(() => {});
		if (detected) return detected;
	}
	throw new Error(`Cannot detect workspace root from ${id}`);
}
var defaultFindOptions, lockFiles, workspaceFiles, FileCache, workspaceTests;
var init_dist = __esm({ "../../../node_modules/.pnpm/pkg-types@2.2.0/node_modules/pkg-types/dist/index.mjs": (() => {
	init_dist$3();
	init_dist$1();
	init_dist$2();
	defaultFindOptions = {
		startingFrom: ".",
		rootPattern: /^node_modules$/,
		reverse: false,
		test: (filePath) => {
			try {
				if (statSync(filePath).isFile()) return true;
			} catch {}
		}
	};
	lockFiles = [
		"yarn.lock",
		"package-lock.json",
		"pnpm-lock.yaml",
		"npm-shrinkwrap.json",
		"bun.lockb",
		"bun.lock"
	];
	workspaceFiles = [
		"pnpm-workspace.yaml",
		"lerna.json",
		"turbo.json",
		"rush.json",
		"deno.json",
		"deno.jsonc"
	];
	FileCache = /* @__PURE__ */ new Map();
	workspaceTests = {
		workspaceFile: (opts) => findFile(workspaceFiles, opts).then((r) => dirname(r)),
		gitConfig: (opts) => findFile(".git/config", opts).then((r) => resolve$1(r, "../..")),
		lockFile: (opts) => findFile(lockFiles, opts).then((r) => dirname(r)),
		packageJson: (opts) => findFile("package.json", opts).then((r) => dirname(r))
	};
}) });

//#endregion
export { basename, defu, dirname, extname$1 as extname, findWorkspaceDir, init_defu, init_dist, init_dist$2 as init_dist$1, init_dist$3 as init_dist$2, join, normalize, readPackageJSON, resolve$1 as resolve, resolveModulePath };
//# sourceMappingURL=dist-CyEe98Vh.mjs.map
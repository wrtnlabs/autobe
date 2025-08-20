import { __commonJS, __require } from "./chunk-BlwD-Ihv.mjs";

//#region ../../node_modules/.pnpm/ws@7.5.10/node_modules/ws/lib/constants.js
var require_constants = /* @__PURE__ */ __commonJS({ "../../node_modules/.pnpm/ws@7.5.10/node_modules/ws/lib/constants.js": ((exports, module) => {
	module.exports = {
		BINARY_TYPES: [
			"nodebuffer",
			"arraybuffer",
			"fragments"
		],
		GUID: "258EAFA5-E914-47DA-95CA-C5AB0DC85B11",
		kStatusCode: Symbol("status-code"),
		kWebSocket: Symbol("websocket"),
		EMPTY_BUFFER: Buffer.alloc(0),
		NOOP: () => {}
	};
}) });

//#endregion
//#region ../../node_modules/.pnpm/ws@7.5.10/node_modules/ws/lib/buffer-util.js
var require_buffer_util = /* @__PURE__ */ __commonJS({ "../../node_modules/.pnpm/ws@7.5.10/node_modules/ws/lib/buffer-util.js": ((exports, module) => {
	const { EMPTY_BUFFER: EMPTY_BUFFER$3 } = require_constants();
	/**
	* Merges an array of buffers into a new buffer.
	*
	* @param {Buffer[]} list The array of buffers to concat
	* @param {Number} totalLength The total length of buffers in the list
	* @return {Buffer} The resulting buffer
	* @public
	*/
	function concat$1(list, totalLength) {
		if (list.length === 0) return EMPTY_BUFFER$3;
		if (list.length === 1) return list[0];
		const target = Buffer.allocUnsafe(totalLength);
		let offset = 0;
		for (let i = 0; i < list.length; i++) {
			const buf = list[i];
			target.set(buf, offset);
			offset += buf.length;
		}
		if (offset < totalLength) return target.slice(0, offset);
		return target;
	}
	/**
	* Masks a buffer using the given mask.
	*
	* @param {Buffer} source The buffer to mask
	* @param {Buffer} mask The mask to use
	* @param {Buffer} output The buffer where to store the result
	* @param {Number} offset The offset at which to start writing
	* @param {Number} length The number of bytes to mask.
	* @public
	*/
	function _mask(source, mask$1, output, offset, length) {
		for (let i = 0; i < length; i++) output[offset + i] = source[i] ^ mask$1[i & 3];
	}
	/**
	* Unmasks a buffer using the given mask.
	*
	* @param {Buffer} buffer The buffer to unmask
	* @param {Buffer} mask The mask to use
	* @public
	*/
	function _unmask(buffer, mask$1) {
		const length = buffer.length;
		for (let i = 0; i < length; i++) buffer[i] ^= mask$1[i & 3];
	}
	/**
	* Converts a buffer to an `ArrayBuffer`.
	*
	* @param {Buffer} buf The buffer to convert
	* @return {ArrayBuffer} Converted buffer
	* @public
	*/
	function toArrayBuffer$1(buf) {
		if (buf.byteLength === buf.buffer.byteLength) return buf.buffer;
		return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
	}
	/**
	* Converts `data` to a `Buffer`.
	*
	* @param {*} data The data to convert
	* @return {Buffer} The buffer
	* @throws {TypeError}
	* @public
	*/
	function toBuffer$2(data) {
		toBuffer$2.readOnly = true;
		if (Buffer.isBuffer(data)) return data;
		let buf;
		if (data instanceof ArrayBuffer) buf = Buffer.from(data);
		else if (ArrayBuffer.isView(data)) buf = Buffer.from(data.buffer, data.byteOffset, data.byteLength);
		else {
			buf = Buffer.from(data);
			toBuffer$2.readOnly = false;
		}
		return buf;
	}
	try {
		const bufferUtil$1 = __require("bufferutil");
		const bu = bufferUtil$1.BufferUtil || bufferUtil$1;
		module.exports = {
			concat: concat$1,
			mask(source, mask$1, output, offset, length) {
				if (length < 48) _mask(source, mask$1, output, offset, length);
				else bu.mask(source, mask$1, output, offset, length);
			},
			toArrayBuffer: toArrayBuffer$1,
			toBuffer: toBuffer$2,
			unmask(buffer, mask$1) {
				if (buffer.length < 32) _unmask(buffer, mask$1);
				else bu.unmask(buffer, mask$1);
			}
		};
	} catch (e) {
		module.exports = {
			concat: concat$1,
			mask: _mask,
			toArrayBuffer: toArrayBuffer$1,
			toBuffer: toBuffer$2,
			unmask: _unmask
		};
	}
}) });

//#endregion
//#region ../../node_modules/.pnpm/ws@7.5.10/node_modules/ws/lib/limiter.js
var require_limiter = /* @__PURE__ */ __commonJS({ "../../node_modules/.pnpm/ws@7.5.10/node_modules/ws/lib/limiter.js": ((exports, module) => {
	const kDone = Symbol("kDone");
	const kRun = Symbol("kRun");
	/**
	* A very simple job queue with adjustable concurrency. Adapted from
	* https://github.com/STRML/async-limiter
	*/
	var Limiter$1 = class {
		/**
		* Creates a new `Limiter`.
		*
		* @param {Number} [concurrency=Infinity] The maximum number of jobs allowed
		*     to run concurrently
		*/
		constructor(concurrency) {
			this[kDone] = () => {
				this.pending--;
				this[kRun]();
			};
			this.concurrency = concurrency || Infinity;
			this.jobs = [];
			this.pending = 0;
		}
		/**
		* Adds a job to the queue.
		*
		* @param {Function} job The job to run
		* @public
		*/
		add(job) {
			this.jobs.push(job);
			this[kRun]();
		}
		/**
		* Removes a job from the queue and runs it if possible.
		*
		* @private
		*/
		[kRun]() {
			if (this.pending === this.concurrency) return;
			if (this.jobs.length) {
				const job = this.jobs.shift();
				this.pending++;
				job(this[kDone]);
			}
		}
	};
	module.exports = Limiter$1;
}) });

//#endregion
//#region ../../node_modules/.pnpm/ws@7.5.10/node_modules/ws/lib/permessage-deflate.js
var require_permessage_deflate = /* @__PURE__ */ __commonJS({ "../../node_modules/.pnpm/ws@7.5.10/node_modules/ws/lib/permessage-deflate.js": ((exports, module) => {
	const zlib = __require("zlib");
	const bufferUtil = require_buffer_util();
	const Limiter = require_limiter();
	const { kStatusCode: kStatusCode$2, NOOP: NOOP$1 } = require_constants();
	const TRAILER = Buffer.from([
		0,
		0,
		255,
		255
	]);
	const kPerMessageDeflate = Symbol("permessage-deflate");
	const kTotalLength = Symbol("total-length");
	const kCallback = Symbol("callback");
	const kBuffers = Symbol("buffers");
	const kError = Symbol("error");
	let zlibLimiter;
	/**
	* permessage-deflate implementation.
	*/
	var PerMessageDeflate$4 = class {
		/**
		* Creates a PerMessageDeflate instance.
		*
		* @param {Object} [options] Configuration options
		* @param {Boolean} [options.serverNoContextTakeover=false] Request/accept
		*     disabling of server context takeover
		* @param {Boolean} [options.clientNoContextTakeover=false] Advertise/
		*     acknowledge disabling of client context takeover
		* @param {(Boolean|Number)} [options.serverMaxWindowBits] Request/confirm the
		*     use of a custom server window size
		* @param {(Boolean|Number)} [options.clientMaxWindowBits] Advertise support
		*     for, or request, a custom client window size
		* @param {Object} [options.zlibDeflateOptions] Options to pass to zlib on
		*     deflate
		* @param {Object} [options.zlibInflateOptions] Options to pass to zlib on
		*     inflate
		* @param {Number} [options.threshold=1024] Size (in bytes) below which
		*     messages should not be compressed
		* @param {Number} [options.concurrencyLimit=10] The number of concurrent
		*     calls to zlib
		* @param {Boolean} [isServer=false] Create the instance in either server or
		*     client mode
		* @param {Number} [maxPayload=0] The maximum allowed message length
		*/
		constructor(options, isServer, maxPayload) {
			this._maxPayload = maxPayload | 0;
			this._options = options || {};
			this._threshold = this._options.threshold !== void 0 ? this._options.threshold : 1024;
			this._isServer = !!isServer;
			this._deflate = null;
			this._inflate = null;
			this.params = null;
			if (!zlibLimiter) {
				const concurrency = this._options.concurrencyLimit !== void 0 ? this._options.concurrencyLimit : 10;
				zlibLimiter = new Limiter(concurrency);
			}
		}
		/**
		* @type {String}
		*/
		static get extensionName() {
			return "permessage-deflate";
		}
		/**
		* Create an extension negotiation offer.
		*
		* @return {Object} Extension parameters
		* @public
		*/
		offer() {
			const params = {};
			if (this._options.serverNoContextTakeover) params.server_no_context_takeover = true;
			if (this._options.clientNoContextTakeover) params.client_no_context_takeover = true;
			if (this._options.serverMaxWindowBits) params.server_max_window_bits = this._options.serverMaxWindowBits;
			if (this._options.clientMaxWindowBits) params.client_max_window_bits = this._options.clientMaxWindowBits;
			else if (this._options.clientMaxWindowBits == null) params.client_max_window_bits = true;
			return params;
		}
		/**
		* Accept an extension negotiation offer/response.
		*
		* @param {Array} configurations The extension negotiation offers/reponse
		* @return {Object} Accepted configuration
		* @public
		*/
		accept(configurations) {
			configurations = this.normalizeParams(configurations);
			this.params = this._isServer ? this.acceptAsServer(configurations) : this.acceptAsClient(configurations);
			return this.params;
		}
		/**
		* Releases all resources used by the extension.
		*
		* @public
		*/
		cleanup() {
			if (this._inflate) {
				this._inflate.close();
				this._inflate = null;
			}
			if (this._deflate) {
				const callback = this._deflate[kCallback];
				this._deflate.close();
				this._deflate = null;
				if (callback) callback(/* @__PURE__ */ new Error("The deflate stream was closed while data was being processed"));
			}
		}
		/**
		*  Accept an extension negotiation offer.
		*
		* @param {Array} offers The extension negotiation offers
		* @return {Object} Accepted configuration
		* @private
		*/
		acceptAsServer(offers) {
			const opts = this._options;
			const accepted = offers.find((params) => {
				if (opts.serverNoContextTakeover === false && params.server_no_context_takeover || params.server_max_window_bits && (opts.serverMaxWindowBits === false || typeof opts.serverMaxWindowBits === "number" && opts.serverMaxWindowBits > params.server_max_window_bits) || typeof opts.clientMaxWindowBits === "number" && !params.client_max_window_bits) return false;
				return true;
			});
			if (!accepted) throw new Error("None of the extension offers can be accepted");
			if (opts.serverNoContextTakeover) accepted.server_no_context_takeover = true;
			if (opts.clientNoContextTakeover) accepted.client_no_context_takeover = true;
			if (typeof opts.serverMaxWindowBits === "number") accepted.server_max_window_bits = opts.serverMaxWindowBits;
			if (typeof opts.clientMaxWindowBits === "number") accepted.client_max_window_bits = opts.clientMaxWindowBits;
			else if (accepted.client_max_window_bits === true || opts.clientMaxWindowBits === false) delete accepted.client_max_window_bits;
			return accepted;
		}
		/**
		* Accept the extension negotiation response.
		*
		* @param {Array} response The extension negotiation response
		* @return {Object} Accepted configuration
		* @private
		*/
		acceptAsClient(response) {
			const params = response[0];
			if (this._options.clientNoContextTakeover === false && params.client_no_context_takeover) throw new Error("Unexpected parameter \"client_no_context_takeover\"");
			if (!params.client_max_window_bits) {
				if (typeof this._options.clientMaxWindowBits === "number") params.client_max_window_bits = this._options.clientMaxWindowBits;
			} else if (this._options.clientMaxWindowBits === false || typeof this._options.clientMaxWindowBits === "number" && params.client_max_window_bits > this._options.clientMaxWindowBits) throw new Error("Unexpected or invalid parameter \"client_max_window_bits\"");
			return params;
		}
		/**
		* Normalize parameters.
		*
		* @param {Array} configurations The extension negotiation offers/reponse
		* @return {Array} The offers/response with normalized parameters
		* @private
		*/
		normalizeParams(configurations) {
			configurations.forEach((params) => {
				Object.keys(params).forEach((key) => {
					let value = params[key];
					if (value.length > 1) throw new Error(`Parameter "${key}" must have only a single value`);
					value = value[0];
					if (key === "client_max_window_bits") {
						if (value !== true) {
							const num = +value;
							if (!Number.isInteger(num) || num < 8 || num > 15) throw new TypeError(`Invalid value for parameter "${key}": ${value}`);
							value = num;
						} else if (!this._isServer) throw new TypeError(`Invalid value for parameter "${key}": ${value}`);
					} else if (key === "server_max_window_bits") {
						const num = +value;
						if (!Number.isInteger(num) || num < 8 || num > 15) throw new TypeError(`Invalid value for parameter "${key}": ${value}`);
						value = num;
					} else if (key === "client_no_context_takeover" || key === "server_no_context_takeover") {
						if (value !== true) throw new TypeError(`Invalid value for parameter "${key}": ${value}`);
					} else throw new Error(`Unknown parameter "${key}"`);
					params[key] = value;
				});
			});
			return configurations;
		}
		/**
		* Decompress data. Concurrency limited.
		*
		* @param {Buffer} data Compressed data
		* @param {Boolean} fin Specifies whether or not this is the last fragment
		* @param {Function} callback Callback
		* @public
		*/
		decompress(data, fin, callback) {
			zlibLimiter.add((done) => {
				this._decompress(data, fin, (err, result) => {
					done();
					callback(err, result);
				});
			});
		}
		/**
		* Compress data. Concurrency limited.
		*
		* @param {Buffer} data Data to compress
		* @param {Boolean} fin Specifies whether or not this is the last fragment
		* @param {Function} callback Callback
		* @public
		*/
		compress(data, fin, callback) {
			zlibLimiter.add((done) => {
				this._compress(data, fin, (err, result) => {
					done();
					callback(err, result);
				});
			});
		}
		/**
		* Decompress data.
		*
		* @param {Buffer} data Compressed data
		* @param {Boolean} fin Specifies whether or not this is the last fragment
		* @param {Function} callback Callback
		* @private
		*/
		_decompress(data, fin, callback) {
			const endpoint = this._isServer ? "client" : "server";
			if (!this._inflate) {
				const key = `${endpoint}_max_window_bits`;
				const windowBits = typeof this.params[key] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
				this._inflate = zlib.createInflateRaw({
					...this._options.zlibInflateOptions,
					windowBits
				});
				this._inflate[kPerMessageDeflate] = this;
				this._inflate[kTotalLength] = 0;
				this._inflate[kBuffers] = [];
				this._inflate.on("error", inflateOnError);
				this._inflate.on("data", inflateOnData);
			}
			this._inflate[kCallback] = callback;
			this._inflate.write(data);
			if (fin) this._inflate.write(TRAILER);
			this._inflate.flush(() => {
				const err = this._inflate[kError];
				if (err) {
					this._inflate.close();
					this._inflate = null;
					callback(err);
					return;
				}
				const data$1 = bufferUtil.concat(this._inflate[kBuffers], this._inflate[kTotalLength]);
				if (this._inflate._readableState.endEmitted) {
					this._inflate.close();
					this._inflate = null;
				} else {
					this._inflate[kTotalLength] = 0;
					this._inflate[kBuffers] = [];
					if (fin && this.params[`${endpoint}_no_context_takeover`]) this._inflate.reset();
				}
				callback(null, data$1);
			});
		}
		/**
		* Compress data.
		*
		* @param {Buffer} data Data to compress
		* @param {Boolean} fin Specifies whether or not this is the last fragment
		* @param {Function} callback Callback
		* @private
		*/
		_compress(data, fin, callback) {
			const endpoint = this._isServer ? "server" : "client";
			if (!this._deflate) {
				const key = `${endpoint}_max_window_bits`;
				const windowBits = typeof this.params[key] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
				this._deflate = zlib.createDeflateRaw({
					...this._options.zlibDeflateOptions,
					windowBits
				});
				this._deflate[kTotalLength] = 0;
				this._deflate[kBuffers] = [];
				this._deflate.on("error", NOOP$1);
				this._deflate.on("data", deflateOnData);
			}
			this._deflate[kCallback] = callback;
			this._deflate.write(data);
			this._deflate.flush(zlib.Z_SYNC_FLUSH, () => {
				if (!this._deflate) return;
				let data$1 = bufferUtil.concat(this._deflate[kBuffers], this._deflate[kTotalLength]);
				if (fin) data$1 = data$1.slice(0, data$1.length - 4);
				this._deflate[kCallback] = null;
				this._deflate[kTotalLength] = 0;
				this._deflate[kBuffers] = [];
				if (fin && this.params[`${endpoint}_no_context_takeover`]) this._deflate.reset();
				callback(null, data$1);
			});
		}
	};
	module.exports = PerMessageDeflate$4;
	/**
	* The listener of the `zlib.DeflateRaw` stream `'data'` event.
	*
	* @param {Buffer} chunk A chunk of data
	* @private
	*/
	function deflateOnData(chunk) {
		this[kBuffers].push(chunk);
		this[kTotalLength] += chunk.length;
	}
	/**
	* The listener of the `zlib.InflateRaw` stream `'data'` event.
	*
	* @param {Buffer} chunk A chunk of data
	* @private
	*/
	function inflateOnData(chunk) {
		this[kTotalLength] += chunk.length;
		if (this[kPerMessageDeflate]._maxPayload < 1 || this[kTotalLength] <= this[kPerMessageDeflate]._maxPayload) {
			this[kBuffers].push(chunk);
			return;
		}
		this[kError] = /* @__PURE__ */ new RangeError("Max payload size exceeded");
		this[kError].code = "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH";
		this[kError][kStatusCode$2] = 1009;
		this.removeListener("data", inflateOnData);
		this.reset();
	}
	/**
	* The listener of the `zlib.InflateRaw` stream `'error'` event.
	*
	* @param {Error} err The emitted error
	* @private
	*/
	function inflateOnError(err) {
		this[kPerMessageDeflate]._inflate = null;
		err[kStatusCode$2] = 1007;
		this[kCallback](err);
	}
}) });

//#endregion
//#region ../../node_modules/.pnpm/ws@7.5.10/node_modules/ws/lib/validation.js
var require_validation = /* @__PURE__ */ __commonJS({ "../../node_modules/.pnpm/ws@7.5.10/node_modules/ws/lib/validation.js": ((exports, module) => {
	/**
	* Checks if a status code is allowed in a close frame.
	*
	* @param {Number} code The status code
	* @return {Boolean} `true` if the status code is valid, else `false`
	* @public
	*/
	function isValidStatusCode$2(code) {
		return code >= 1e3 && code <= 1014 && code !== 1004 && code !== 1005 && code !== 1006 || code >= 3e3 && code <= 4999;
	}
	/**
	* Checks if a given buffer contains only correct UTF-8.
	* Ported from https://www.cl.cam.ac.uk/%7Emgk25/ucs/utf8_check.c by
	* Markus Kuhn.
	*
	* @param {Buffer} buf The buffer to check
	* @return {Boolean} `true` if `buf` contains only correct UTF-8, else `false`
	* @public
	*/
	function _isValidUTF8(buf) {
		const len = buf.length;
		let i = 0;
		while (i < len) if ((buf[i] & 128) === 0) i++;
		else if ((buf[i] & 224) === 192) {
			if (i + 1 === len || (buf[i + 1] & 192) !== 128 || (buf[i] & 254) === 192) return false;
			i += 2;
		} else if ((buf[i] & 240) === 224) {
			if (i + 2 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || buf[i] === 224 && (buf[i + 1] & 224) === 128 || buf[i] === 237 && (buf[i + 1] & 224) === 160) return false;
			i += 3;
		} else if ((buf[i] & 248) === 240) {
			if (i + 3 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || (buf[i + 3] & 192) !== 128 || buf[i] === 240 && (buf[i + 1] & 240) === 128 || buf[i] === 244 && buf[i + 1] > 143 || buf[i] > 244) return false;
			i += 4;
		} else return false;
		return true;
	}
	try {
		let isValidUTF8$1 = __require("utf-8-validate");
		/* istanbul ignore if */
		if (typeof isValidUTF8$1 === "object") isValidUTF8$1 = isValidUTF8$1.Validation.isValidUTF8;
		module.exports = {
			isValidStatusCode: isValidStatusCode$2,
			isValidUTF8(buf) {
				return buf.length < 150 ? _isValidUTF8(buf) : isValidUTF8$1(buf);
			}
		};
	} catch (e) {
		module.exports = {
			isValidStatusCode: isValidStatusCode$2,
			isValidUTF8: _isValidUTF8
		};
	}
}) });

//#endregion
//#region ../../node_modules/.pnpm/ws@7.5.10/node_modules/ws/lib/receiver.js
var require_receiver = /* @__PURE__ */ __commonJS({ "../../node_modules/.pnpm/ws@7.5.10/node_modules/ws/lib/receiver.js": ((exports, module) => {
	const { Writable } = __require("stream");
	const PerMessageDeflate$3 = require_permessage_deflate();
	const { BINARY_TYPES: BINARY_TYPES$1, EMPTY_BUFFER: EMPTY_BUFFER$2, kStatusCode: kStatusCode$1, kWebSocket: kWebSocket$2 } = require_constants();
	const { concat, toArrayBuffer, unmask } = require_buffer_util();
	const { isValidStatusCode: isValidStatusCode$1, isValidUTF8 } = require_validation();
	const GET_INFO = 0;
	const GET_PAYLOAD_LENGTH_16 = 1;
	const GET_PAYLOAD_LENGTH_64 = 2;
	const GET_MASK = 3;
	const GET_DATA = 4;
	const INFLATING = 5;
	/**
	* HyBi Receiver implementation.
	*
	* @extends Writable
	*/
	var Receiver$1 = class extends Writable {
		/**
		* Creates a Receiver instance.
		*
		* @param {String} [binaryType=nodebuffer] The type for binary data
		* @param {Object} [extensions] An object containing the negotiated extensions
		* @param {Boolean} [isServer=false] Specifies whether to operate in client or
		*     server mode
		* @param {Number} [maxPayload=0] The maximum allowed message length
		*/
		constructor(binaryType, extensions, isServer, maxPayload) {
			super();
			this._binaryType = binaryType || BINARY_TYPES$1[0];
			this[kWebSocket$2] = void 0;
			this._extensions = extensions || {};
			this._isServer = !!isServer;
			this._maxPayload = maxPayload | 0;
			this._bufferedBytes = 0;
			this._buffers = [];
			this._compressed = false;
			this._payloadLength = 0;
			this._mask = void 0;
			this._fragmented = 0;
			this._masked = false;
			this._fin = false;
			this._opcode = 0;
			this._totalPayloadLength = 0;
			this._messageLength = 0;
			this._fragments = [];
			this._state = GET_INFO;
			this._loop = false;
		}
		/**
		* Implements `Writable.prototype._write()`.
		*
		* @param {Buffer} chunk The chunk of data to write
		* @param {String} encoding The character encoding of `chunk`
		* @param {Function} cb Callback
		* @private
		*/
		_write(chunk, encoding, cb) {
			if (this._opcode === 8 && this._state == GET_INFO) return cb();
			this._bufferedBytes += chunk.length;
			this._buffers.push(chunk);
			this.startLoop(cb);
		}
		/**
		* Consumes `n` bytes from the buffered data.
		*
		* @param {Number} n The number of bytes to consume
		* @return {Buffer} The consumed bytes
		* @private
		*/
		consume(n) {
			this._bufferedBytes -= n;
			if (n === this._buffers[0].length) return this._buffers.shift();
			if (n < this._buffers[0].length) {
				const buf = this._buffers[0];
				this._buffers[0] = buf.slice(n);
				return buf.slice(0, n);
			}
			const dst = Buffer.allocUnsafe(n);
			do {
				const buf = this._buffers[0];
				const offset = dst.length - n;
				if (n >= buf.length) dst.set(this._buffers.shift(), offset);
				else {
					dst.set(new Uint8Array(buf.buffer, buf.byteOffset, n), offset);
					this._buffers[0] = buf.slice(n);
				}
				n -= buf.length;
			} while (n > 0);
			return dst;
		}
		/**
		* Starts the parsing loop.
		*
		* @param {Function} cb Callback
		* @private
		*/
		startLoop(cb) {
			let err;
			this._loop = true;
			do
				switch (this._state) {
					case GET_INFO:
						err = this.getInfo();
						break;
					case GET_PAYLOAD_LENGTH_16:
						err = this.getPayloadLength16();
						break;
					case GET_PAYLOAD_LENGTH_64:
						err = this.getPayloadLength64();
						break;
					case GET_MASK:
						this.getMask();
						break;
					case GET_DATA:
						err = this.getData(cb);
						break;
					default:
						this._loop = false;
						return;
				}
			while (this._loop);
			cb(err);
		}
		/**
		* Reads the first two bytes of a frame.
		*
		* @return {(RangeError|undefined)} A possible error
		* @private
		*/
		getInfo() {
			if (this._bufferedBytes < 2) {
				this._loop = false;
				return;
			}
			const buf = this.consume(2);
			if ((buf[0] & 48) !== 0) {
				this._loop = false;
				return error(RangeError, "RSV2 and RSV3 must be clear", true, 1002, "WS_ERR_UNEXPECTED_RSV_2_3");
			}
			const compressed = (buf[0] & 64) === 64;
			if (compressed && !this._extensions[PerMessageDeflate$3.extensionName]) {
				this._loop = false;
				return error(RangeError, "RSV1 must be clear", true, 1002, "WS_ERR_UNEXPECTED_RSV_1");
			}
			this._fin = (buf[0] & 128) === 128;
			this._opcode = buf[0] & 15;
			this._payloadLength = buf[1] & 127;
			if (this._opcode === 0) {
				if (compressed) {
					this._loop = false;
					return error(RangeError, "RSV1 must be clear", true, 1002, "WS_ERR_UNEXPECTED_RSV_1");
				}
				if (!this._fragmented) {
					this._loop = false;
					return error(RangeError, "invalid opcode 0", true, 1002, "WS_ERR_INVALID_OPCODE");
				}
				this._opcode = this._fragmented;
			} else if (this._opcode === 1 || this._opcode === 2) {
				if (this._fragmented) {
					this._loop = false;
					return error(RangeError, `invalid opcode ${this._opcode}`, true, 1002, "WS_ERR_INVALID_OPCODE");
				}
				this._compressed = compressed;
			} else if (this._opcode > 7 && this._opcode < 11) {
				if (!this._fin) {
					this._loop = false;
					return error(RangeError, "FIN must be set", true, 1002, "WS_ERR_EXPECTED_FIN");
				}
				if (compressed) {
					this._loop = false;
					return error(RangeError, "RSV1 must be clear", true, 1002, "WS_ERR_UNEXPECTED_RSV_1");
				}
				if (this._payloadLength > 125) {
					this._loop = false;
					return error(RangeError, `invalid payload length ${this._payloadLength}`, true, 1002, "WS_ERR_INVALID_CONTROL_PAYLOAD_LENGTH");
				}
			} else {
				this._loop = false;
				return error(RangeError, `invalid opcode ${this._opcode}`, true, 1002, "WS_ERR_INVALID_OPCODE");
			}
			if (!this._fin && !this._fragmented) this._fragmented = this._opcode;
			this._masked = (buf[1] & 128) === 128;
			if (this._isServer) {
				if (!this._masked) {
					this._loop = false;
					return error(RangeError, "MASK must be set", true, 1002, "WS_ERR_EXPECTED_MASK");
				}
			} else if (this._masked) {
				this._loop = false;
				return error(RangeError, "MASK must be clear", true, 1002, "WS_ERR_UNEXPECTED_MASK");
			}
			if (this._payloadLength === 126) this._state = GET_PAYLOAD_LENGTH_16;
			else if (this._payloadLength === 127) this._state = GET_PAYLOAD_LENGTH_64;
			else return this.haveLength();
		}
		/**
		* Gets extended payload length (7+16).
		*
		* @return {(RangeError|undefined)} A possible error
		* @private
		*/
		getPayloadLength16() {
			if (this._bufferedBytes < 2) {
				this._loop = false;
				return;
			}
			this._payloadLength = this.consume(2).readUInt16BE(0);
			return this.haveLength();
		}
		/**
		* Gets extended payload length (7+64).
		*
		* @return {(RangeError|undefined)} A possible error
		* @private
		*/
		getPayloadLength64() {
			if (this._bufferedBytes < 8) {
				this._loop = false;
				return;
			}
			const buf = this.consume(8);
			const num = buf.readUInt32BE(0);
			if (num > Math.pow(2, 21) - 1) {
				this._loop = false;
				return error(RangeError, "Unsupported WebSocket frame: payload length > 2^53 - 1", false, 1009, "WS_ERR_UNSUPPORTED_DATA_PAYLOAD_LENGTH");
			}
			this._payloadLength = num * Math.pow(2, 32) + buf.readUInt32BE(4);
			return this.haveLength();
		}
		/**
		* Payload length has been read.
		*
		* @return {(RangeError|undefined)} A possible error
		* @private
		*/
		haveLength() {
			if (this._payloadLength && this._opcode < 8) {
				this._totalPayloadLength += this._payloadLength;
				if (this._totalPayloadLength > this._maxPayload && this._maxPayload > 0) {
					this._loop = false;
					return error(RangeError, "Max payload size exceeded", false, 1009, "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH");
				}
			}
			if (this._masked) this._state = GET_MASK;
			else this._state = GET_DATA;
		}
		/**
		* Reads mask bytes.
		*
		* @private
		*/
		getMask() {
			if (this._bufferedBytes < 4) {
				this._loop = false;
				return;
			}
			this._mask = this.consume(4);
			this._state = GET_DATA;
		}
		/**
		* Reads data bytes.
		*
		* @param {Function} cb Callback
		* @return {(Error|RangeError|undefined)} A possible error
		* @private
		*/
		getData(cb) {
			let data = EMPTY_BUFFER$2;
			if (this._payloadLength) {
				if (this._bufferedBytes < this._payloadLength) {
					this._loop = false;
					return;
				}
				data = this.consume(this._payloadLength);
				if (this._masked) unmask(data, this._mask);
			}
			if (this._opcode > 7) return this.controlMessage(data);
			if (this._compressed) {
				this._state = INFLATING;
				this.decompress(data, cb);
				return;
			}
			if (data.length) {
				this._messageLength = this._totalPayloadLength;
				this._fragments.push(data);
			}
			return this.dataMessage();
		}
		/**
		* Decompresses data.
		*
		* @param {Buffer} data Compressed data
		* @param {Function} cb Callback
		* @private
		*/
		decompress(data, cb) {
			const perMessageDeflate = this._extensions[PerMessageDeflate$3.extensionName];
			perMessageDeflate.decompress(data, this._fin, (err, buf) => {
				if (err) return cb(err);
				if (buf.length) {
					this._messageLength += buf.length;
					if (this._messageLength > this._maxPayload && this._maxPayload > 0) return cb(error(RangeError, "Max payload size exceeded", false, 1009, "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"));
					this._fragments.push(buf);
				}
				const er = this.dataMessage();
				if (er) return cb(er);
				this.startLoop(cb);
			});
		}
		/**
		* Handles a data message.
		*
		* @return {(Error|undefined)} A possible error
		* @private
		*/
		dataMessage() {
			if (this._fin) {
				const messageLength = this._messageLength;
				const fragments = this._fragments;
				this._totalPayloadLength = 0;
				this._messageLength = 0;
				this._fragmented = 0;
				this._fragments = [];
				if (this._opcode === 2) {
					let data;
					if (this._binaryType === "nodebuffer") data = concat(fragments, messageLength);
					else if (this._binaryType === "arraybuffer") data = toArrayBuffer(concat(fragments, messageLength));
					else data = fragments;
					this.emit("message", data);
				} else {
					const buf = concat(fragments, messageLength);
					if (!isValidUTF8(buf)) {
						this._loop = false;
						return error(Error, "invalid UTF-8 sequence", true, 1007, "WS_ERR_INVALID_UTF8");
					}
					this.emit("message", buf.toString());
				}
			}
			this._state = GET_INFO;
		}
		/**
		* Handles a control message.
		*
		* @param {Buffer} data Data to handle
		* @return {(Error|RangeError|undefined)} A possible error
		* @private
		*/
		controlMessage(data) {
			if (this._opcode === 8) {
				this._loop = false;
				if (data.length === 0) {
					this.emit("conclude", 1005, "");
					this.end();
				} else if (data.length === 1) return error(RangeError, "invalid payload length 1", true, 1002, "WS_ERR_INVALID_CONTROL_PAYLOAD_LENGTH");
				else {
					const code = data.readUInt16BE(0);
					if (!isValidStatusCode$1(code)) return error(RangeError, `invalid status code ${code}`, true, 1002, "WS_ERR_INVALID_CLOSE_CODE");
					const buf = data.slice(2);
					if (!isValidUTF8(buf)) return error(Error, "invalid UTF-8 sequence", true, 1007, "WS_ERR_INVALID_UTF8");
					this.emit("conclude", code, buf.toString());
					this.end();
				}
			} else if (this._opcode === 9) this.emit("ping", data);
			else this.emit("pong", data);
			this._state = GET_INFO;
		}
	};
	module.exports = Receiver$1;
	/**
	* Builds an error object.
	*
	* @param {function(new:Error|RangeError)} ErrorCtor The error constructor
	* @param {String} message The error message
	* @param {Boolean} prefix Specifies whether or not to add a default prefix to
	*     `message`
	* @param {Number} statusCode The status code
	* @param {String} errorCode The exposed error code
	* @return {(Error|RangeError)} The error
	* @private
	*/
	function error(ErrorCtor, message, prefix, statusCode, errorCode) {
		const err = new ErrorCtor(prefix ? `Invalid WebSocket frame: ${message}` : message);
		Error.captureStackTrace(err, error);
		err.code = errorCode;
		err[kStatusCode$1] = statusCode;
		return err;
	}
}) });

//#endregion
//#region ../../node_modules/.pnpm/ws@7.5.10/node_modules/ws/lib/sender.js
var require_sender = /* @__PURE__ */ __commonJS({ "../../node_modules/.pnpm/ws@7.5.10/node_modules/ws/lib/sender.js": ((exports, module) => {
	__require("net");
	__require("tls");
	const { randomFillSync } = __require("crypto");
	const PerMessageDeflate$2 = require_permessage_deflate();
	const { EMPTY_BUFFER: EMPTY_BUFFER$1 } = require_constants();
	const { isValidStatusCode } = require_validation();
	const { mask: applyMask, toBuffer: toBuffer$1 } = require_buffer_util();
	const mask = Buffer.alloc(4);
	/**
	* HyBi Sender implementation.
	*/
	var Sender$1 = class Sender$1 {
		/**
		* Creates a Sender instance.
		*
		* @param {(net.Socket|tls.Socket)} socket The connection socket
		* @param {Object} [extensions] An object containing the negotiated extensions
		*/
		constructor(socket, extensions) {
			this._extensions = extensions || {};
			this._socket = socket;
			this._firstFragment = true;
			this._compress = false;
			this._bufferedBytes = 0;
			this._deflating = false;
			this._queue = [];
		}
		/**
		* Frames a piece of data according to the HyBi WebSocket protocol.
		*
		* @param {Buffer} data The data to frame
		* @param {Object} options Options object
		* @param {Number} options.opcode The opcode
		* @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
		*     modified
		* @param {Boolean} [options.fin=false] Specifies whether or not to set the
		*     FIN bit
		* @param {Boolean} [options.mask=false] Specifies whether or not to mask
		*     `data`
		* @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
		*     RSV1 bit
		* @return {Buffer[]} The framed data as a list of `Buffer` instances
		* @public
		*/
		static frame(data, options) {
			const merge = options.mask && options.readOnly;
			let offset = options.mask ? 6 : 2;
			let payloadLength = data.length;
			if (data.length >= 65536) {
				offset += 8;
				payloadLength = 127;
			} else if (data.length > 125) {
				offset += 2;
				payloadLength = 126;
			}
			const target = Buffer.allocUnsafe(merge ? data.length + offset : offset);
			target[0] = options.fin ? options.opcode | 128 : options.opcode;
			if (options.rsv1) target[0] |= 64;
			target[1] = payloadLength;
			if (payloadLength === 126) target.writeUInt16BE(data.length, 2);
			else if (payloadLength === 127) {
				target.writeUInt32BE(0, 2);
				target.writeUInt32BE(data.length, 6);
			}
			if (!options.mask) return [target, data];
			randomFillSync(mask, 0, 4);
			target[1] |= 128;
			target[offset - 4] = mask[0];
			target[offset - 3] = mask[1];
			target[offset - 2] = mask[2];
			target[offset - 1] = mask[3];
			if (merge) {
				applyMask(data, mask, target, offset, data.length);
				return [target];
			}
			applyMask(data, mask, data, 0, data.length);
			return [target, data];
		}
		/**
		* Sends a close message to the other peer.
		*
		* @param {Number} [code] The status code component of the body
		* @param {String} [data] The message component of the body
		* @param {Boolean} [mask=false] Specifies whether or not to mask the message
		* @param {Function} [cb] Callback
		* @public
		*/
		close(code, data, mask$1, cb) {
			let buf;
			if (code === void 0) buf = EMPTY_BUFFER$1;
			else if (typeof code !== "number" || !isValidStatusCode(code)) throw new TypeError("First argument must be a valid error code number");
			else if (data === void 0 || data === "") {
				buf = Buffer.allocUnsafe(2);
				buf.writeUInt16BE(code, 0);
			} else {
				const length = Buffer.byteLength(data);
				if (length > 123) throw new RangeError("The message must not be greater than 123 bytes");
				buf = Buffer.allocUnsafe(2 + length);
				buf.writeUInt16BE(code, 0);
				buf.write(data, 2);
			}
			if (this._deflating) this.enqueue([
				this.doClose,
				buf,
				mask$1,
				cb
			]);
			else this.doClose(buf, mask$1, cb);
		}
		/**
		* Frames and sends a close message.
		*
		* @param {Buffer} data The message to send
		* @param {Boolean} [mask=false] Specifies whether or not to mask `data`
		* @param {Function} [cb] Callback
		* @private
		*/
		doClose(data, mask$1, cb) {
			this.sendFrame(Sender$1.frame(data, {
				fin: true,
				rsv1: false,
				opcode: 8,
				mask: mask$1,
				readOnly: false
			}), cb);
		}
		/**
		* Sends a ping message to the other peer.
		*
		* @param {*} data The message to send
		* @param {Boolean} [mask=false] Specifies whether or not to mask `data`
		* @param {Function} [cb] Callback
		* @public
		*/
		ping(data, mask$1, cb) {
			const buf = toBuffer$1(data);
			if (buf.length > 125) throw new RangeError("The data size must not be greater than 125 bytes");
			if (this._deflating) this.enqueue([
				this.doPing,
				buf,
				mask$1,
				toBuffer$1.readOnly,
				cb
			]);
			else this.doPing(buf, mask$1, toBuffer$1.readOnly, cb);
		}
		/**
		* Frames and sends a ping message.
		*
		* @param {Buffer} data The message to send
		* @param {Boolean} [mask=false] Specifies whether or not to mask `data`
		* @param {Boolean} [readOnly=false] Specifies whether `data` can be modified
		* @param {Function} [cb] Callback
		* @private
		*/
		doPing(data, mask$1, readOnly, cb) {
			this.sendFrame(Sender$1.frame(data, {
				fin: true,
				rsv1: false,
				opcode: 9,
				mask: mask$1,
				readOnly
			}), cb);
		}
		/**
		* Sends a pong message to the other peer.
		*
		* @param {*} data The message to send
		* @param {Boolean} [mask=false] Specifies whether or not to mask `data`
		* @param {Function} [cb] Callback
		* @public
		*/
		pong(data, mask$1, cb) {
			const buf = toBuffer$1(data);
			if (buf.length > 125) throw new RangeError("The data size must not be greater than 125 bytes");
			if (this._deflating) this.enqueue([
				this.doPong,
				buf,
				mask$1,
				toBuffer$1.readOnly,
				cb
			]);
			else this.doPong(buf, mask$1, toBuffer$1.readOnly, cb);
		}
		/**
		* Frames and sends a pong message.
		*
		* @param {Buffer} data The message to send
		* @param {Boolean} [mask=false] Specifies whether or not to mask `data`
		* @param {Boolean} [readOnly=false] Specifies whether `data` can be modified
		* @param {Function} [cb] Callback
		* @private
		*/
		doPong(data, mask$1, readOnly, cb) {
			this.sendFrame(Sender$1.frame(data, {
				fin: true,
				rsv1: false,
				opcode: 10,
				mask: mask$1,
				readOnly
			}), cb);
		}
		/**
		* Sends a data message to the other peer.
		*
		* @param {*} data The message to send
		* @param {Object} options Options object
		* @param {Boolean} [options.compress=false] Specifies whether or not to
		*     compress `data`
		* @param {Boolean} [options.binary=false] Specifies whether `data` is binary
		*     or text
		* @param {Boolean} [options.fin=false] Specifies whether the fragment is the
		*     last one
		* @param {Boolean} [options.mask=false] Specifies whether or not to mask
		*     `data`
		* @param {Function} [cb] Callback
		* @public
		*/
		send(data, options, cb) {
			const buf = toBuffer$1(data);
			const perMessageDeflate = this._extensions[PerMessageDeflate$2.extensionName];
			let opcode = options.binary ? 2 : 1;
			let rsv1 = options.compress;
			if (this._firstFragment) {
				this._firstFragment = false;
				if (rsv1 && perMessageDeflate) rsv1 = buf.length >= perMessageDeflate._threshold;
				this._compress = rsv1;
			} else {
				rsv1 = false;
				opcode = 0;
			}
			if (options.fin) this._firstFragment = true;
			if (perMessageDeflate) {
				const opts = {
					fin: options.fin,
					rsv1,
					opcode,
					mask: options.mask,
					readOnly: toBuffer$1.readOnly
				};
				if (this._deflating) this.enqueue([
					this.dispatch,
					buf,
					this._compress,
					opts,
					cb
				]);
				else this.dispatch(buf, this._compress, opts, cb);
			} else this.sendFrame(Sender$1.frame(buf, {
				fin: options.fin,
				rsv1: false,
				opcode,
				mask: options.mask,
				readOnly: toBuffer$1.readOnly
			}), cb);
		}
		/**
		* Dispatches a data message.
		*
		* @param {Buffer} data The message to send
		* @param {Boolean} [compress=false] Specifies whether or not to compress
		*     `data`
		* @param {Object} options Options object
		* @param {Number} options.opcode The opcode
		* @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
		*     modified
		* @param {Boolean} [options.fin=false] Specifies whether or not to set the
		*     FIN bit
		* @param {Boolean} [options.mask=false] Specifies whether or not to mask
		*     `data`
		* @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
		*     RSV1 bit
		* @param {Function} [cb] Callback
		* @private
		*/
		dispatch(data, compress, options, cb) {
			if (!compress) {
				this.sendFrame(Sender$1.frame(data, options), cb);
				return;
			}
			const perMessageDeflate = this._extensions[PerMessageDeflate$2.extensionName];
			this._bufferedBytes += data.length;
			this._deflating = true;
			perMessageDeflate.compress(data, options.fin, (_, buf) => {
				if (this._socket.destroyed) {
					const err = /* @__PURE__ */ new Error("The socket was closed while data was being compressed");
					if (typeof cb === "function") cb(err);
					for (let i = 0; i < this._queue.length; i++) {
						const callback = this._queue[i][4];
						if (typeof callback === "function") callback(err);
					}
					return;
				}
				this._bufferedBytes -= data.length;
				this._deflating = false;
				options.readOnly = false;
				this.sendFrame(Sender$1.frame(buf, options), cb);
				this.dequeue();
			});
		}
		/**
		* Executes queued send operations.
		*
		* @private
		*/
		dequeue() {
			while (!this._deflating && this._queue.length) {
				const params = this._queue.shift();
				this._bufferedBytes -= params[1].length;
				Reflect.apply(params[0], this, params.slice(1));
			}
		}
		/**
		* Enqueues a send operation.
		*
		* @param {Array} params Send operation parameters.
		* @private
		*/
		enqueue(params) {
			this._bufferedBytes += params[1].length;
			this._queue.push(params);
		}
		/**
		* Sends a frame.
		*
		* @param {Buffer[]} list The frame to send
		* @param {Function} [cb] Callback
		* @private
		*/
		sendFrame(list, cb) {
			if (list.length === 2) {
				this._socket.cork();
				this._socket.write(list[0]);
				this._socket.write(list[1], cb);
				this._socket.uncork();
			} else this._socket.write(list[0], cb);
		}
	};
	module.exports = Sender$1;
}) });

//#endregion
//#region ../../node_modules/.pnpm/ws@7.5.10/node_modules/ws/lib/event-target.js
var require_event_target = /* @__PURE__ */ __commonJS({ "../../node_modules/.pnpm/ws@7.5.10/node_modules/ws/lib/event-target.js": ((exports, module) => {
	/**
	* Class representing an event.
	*
	* @private
	*/
	var Event = class {
		/**
		* Create a new `Event`.
		*
		* @param {String} type The name of the event
		* @param {Object} target A reference to the target to which the event was
		*     dispatched
		*/
		constructor(type, target) {
			this.target = target;
			this.type = type;
		}
	};
	/**
	* Class representing a message event.
	*
	* @extends Event
	* @private
	*/
	var MessageEvent = class extends Event {
		/**
		* Create a new `MessageEvent`.
		*
		* @param {(String|Buffer|ArrayBuffer|Buffer[])} data The received data
		* @param {WebSocket} target A reference to the target to which the event was
		*     dispatched
		*/
		constructor(data, target) {
			super("message", target);
			this.data = data;
		}
	};
	/**
	* Class representing a close event.
	*
	* @extends Event
	* @private
	*/
	var CloseEvent = class extends Event {
		/**
		* Create a new `CloseEvent`.
		*
		* @param {Number} code The status code explaining why the connection is being
		*     closed
		* @param {String} reason A human-readable string explaining why the
		*     connection is closing
		* @param {WebSocket} target A reference to the target to which the event was
		*     dispatched
		*/
		constructor(code, reason, target) {
			super("close", target);
			this.wasClean = target._closeFrameReceived && target._closeFrameSent;
			this.reason = reason;
			this.code = code;
		}
	};
	/**
	* Class representing an open event.
	*
	* @extends Event
	* @private
	*/
	var OpenEvent = class extends Event {
		/**
		* Create a new `OpenEvent`.
		*
		* @param {WebSocket} target A reference to the target to which the event was
		*     dispatched
		*/
		constructor(target) {
			super("open", target);
		}
	};
	/**
	* Class representing an error event.
	*
	* @extends Event
	* @private
	*/
	var ErrorEvent = class extends Event {
		/**
		* Create a new `ErrorEvent`.
		*
		* @param {Object} error The error that generated this event
		* @param {WebSocket} target A reference to the target to which the event was
		*     dispatched
		*/
		constructor(error$1, target) {
			super("error", target);
			this.message = error$1.message;
			this.error = error$1;
		}
	};
	/**
	* This provides methods for emulating the `EventTarget` interface. It's not
	* meant to be used directly.
	*
	* @mixin
	*/
	const EventTarget = {
		addEventListener(type, listener, options) {
			if (typeof listener !== "function") return;
			function onMessage(data) {
				listener.call(this, new MessageEvent(data, this));
			}
			function onClose(code, message) {
				listener.call(this, new CloseEvent(code, message, this));
			}
			function onError(error$1) {
				listener.call(this, new ErrorEvent(error$1, this));
			}
			function onOpen() {
				listener.call(this, new OpenEvent(this));
			}
			const method = options && options.once ? "once" : "on";
			if (type === "message") {
				onMessage._listener = listener;
				this[method](type, onMessage);
			} else if (type === "close") {
				onClose._listener = listener;
				this[method](type, onClose);
			} else if (type === "error") {
				onError._listener = listener;
				this[method](type, onError);
			} else if (type === "open") {
				onOpen._listener = listener;
				this[method](type, onOpen);
			} else this[method](type, listener);
		},
		removeEventListener(type, listener) {
			const listeners = this.listeners(type);
			for (let i = 0; i < listeners.length; i++) if (listeners[i] === listener || listeners[i]._listener === listener) this.removeListener(type, listeners[i]);
		}
	};
	module.exports = EventTarget;
}) });

//#endregion
//#region ../../node_modules/.pnpm/ws@7.5.10/node_modules/ws/lib/extension.js
var require_extension = /* @__PURE__ */ __commonJS({ "../../node_modules/.pnpm/ws@7.5.10/node_modules/ws/lib/extension.js": ((exports, module) => {
	const tokenChars = [
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		1,
		0,
		1,
		1,
		1,
		1,
		1,
		0,
		0,
		1,
		1,
		0,
		1,
		1,
		0,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		0,
		0,
		0,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		0,
		1,
		0,
		1,
		0
	];
	/**
	* Adds an offer to the map of extension offers or a parameter to the map of
	* parameters.
	*
	* @param {Object} dest The map of extension offers or parameters
	* @param {String} name The extension or parameter name
	* @param {(Object|Boolean|String)} elem The extension parameters or the
	*     parameter value
	* @private
	*/
	function push(dest, name, elem) {
		if (dest[name] === void 0) dest[name] = [elem];
		else dest[name].push(elem);
	}
	/**
	* Parses the `Sec-WebSocket-Extensions` header into an object.
	*
	* @param {String} header The field value of the header
	* @return {Object} The parsed object
	* @public
	*/
	function parse$2(header) {
		const offers = Object.create(null);
		if (header === void 0 || header === "") return offers;
		let params = Object.create(null);
		let mustUnescape = false;
		let isEscaping = false;
		let inQuotes = false;
		let extensionName;
		let paramName;
		let start = -1;
		let end = -1;
		let i = 0;
		for (; i < header.length; i++) {
			const code = header.charCodeAt(i);
			if (extensionName === void 0) if (end === -1 && tokenChars[code] === 1) {
				if (start === -1) start = i;
			} else if (code === 32 || code === 9) {
				if (end === -1 && start !== -1) end = i;
			} else if (code === 59 || code === 44) {
				if (start === -1) throw new SyntaxError(`Unexpected character at index ${i}`);
				if (end === -1) end = i;
				const name = header.slice(start, end);
				if (code === 44) {
					push(offers, name, params);
					params = Object.create(null);
				} else extensionName = name;
				start = end = -1;
			} else throw new SyntaxError(`Unexpected character at index ${i}`);
			else if (paramName === void 0) if (end === -1 && tokenChars[code] === 1) {
				if (start === -1) start = i;
			} else if (code === 32 || code === 9) {
				if (end === -1 && start !== -1) end = i;
			} else if (code === 59 || code === 44) {
				if (start === -1) throw new SyntaxError(`Unexpected character at index ${i}`);
				if (end === -1) end = i;
				push(params, header.slice(start, end), true);
				if (code === 44) {
					push(offers, extensionName, params);
					params = Object.create(null);
					extensionName = void 0;
				}
				start = end = -1;
			} else if (code === 61 && start !== -1 && end === -1) {
				paramName = header.slice(start, i);
				start = end = -1;
			} else throw new SyntaxError(`Unexpected character at index ${i}`);
			else if (isEscaping) {
				if (tokenChars[code] !== 1) throw new SyntaxError(`Unexpected character at index ${i}`);
				if (start === -1) start = i;
				else if (!mustUnescape) mustUnescape = true;
				isEscaping = false;
			} else if (inQuotes) if (tokenChars[code] === 1) {
				if (start === -1) start = i;
			} else if (code === 34 && start !== -1) {
				inQuotes = false;
				end = i;
			} else if (code === 92) isEscaping = true;
			else throw new SyntaxError(`Unexpected character at index ${i}`);
			else if (code === 34 && header.charCodeAt(i - 1) === 61) inQuotes = true;
			else if (end === -1 && tokenChars[code] === 1) {
				if (start === -1) start = i;
			} else if (start !== -1 && (code === 32 || code === 9)) {
				if (end === -1) end = i;
			} else if (code === 59 || code === 44) {
				if (start === -1) throw new SyntaxError(`Unexpected character at index ${i}`);
				if (end === -1) end = i;
				let value = header.slice(start, end);
				if (mustUnescape) {
					value = value.replace(/\\/g, "");
					mustUnescape = false;
				}
				push(params, paramName, value);
				if (code === 44) {
					push(offers, extensionName, params);
					params = Object.create(null);
					extensionName = void 0;
				}
				paramName = void 0;
				start = end = -1;
			} else throw new SyntaxError(`Unexpected character at index ${i}`);
		}
		if (start === -1 || inQuotes) throw new SyntaxError("Unexpected end of input");
		if (end === -1) end = i;
		const token = header.slice(start, end);
		if (extensionName === void 0) push(offers, token, params);
		else {
			if (paramName === void 0) push(params, token, true);
			else if (mustUnescape) push(params, paramName, token.replace(/\\/g, ""));
			else push(params, paramName, token);
			push(offers, extensionName, params);
		}
		return offers;
	}
	/**
	* Builds the `Sec-WebSocket-Extensions` header field value.
	*
	* @param {Object} extensions The map of extensions and parameters to format
	* @return {String} A string representing the given object
	* @public
	*/
	function format$2(extensions) {
		return Object.keys(extensions).map((extension) => {
			let configurations = extensions[extension];
			if (!Array.isArray(configurations)) configurations = [configurations];
			return configurations.map((params) => {
				return [extension].concat(Object.keys(params).map((k) => {
					let values = params[k];
					if (!Array.isArray(values)) values = [values];
					return values.map((v) => v === true ? k : `${k}=${v}`).join("; ");
				})).join("; ");
			}).join(", ");
		}).join(", ");
	}
	module.exports = {
		format: format$2,
		parse: parse$2
	};
}) });

//#endregion
//#region ../../node_modules/.pnpm/ws@7.5.10/node_modules/ws/lib/websocket.js
var require_websocket = /* @__PURE__ */ __commonJS({ "../../node_modules/.pnpm/ws@7.5.10/node_modules/ws/lib/websocket.js": ((exports, module) => {
	const EventEmitter$1 = __require("events");
	const https = __require("https");
	const http$1 = __require("http");
	const net = __require("net");
	const tls = __require("tls");
	const { randomBytes, createHash: createHash$1 } = __require("crypto");
	const { Readable } = __require("stream");
	const { URL } = __require("url");
	const PerMessageDeflate$1 = require_permessage_deflate();
	const Receiver = require_receiver();
	const Sender = require_sender();
	const { BINARY_TYPES, EMPTY_BUFFER, GUID: GUID$1, kStatusCode, kWebSocket: kWebSocket$1, NOOP } = require_constants();
	const { addEventListener, removeEventListener } = require_event_target();
	const { format: format$1, parse: parse$1 } = require_extension();
	const { toBuffer } = require_buffer_util();
	const readyStates = [
		"CONNECTING",
		"OPEN",
		"CLOSING",
		"CLOSED"
	];
	const protocolVersions = [8, 13];
	const closeTimeout = 30 * 1e3;
	/**
	* Class representing a WebSocket.
	*
	* @extends EventEmitter
	*/
	var WebSocket$2 = class WebSocket$2 extends EventEmitter$1 {
		/**
		* Create a new `WebSocket`.
		*
		* @param {(String|URL)} address The URL to which to connect
		* @param {(String|String[])} [protocols] The subprotocols
		* @param {Object} [options] Connection options
		*/
		constructor(address, protocols, options) {
			super();
			this._binaryType = BINARY_TYPES[0];
			this._closeCode = 1006;
			this._closeFrameReceived = false;
			this._closeFrameSent = false;
			this._closeMessage = "";
			this._closeTimer = null;
			this._extensions = {};
			this._protocol = "";
			this._readyState = WebSocket$2.CONNECTING;
			this._receiver = null;
			this._sender = null;
			this._socket = null;
			if (address !== null) {
				this._bufferedAmount = 0;
				this._isServer = false;
				this._redirects = 0;
				if (Array.isArray(protocols)) protocols = protocols.join(", ");
				else if (typeof protocols === "object" && protocols !== null) {
					options = protocols;
					protocols = void 0;
				}
				initAsClient(this, address, protocols, options);
			} else this._isServer = true;
		}
		/**
		* This deviates from the WHATWG interface since ws doesn't support the
		* required default "blob" type (instead we define a custom "nodebuffer"
		* type).
		*
		* @type {String}
		*/
		get binaryType() {
			return this._binaryType;
		}
		set binaryType(type) {
			if (!BINARY_TYPES.includes(type)) return;
			this._binaryType = type;
			if (this._receiver) this._receiver._binaryType = type;
		}
		/**
		* @type {Number}
		*/
		get bufferedAmount() {
			if (!this._socket) return this._bufferedAmount;
			return this._socket._writableState.length + this._sender._bufferedBytes;
		}
		/**
		* @type {String}
		*/
		get extensions() {
			return Object.keys(this._extensions).join();
		}
		/**
		* @type {Function}
		*/
		/* istanbul ignore next */
		get onclose() {
			return void 0;
		}
		/* istanbul ignore next */
		set onclose(listener) {}
		/**
		* @type {Function}
		*/
		/* istanbul ignore next */
		get onerror() {
			return void 0;
		}
		/* istanbul ignore next */
		set onerror(listener) {}
		/**
		* @type {Function}
		*/
		/* istanbul ignore next */
		get onopen() {
			return void 0;
		}
		/* istanbul ignore next */
		set onopen(listener) {}
		/**
		* @type {Function}
		*/
		/* istanbul ignore next */
		get onmessage() {
			return void 0;
		}
		/* istanbul ignore next */
		set onmessage(listener) {}
		/**
		* @type {String}
		*/
		get protocol() {
			return this._protocol;
		}
		/**
		* @type {Number}
		*/
		get readyState() {
			return this._readyState;
		}
		/**
		* @type {String}
		*/
		get url() {
			return this._url;
		}
		/**
		* Set up the socket and the internal resources.
		*
		* @param {(net.Socket|tls.Socket)} socket The network socket between the
		*     server and client
		* @param {Buffer} head The first packet of the upgraded stream
		* @param {Number} [maxPayload=0] The maximum allowed message size
		* @private
		*/
		setSocket(socket, head, maxPayload) {
			const receiver = new Receiver(this.binaryType, this._extensions, this._isServer, maxPayload);
			this._sender = new Sender(socket, this._extensions);
			this._receiver = receiver;
			this._socket = socket;
			receiver[kWebSocket$1] = this;
			socket[kWebSocket$1] = this;
			receiver.on("conclude", receiverOnConclude);
			receiver.on("drain", receiverOnDrain);
			receiver.on("error", receiverOnError);
			receiver.on("message", receiverOnMessage);
			receiver.on("ping", receiverOnPing);
			receiver.on("pong", receiverOnPong);
			socket.setTimeout(0);
			socket.setNoDelay();
			if (head.length > 0) socket.unshift(head);
			socket.on("close", socketOnClose);
			socket.on("data", socketOnData);
			socket.on("end", socketOnEnd);
			socket.on("error", socketOnError$1);
			this._readyState = WebSocket$2.OPEN;
			this.emit("open");
		}
		/**
		* Emit the `'close'` event.
		*
		* @private
		*/
		emitClose() {
			if (!this._socket) {
				this._readyState = WebSocket$2.CLOSED;
				this.emit("close", this._closeCode, this._closeMessage);
				return;
			}
			if (this._extensions[PerMessageDeflate$1.extensionName]) this._extensions[PerMessageDeflate$1.extensionName].cleanup();
			this._receiver.removeAllListeners();
			this._readyState = WebSocket$2.CLOSED;
			this.emit("close", this._closeCode, this._closeMessage);
		}
		/**
		* Start a closing handshake.
		*
		*          +----------+   +-----------+   +----------+
		*     - - -|ws.close()|-->|close frame|-->|ws.close()|- - -
		*    |     +----------+   +-----------+   +----------+     |
		*          +----------+   +-----------+         |
		* CLOSING  |ws.close()|<--|close frame|<--+-----+       CLOSING
		*          +----------+   +-----------+   |
		*    |           |                        |   +---+        |
		*                +------------------------+-->|fin| - - - -
		*    |         +---+                      |   +---+
		*     - - - - -|fin|<---------------------+
		*              +---+
		*
		* @param {Number} [code] Status code explaining why the connection is closing
		* @param {String} [data] A string explaining why the connection is closing
		* @public
		*/
		close(code, data) {
			if (this.readyState === WebSocket$2.CLOSED) return;
			if (this.readyState === WebSocket$2.CONNECTING) {
				const msg = "WebSocket was closed before the connection was established";
				return abortHandshake$1(this, this._req, msg);
			}
			if (this.readyState === WebSocket$2.CLOSING) {
				if (this._closeFrameSent && (this._closeFrameReceived || this._receiver._writableState.errorEmitted)) this._socket.end();
				return;
			}
			this._readyState = WebSocket$2.CLOSING;
			this._sender.close(code, data, !this._isServer, (err) => {
				if (err) return;
				this._closeFrameSent = true;
				if (this._closeFrameReceived || this._receiver._writableState.errorEmitted) this._socket.end();
			});
			this._closeTimer = setTimeout(this._socket.destroy.bind(this._socket), closeTimeout);
		}
		/**
		* Send a ping.
		*
		* @param {*} [data] The data to send
		* @param {Boolean} [mask] Indicates whether or not to mask `data`
		* @param {Function} [cb] Callback which is executed when the ping is sent
		* @public
		*/
		ping(data, mask$1, cb) {
			if (this.readyState === WebSocket$2.CONNECTING) throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
			if (typeof data === "function") {
				cb = data;
				data = mask$1 = void 0;
			} else if (typeof mask$1 === "function") {
				cb = mask$1;
				mask$1 = void 0;
			}
			if (typeof data === "number") data = data.toString();
			if (this.readyState !== WebSocket$2.OPEN) {
				sendAfterClose(this, data, cb);
				return;
			}
			if (mask$1 === void 0) mask$1 = !this._isServer;
			this._sender.ping(data || EMPTY_BUFFER, mask$1, cb);
		}
		/**
		* Send a pong.
		*
		* @param {*} [data] The data to send
		* @param {Boolean} [mask] Indicates whether or not to mask `data`
		* @param {Function} [cb] Callback which is executed when the pong is sent
		* @public
		*/
		pong(data, mask$1, cb) {
			if (this.readyState === WebSocket$2.CONNECTING) throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
			if (typeof data === "function") {
				cb = data;
				data = mask$1 = void 0;
			} else if (typeof mask$1 === "function") {
				cb = mask$1;
				mask$1 = void 0;
			}
			if (typeof data === "number") data = data.toString();
			if (this.readyState !== WebSocket$2.OPEN) {
				sendAfterClose(this, data, cb);
				return;
			}
			if (mask$1 === void 0) mask$1 = !this._isServer;
			this._sender.pong(data || EMPTY_BUFFER, mask$1, cb);
		}
		/**
		* Send a data message.
		*
		* @param {*} data The message to send
		* @param {Object} [options] Options object
		* @param {Boolean} [options.compress] Specifies whether or not to compress
		*     `data`
		* @param {Boolean} [options.binary] Specifies whether `data` is binary or
		*     text
		* @param {Boolean} [options.fin=true] Specifies whether the fragment is the
		*     last one
		* @param {Boolean} [options.mask] Specifies whether or not to mask `data`
		* @param {Function} [cb] Callback which is executed when data is written out
		* @public
		*/
		send(data, options, cb) {
			if (this.readyState === WebSocket$2.CONNECTING) throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
			if (typeof options === "function") {
				cb = options;
				options = {};
			}
			if (typeof data === "number") data = data.toString();
			if (this.readyState !== WebSocket$2.OPEN) {
				sendAfterClose(this, data, cb);
				return;
			}
			const opts = {
				binary: typeof data !== "string",
				mask: !this._isServer,
				compress: true,
				fin: true,
				...options
			};
			if (!this._extensions[PerMessageDeflate$1.extensionName]) opts.compress = false;
			this._sender.send(data || EMPTY_BUFFER, opts, cb);
		}
		/**
		* Forcibly close the connection.
		*
		* @public
		*/
		terminate() {
			if (this.readyState === WebSocket$2.CLOSED) return;
			if (this.readyState === WebSocket$2.CONNECTING) {
				const msg = "WebSocket was closed before the connection was established";
				return abortHandshake$1(this, this._req, msg);
			}
			if (this._socket) {
				this._readyState = WebSocket$2.CLOSING;
				this._socket.destroy();
			}
		}
	};
	/**
	* @constant {Number} CONNECTING
	* @memberof WebSocket
	*/
	Object.defineProperty(WebSocket$2, "CONNECTING", {
		enumerable: true,
		value: readyStates.indexOf("CONNECTING")
	});
	/**
	* @constant {Number} CONNECTING
	* @memberof WebSocket.prototype
	*/
	Object.defineProperty(WebSocket$2.prototype, "CONNECTING", {
		enumerable: true,
		value: readyStates.indexOf("CONNECTING")
	});
	/**
	* @constant {Number} OPEN
	* @memberof WebSocket
	*/
	Object.defineProperty(WebSocket$2, "OPEN", {
		enumerable: true,
		value: readyStates.indexOf("OPEN")
	});
	/**
	* @constant {Number} OPEN
	* @memberof WebSocket.prototype
	*/
	Object.defineProperty(WebSocket$2.prototype, "OPEN", {
		enumerable: true,
		value: readyStates.indexOf("OPEN")
	});
	/**
	* @constant {Number} CLOSING
	* @memberof WebSocket
	*/
	Object.defineProperty(WebSocket$2, "CLOSING", {
		enumerable: true,
		value: readyStates.indexOf("CLOSING")
	});
	/**
	* @constant {Number} CLOSING
	* @memberof WebSocket.prototype
	*/
	Object.defineProperty(WebSocket$2.prototype, "CLOSING", {
		enumerable: true,
		value: readyStates.indexOf("CLOSING")
	});
	/**
	* @constant {Number} CLOSED
	* @memberof WebSocket
	*/
	Object.defineProperty(WebSocket$2, "CLOSED", {
		enumerable: true,
		value: readyStates.indexOf("CLOSED")
	});
	/**
	* @constant {Number} CLOSED
	* @memberof WebSocket.prototype
	*/
	Object.defineProperty(WebSocket$2.prototype, "CLOSED", {
		enumerable: true,
		value: readyStates.indexOf("CLOSED")
	});
	[
		"binaryType",
		"bufferedAmount",
		"extensions",
		"protocol",
		"readyState",
		"url"
	].forEach((property) => {
		Object.defineProperty(WebSocket$2.prototype, property, { enumerable: true });
	});
	[
		"open",
		"error",
		"close",
		"message"
	].forEach((method) => {
		Object.defineProperty(WebSocket$2.prototype, `on${method}`, {
			enumerable: true,
			get() {
				const listeners = this.listeners(method);
				for (let i = 0; i < listeners.length; i++) if (listeners[i]._listener) return listeners[i]._listener;
				return void 0;
			},
			set(listener) {
				const listeners = this.listeners(method);
				for (let i = 0; i < listeners.length; i++) if (listeners[i]._listener) this.removeListener(method, listeners[i]);
				this.addEventListener(method, listener);
			}
		});
	});
	WebSocket$2.prototype.addEventListener = addEventListener;
	WebSocket$2.prototype.removeEventListener = removeEventListener;
	module.exports = WebSocket$2;
	/**
	* Initialize a WebSocket client.
	*
	* @param {WebSocket} websocket The client to initialize
	* @param {(String|URL)} address The URL to which to connect
	* @param {String} [protocols] The subprotocols
	* @param {Object} [options] Connection options
	* @param {(Boolean|Object)} [options.perMessageDeflate=true] Enable/disable
	*     permessage-deflate
	* @param {Number} [options.handshakeTimeout] Timeout in milliseconds for the
	*     handshake request
	* @param {Number} [options.protocolVersion=13] Value of the
	*     `Sec-WebSocket-Version` header
	* @param {String} [options.origin] Value of the `Origin` or
	*     `Sec-WebSocket-Origin` header
	* @param {Number} [options.maxPayload=104857600] The maximum allowed message
	*     size
	* @param {Boolean} [options.followRedirects=false] Whether or not to follow
	*     redirects
	* @param {Number} [options.maxRedirects=10] The maximum number of redirects
	*     allowed
	* @private
	*/
	function initAsClient(websocket, address, protocols, options) {
		const opts = {
			protocolVersion: protocolVersions[1],
			maxPayload: 100 * 1024 * 1024,
			perMessageDeflate: true,
			followRedirects: false,
			maxRedirects: 10,
			...options,
			createConnection: void 0,
			socketPath: void 0,
			hostname: void 0,
			protocol: void 0,
			timeout: void 0,
			method: void 0,
			host: void 0,
			path: void 0,
			port: void 0
		};
		if (!protocolVersions.includes(opts.protocolVersion)) throw new RangeError(`Unsupported protocol version: ${opts.protocolVersion} (supported versions: ${protocolVersions.join(", ")})`);
		let parsedUrl;
		if (address instanceof URL) {
			parsedUrl = address;
			websocket._url = address.href;
		} else {
			parsedUrl = new URL(address);
			websocket._url = address;
		}
		const isUnixSocket = parsedUrl.protocol === "ws+unix:";
		if (!parsedUrl.host && (!isUnixSocket || !parsedUrl.pathname)) {
			const err = /* @__PURE__ */ new Error(`Invalid URL: ${websocket.url}`);
			if (websocket._redirects === 0) throw err;
			else {
				emitErrorAndClose(websocket, err);
				return;
			}
		}
		const isSecure = parsedUrl.protocol === "wss:" || parsedUrl.protocol === "https:";
		const defaultPort = isSecure ? 443 : 80;
		const key = randomBytes(16).toString("base64");
		const get = isSecure ? https.get : http$1.get;
		let perMessageDeflate;
		opts.createConnection = isSecure ? tlsConnect : netConnect;
		opts.defaultPort = opts.defaultPort || defaultPort;
		opts.port = parsedUrl.port || defaultPort;
		opts.host = parsedUrl.hostname.startsWith("[") ? parsedUrl.hostname.slice(1, -1) : parsedUrl.hostname;
		opts.headers = {
			"Sec-WebSocket-Version": opts.protocolVersion,
			"Sec-WebSocket-Key": key,
			Connection: "Upgrade",
			Upgrade: "websocket",
			...opts.headers
		};
		opts.path = parsedUrl.pathname + parsedUrl.search;
		opts.timeout = opts.handshakeTimeout;
		if (opts.perMessageDeflate) {
			perMessageDeflate = new PerMessageDeflate$1(opts.perMessageDeflate !== true ? opts.perMessageDeflate : {}, false, opts.maxPayload);
			opts.headers["Sec-WebSocket-Extensions"] = format$1({ [PerMessageDeflate$1.extensionName]: perMessageDeflate.offer() });
		}
		if (protocols) opts.headers["Sec-WebSocket-Protocol"] = protocols;
		if (opts.origin) if (opts.protocolVersion < 13) opts.headers["Sec-WebSocket-Origin"] = opts.origin;
		else opts.headers.Origin = opts.origin;
		if (parsedUrl.username || parsedUrl.password) opts.auth = `${parsedUrl.username}:${parsedUrl.password}`;
		if (isUnixSocket) {
			const parts = opts.path.split(":");
			opts.socketPath = parts[0];
			opts.path = parts[1];
		}
		if (opts.followRedirects) {
			if (websocket._redirects === 0) {
				websocket._originalUnixSocket = isUnixSocket;
				websocket._originalSecure = isSecure;
				websocket._originalHostOrSocketPath = isUnixSocket ? opts.socketPath : parsedUrl.host;
				const headers = options && options.headers;
				options = {
					...options,
					headers: {}
				};
				if (headers) for (const [key$1, value] of Object.entries(headers)) options.headers[key$1.toLowerCase()] = value;
			} else {
				const isSameHost = isUnixSocket ? websocket._originalUnixSocket ? opts.socketPath === websocket._originalHostOrSocketPath : false : websocket._originalUnixSocket ? false : parsedUrl.host === websocket._originalHostOrSocketPath;
				if (!isSameHost || websocket._originalSecure && !isSecure) {
					delete opts.headers.authorization;
					delete opts.headers.cookie;
					if (!isSameHost) delete opts.headers.host;
					opts.auth = void 0;
				}
			}
			if (opts.auth && !options.headers.authorization) options.headers.authorization = "Basic " + Buffer.from(opts.auth).toString("base64");
		}
		let req = websocket._req = get(opts);
		if (opts.timeout) req.on("timeout", () => {
			abortHandshake$1(websocket, req, "Opening handshake has timed out");
		});
		req.on("error", (err) => {
			if (req === null || req.aborted) return;
			req = websocket._req = null;
			emitErrorAndClose(websocket, err);
		});
		req.on("response", (res) => {
			const location = res.headers.location;
			const statusCode = res.statusCode;
			if (location && opts.followRedirects && statusCode >= 300 && statusCode < 400) {
				if (++websocket._redirects > opts.maxRedirects) {
					abortHandshake$1(websocket, req, "Maximum redirects exceeded");
					return;
				}
				req.abort();
				let addr;
				try {
					addr = new URL(location, address);
				} catch (err) {
					emitErrorAndClose(websocket, err);
					return;
				}
				initAsClient(websocket, addr, protocols, options);
			} else if (!websocket.emit("unexpected-response", req, res)) abortHandshake$1(websocket, req, `Unexpected server response: ${res.statusCode}`);
		});
		req.on("upgrade", (res, socket, head) => {
			websocket.emit("upgrade", res);
			if (websocket.readyState !== WebSocket$2.CONNECTING) return;
			req = websocket._req = null;
			const upgrade = res.headers.upgrade;
			if (upgrade === void 0 || upgrade.toLowerCase() !== "websocket") {
				abortHandshake$1(websocket, socket, "Invalid Upgrade header");
				return;
			}
			const digest = createHash$1("sha1").update(key + GUID$1).digest("base64");
			if (res.headers["sec-websocket-accept"] !== digest) {
				abortHandshake$1(websocket, socket, "Invalid Sec-WebSocket-Accept header");
				return;
			}
			const serverProt = res.headers["sec-websocket-protocol"];
			const protList = (protocols || "").split(/, */);
			let protError;
			if (!protocols && serverProt) protError = "Server sent a subprotocol but none was requested";
			else if (protocols && !serverProt) protError = "Server sent no subprotocol";
			else if (serverProt && !protList.includes(serverProt)) protError = "Server sent an invalid subprotocol";
			if (protError) {
				abortHandshake$1(websocket, socket, protError);
				return;
			}
			if (serverProt) websocket._protocol = serverProt;
			const secWebSocketExtensions = res.headers["sec-websocket-extensions"];
			if (secWebSocketExtensions !== void 0) {
				if (!perMessageDeflate) {
					const message = "Server sent a Sec-WebSocket-Extensions header but no extension was requested";
					abortHandshake$1(websocket, socket, message);
					return;
				}
				let extensions;
				try {
					extensions = parse$1(secWebSocketExtensions);
				} catch (err) {
					const message = "Invalid Sec-WebSocket-Extensions header";
					abortHandshake$1(websocket, socket, message);
					return;
				}
				const extensionNames = Object.keys(extensions);
				if (extensionNames.length) {
					if (extensionNames.length !== 1 || extensionNames[0] !== PerMessageDeflate$1.extensionName) {
						const message = "Server indicated an extension that was not requested";
						abortHandshake$1(websocket, socket, message);
						return;
					}
					try {
						perMessageDeflate.accept(extensions[PerMessageDeflate$1.extensionName]);
					} catch (err) {
						const message = "Invalid Sec-WebSocket-Extensions header";
						abortHandshake$1(websocket, socket, message);
						return;
					}
					websocket._extensions[PerMessageDeflate$1.extensionName] = perMessageDeflate;
				}
			}
			websocket.setSocket(socket, head, opts.maxPayload);
		});
	}
	/**
	* Emit the `'error'` and `'close'` event.
	*
	* @param {WebSocket} websocket The WebSocket instance
	* @param {Error} The error to emit
	* @private
	*/
	function emitErrorAndClose(websocket, err) {
		websocket._readyState = WebSocket$2.CLOSING;
		websocket.emit("error", err);
		websocket.emitClose();
	}
	/**
	* Create a `net.Socket` and initiate a connection.
	*
	* @param {Object} options Connection options
	* @return {net.Socket} The newly created socket used to start the connection
	* @private
	*/
	function netConnect(options) {
		options.path = options.socketPath;
		return net.connect(options);
	}
	/**
	* Create a `tls.TLSSocket` and initiate a connection.
	*
	* @param {Object} options Connection options
	* @return {tls.TLSSocket} The newly created socket used to start the connection
	* @private
	*/
	function tlsConnect(options) {
		options.path = void 0;
		if (!options.servername && options.servername !== "") options.servername = net.isIP(options.host) ? "" : options.host;
		return tls.connect(options);
	}
	/**
	* Abort the handshake and emit an error.
	*
	* @param {WebSocket} websocket The WebSocket instance
	* @param {(http.ClientRequest|net.Socket|tls.Socket)} stream The request to
	*     abort or the socket to destroy
	* @param {String} message The error message
	* @private
	*/
	function abortHandshake$1(websocket, stream, message) {
		websocket._readyState = WebSocket$2.CLOSING;
		const err = new Error(message);
		Error.captureStackTrace(err, abortHandshake$1);
		if (stream.setHeader) {
			stream.abort();
			if (stream.socket && !stream.socket.destroyed) stream.socket.destroy();
			stream.once("abort", websocket.emitClose.bind(websocket));
			websocket.emit("error", err);
		} else {
			stream.destroy(err);
			stream.once("error", websocket.emit.bind(websocket, "error"));
			stream.once("close", websocket.emitClose.bind(websocket));
		}
	}
	/**
	* Handle cases where the `ping()`, `pong()`, or `send()` methods are called
	* when the `readyState` attribute is `CLOSING` or `CLOSED`.
	*
	* @param {WebSocket} websocket The WebSocket instance
	* @param {*} [data] The data to send
	* @param {Function} [cb] Callback
	* @private
	*/
	function sendAfterClose(websocket, data, cb) {
		if (data) {
			const length = toBuffer(data).length;
			if (websocket._socket) websocket._sender._bufferedBytes += length;
			else websocket._bufferedAmount += length;
		}
		if (cb) {
			const err = /* @__PURE__ */ new Error(`WebSocket is not open: readyState ${websocket.readyState} (${readyStates[websocket.readyState]})`);
			cb(err);
		}
	}
	/**
	* The listener of the `Receiver` `'conclude'` event.
	*
	* @param {Number} code The status code
	* @param {String} reason The reason for closing
	* @private
	*/
	function receiverOnConclude(code, reason) {
		const websocket = this[kWebSocket$1];
		websocket._closeFrameReceived = true;
		websocket._closeMessage = reason;
		websocket._closeCode = code;
		if (websocket._socket[kWebSocket$1] === void 0) return;
		websocket._socket.removeListener("data", socketOnData);
		process.nextTick(resume, websocket._socket);
		if (code === 1005) websocket.close();
		else websocket.close(code, reason);
	}
	/**
	* The listener of the `Receiver` `'drain'` event.
	*
	* @private
	*/
	function receiverOnDrain() {
		this[kWebSocket$1]._socket.resume();
	}
	/**
	* The listener of the `Receiver` `'error'` event.
	*
	* @param {(RangeError|Error)} err The emitted error
	* @private
	*/
	function receiverOnError(err) {
		const websocket = this[kWebSocket$1];
		if (websocket._socket[kWebSocket$1] !== void 0) {
			websocket._socket.removeListener("data", socketOnData);
			process.nextTick(resume, websocket._socket);
			websocket.close(err[kStatusCode]);
		}
		websocket.emit("error", err);
	}
	/**
	* The listener of the `Receiver` `'finish'` event.
	*
	* @private
	*/
	function receiverOnFinish() {
		this[kWebSocket$1].emitClose();
	}
	/**
	* The listener of the `Receiver` `'message'` event.
	*
	* @param {(String|Buffer|ArrayBuffer|Buffer[])} data The message
	* @private
	*/
	function receiverOnMessage(data) {
		this[kWebSocket$1].emit("message", data);
	}
	/**
	* The listener of the `Receiver` `'ping'` event.
	*
	* @param {Buffer} data The data included in the ping frame
	* @private
	*/
	function receiverOnPing(data) {
		const websocket = this[kWebSocket$1];
		websocket.pong(data, !websocket._isServer, NOOP);
		websocket.emit("ping", data);
	}
	/**
	* The listener of the `Receiver` `'pong'` event.
	*
	* @param {Buffer} data The data included in the pong frame
	* @private
	*/
	function receiverOnPong(data) {
		this[kWebSocket$1].emit("pong", data);
	}
	/**
	* Resume a readable stream
	*
	* @param {Readable} stream The readable stream
	* @private
	*/
	function resume(stream) {
		stream.resume();
	}
	/**
	* The listener of the `net.Socket` `'close'` event.
	*
	* @private
	*/
	function socketOnClose() {
		const websocket = this[kWebSocket$1];
		this.removeListener("close", socketOnClose);
		this.removeListener("data", socketOnData);
		this.removeListener("end", socketOnEnd);
		websocket._readyState = WebSocket$2.CLOSING;
		let chunk;
		if (!this._readableState.endEmitted && !websocket._closeFrameReceived && !websocket._receiver._writableState.errorEmitted && (chunk = websocket._socket.read()) !== null) websocket._receiver.write(chunk);
		websocket._receiver.end();
		this[kWebSocket$1] = void 0;
		clearTimeout(websocket._closeTimer);
		if (websocket._receiver._writableState.finished || websocket._receiver._writableState.errorEmitted) websocket.emitClose();
		else {
			websocket._receiver.on("error", receiverOnFinish);
			websocket._receiver.on("finish", receiverOnFinish);
		}
	}
	/**
	* The listener of the `net.Socket` `'data'` event.
	*
	* @param {Buffer} chunk A chunk of data
	* @private
	*/
	function socketOnData(chunk) {
		if (!this[kWebSocket$1]._receiver.write(chunk)) this.pause();
	}
	/**
	* The listener of the `net.Socket` `'end'` event.
	*
	* @private
	*/
	function socketOnEnd() {
		const websocket = this[kWebSocket$1];
		websocket._readyState = WebSocket$2.CLOSING;
		websocket._receiver.end();
		this.end();
	}
	/**
	* The listener of the `net.Socket` `'error'` event.
	*
	* @private
	*/
	function socketOnError$1() {
		const websocket = this[kWebSocket$1];
		this.removeListener("error", socketOnError$1);
		this.on("error", NOOP);
		if (websocket) {
			websocket._readyState = WebSocket$2.CLOSING;
			this.destroy();
		}
	}
}) });

//#endregion
//#region ../../node_modules/.pnpm/ws@7.5.10/node_modules/ws/lib/stream.js
var require_stream = /* @__PURE__ */ __commonJS({ "../../node_modules/.pnpm/ws@7.5.10/node_modules/ws/lib/stream.js": ((exports, module) => {
	const { Duplex } = __require("stream");
	/**
	* Emits the `'close'` event on a stream.
	*
	* @param {Duplex} stream The stream.
	* @private
	*/
	function emitClose$1(stream) {
		stream.emit("close");
	}
	/**
	* The listener of the `'end'` event.
	*
	* @private
	*/
	function duplexOnEnd() {
		if (!this.destroyed && this._writableState.finished) this.destroy();
	}
	/**
	* The listener of the `'error'` event.
	*
	* @param {Error} err The error
	* @private
	*/
	function duplexOnError(err) {
		this.removeListener("error", duplexOnError);
		this.destroy();
		if (this.listenerCount("error") === 0) this.emit("error", err);
	}
	/**
	* Wraps a `WebSocket` in a duplex stream.
	*
	* @param {WebSocket} ws The `WebSocket` to wrap
	* @param {Object} [options] The options for the `Duplex` constructor
	* @return {Duplex} The duplex stream
	* @public
	*/
	function createWebSocketStream(ws, options) {
		let resumeOnReceiverDrain = true;
		let terminateOnDestroy = true;
		function receiverOnDrain$1() {
			if (resumeOnReceiverDrain) ws._socket.resume();
		}
		if (ws.readyState === ws.CONNECTING) ws.once("open", function open() {
			ws._receiver.removeAllListeners("drain");
			ws._receiver.on("drain", receiverOnDrain$1);
		});
		else {
			ws._receiver.removeAllListeners("drain");
			ws._receiver.on("drain", receiverOnDrain$1);
		}
		const duplex = new Duplex({
			...options,
			autoDestroy: false,
			emitClose: false,
			objectMode: false,
			writableObjectMode: false
		});
		ws.on("message", function message(msg) {
			if (!duplex.push(msg)) {
				resumeOnReceiverDrain = false;
				ws._socket.pause();
			}
		});
		ws.once("error", function error$1(err) {
			if (duplex.destroyed) return;
			terminateOnDestroy = false;
			duplex.destroy(err);
		});
		ws.once("close", function close() {
			if (duplex.destroyed) return;
			duplex.push(null);
		});
		duplex._destroy = function(err, callback) {
			if (ws.readyState === ws.CLOSED) {
				callback(err);
				process.nextTick(emitClose$1, duplex);
				return;
			}
			let called = false;
			ws.once("error", function error$1(err$1) {
				called = true;
				callback(err$1);
			});
			ws.once("close", function close() {
				if (!called) callback(err);
				process.nextTick(emitClose$1, duplex);
			});
			if (terminateOnDestroy) ws.terminate();
		};
		duplex._final = function(callback) {
			if (ws.readyState === ws.CONNECTING) {
				ws.once("open", function open() {
					duplex._final(callback);
				});
				return;
			}
			if (ws._socket === null) return;
			if (ws._socket._writableState.finished) {
				callback();
				if (duplex._readableState.endEmitted) duplex.destroy();
			} else {
				ws._socket.once("finish", function finish() {
					callback();
				});
				ws.close();
			}
		};
		duplex._read = function() {
			if ((ws.readyState === ws.OPEN || ws.readyState === ws.CLOSING) && !resumeOnReceiverDrain) {
				resumeOnReceiverDrain = true;
				if (!ws._receiver._writableState.needDrain) ws._socket.resume();
			}
		};
		duplex._write = function(chunk, encoding, callback) {
			if (ws.readyState === ws.CONNECTING) {
				ws.once("open", function open() {
					duplex._write(chunk, encoding, callback);
				});
				return;
			}
			ws.send(chunk, callback);
		};
		duplex.on("end", duplexOnEnd);
		duplex.on("error", duplexOnError);
		return duplex;
	}
	module.exports = createWebSocketStream;
}) });

//#endregion
//#region ../../node_modules/.pnpm/ws@7.5.10/node_modules/ws/lib/websocket-server.js
var require_websocket_server = /* @__PURE__ */ __commonJS({ "../../node_modules/.pnpm/ws@7.5.10/node_modules/ws/lib/websocket-server.js": ((exports, module) => {
	const EventEmitter = __require("events");
	const http = __require("http");
	__require("https");
	__require("net");
	__require("tls");
	const { createHash } = __require("crypto");
	const PerMessageDeflate = require_permessage_deflate();
	const WebSocket$1 = require_websocket();
	const { format, parse } = require_extension();
	const { GUID, kWebSocket } = require_constants();
	const keyRegex = /^[+/0-9A-Za-z]{22}==$/;
	const RUNNING = 0;
	const CLOSING = 1;
	const CLOSED = 2;
	/**
	* Class representing a WebSocket server.
	*
	* @extends EventEmitter
	*/
	var WebSocketServer = class extends EventEmitter {
		/**
		* Create a `WebSocketServer` instance.
		*
		* @param {Object} options Configuration options
		* @param {Number} [options.backlog=511] The maximum length of the queue of
		*     pending connections
		* @param {Boolean} [options.clientTracking=true] Specifies whether or not to
		*     track clients
		* @param {Function} [options.handleProtocols] A hook to handle protocols
		* @param {String} [options.host] The hostname where to bind the server
		* @param {Number} [options.maxPayload=104857600] The maximum allowed message
		*     size
		* @param {Boolean} [options.noServer=false] Enable no server mode
		* @param {String} [options.path] Accept only connections matching this path
		* @param {(Boolean|Object)} [options.perMessageDeflate=false] Enable/disable
		*     permessage-deflate
		* @param {Number} [options.port] The port where to bind the server
		* @param {(http.Server|https.Server)} [options.server] A pre-created HTTP/S
		*     server to use
		* @param {Function} [options.verifyClient] A hook to reject connections
		* @param {Function} [callback] A listener for the `listening` event
		*/
		constructor(options, callback) {
			super();
			options = {
				maxPayload: 100 * 1024 * 1024,
				perMessageDeflate: false,
				handleProtocols: null,
				clientTracking: true,
				verifyClient: null,
				noServer: false,
				backlog: null,
				server: null,
				host: null,
				path: null,
				port: null,
				...options
			};
			if (options.port == null && !options.server && !options.noServer || options.port != null && (options.server || options.noServer) || options.server && options.noServer) throw new TypeError("One and only one of the \"port\", \"server\", or \"noServer\" options must be specified");
			if (options.port != null) {
				this._server = http.createServer((req, res) => {
					const body = http.STATUS_CODES[426];
					res.writeHead(426, {
						"Content-Length": body.length,
						"Content-Type": "text/plain"
					});
					res.end(body);
				});
				this._server.listen(options.port, options.host, options.backlog, callback);
			} else if (options.server) this._server = options.server;
			if (this._server) {
				const emitConnection = this.emit.bind(this, "connection");
				this._removeListeners = addListeners(this._server, {
					listening: this.emit.bind(this, "listening"),
					error: this.emit.bind(this, "error"),
					upgrade: (req, socket, head) => {
						this.handleUpgrade(req, socket, head, emitConnection);
					}
				});
			}
			if (options.perMessageDeflate === true) options.perMessageDeflate = {};
			if (options.clientTracking) this.clients = /* @__PURE__ */ new Set();
			this.options = options;
			this._state = RUNNING;
		}
		/**
		* Returns the bound address, the address family name, and port of the server
		* as reported by the operating system if listening on an IP socket.
		* If the server is listening on a pipe or UNIX domain socket, the name is
		* returned as a string.
		*
		* @return {(Object|String|null)} The address of the server
		* @public
		*/
		address() {
			if (this.options.noServer) throw new Error("The server is operating in \"noServer\" mode");
			if (!this._server) return null;
			return this._server.address();
		}
		/**
		* Close the server.
		*
		* @param {Function} [cb] Callback
		* @public
		*/
		close(cb) {
			if (cb) this.once("close", cb);
			if (this._state === CLOSED) {
				process.nextTick(emitClose, this);
				return;
			}
			if (this._state === CLOSING) return;
			this._state = CLOSING;
			if (this.clients) for (const client of this.clients) client.terminate();
			const server = this._server;
			if (server) {
				this._removeListeners();
				this._removeListeners = this._server = null;
				if (this.options.port != null) {
					server.close(emitClose.bind(void 0, this));
					return;
				}
			}
			process.nextTick(emitClose, this);
		}
		/**
		* See if a given request should be handled by this server instance.
		*
		* @param {http.IncomingMessage} req Request object to inspect
		* @return {Boolean} `true` if the request is valid, else `false`
		* @public
		*/
		shouldHandle(req) {
			if (this.options.path) {
				const index = req.url.indexOf("?");
				const pathname = index !== -1 ? req.url.slice(0, index) : req.url;
				if (pathname !== this.options.path) return false;
			}
			return true;
		}
		/**
		* Handle a HTTP Upgrade request.
		*
		* @param {http.IncomingMessage} req The request object
		* @param {(net.Socket|tls.Socket)} socket The network socket between the
		*     server and client
		* @param {Buffer} head The first packet of the upgraded stream
		* @param {Function} cb Callback
		* @public
		*/
		handleUpgrade(req, socket, head, cb) {
			socket.on("error", socketOnError);
			const key = req.headers["sec-websocket-key"] !== void 0 ? req.headers["sec-websocket-key"].trim() : false;
			const upgrade = req.headers.upgrade;
			const version = +req.headers["sec-websocket-version"];
			const extensions = {};
			if (req.method !== "GET" || upgrade === void 0 || upgrade.toLowerCase() !== "websocket" || !key || !keyRegex.test(key) || version !== 8 && version !== 13 || !this.shouldHandle(req)) return abortHandshake(socket, 400);
			if (this.options.perMessageDeflate) {
				const perMessageDeflate = new PerMessageDeflate(this.options.perMessageDeflate, true, this.options.maxPayload);
				try {
					const offers = parse(req.headers["sec-websocket-extensions"]);
					if (offers[PerMessageDeflate.extensionName]) {
						perMessageDeflate.accept(offers[PerMessageDeflate.extensionName]);
						extensions[PerMessageDeflate.extensionName] = perMessageDeflate;
					}
				} catch (err) {
					return abortHandshake(socket, 400);
				}
			}
			if (this.options.verifyClient) {
				const info = {
					origin: req.headers[`${version === 8 ? "sec-websocket-origin" : "origin"}`],
					secure: !!(req.socket.authorized || req.socket.encrypted),
					req
				};
				if (this.options.verifyClient.length === 2) {
					this.options.verifyClient(info, (verified, code, message, headers) => {
						if (!verified) return abortHandshake(socket, code || 401, message, headers);
						this.completeUpgrade(key, extensions, req, socket, head, cb);
					});
					return;
				}
				if (!this.options.verifyClient(info)) return abortHandshake(socket, 401);
			}
			this.completeUpgrade(key, extensions, req, socket, head, cb);
		}
		/**
		* Upgrade the connection to WebSocket.
		*
		* @param {String} key The value of the `Sec-WebSocket-Key` header
		* @param {Object} extensions The accepted extensions
		* @param {http.IncomingMessage} req The request object
		* @param {(net.Socket|tls.Socket)} socket The network socket between the
		*     server and client
		* @param {Buffer} head The first packet of the upgraded stream
		* @param {Function} cb Callback
		* @throws {Error} If called more than once with the same socket
		* @private
		*/
		completeUpgrade(key, extensions, req, socket, head, cb) {
			if (!socket.readable || !socket.writable) return socket.destroy();
			if (socket[kWebSocket]) throw new Error("server.handleUpgrade() was called more than once with the same socket, possibly due to a misconfiguration");
			if (this._state > RUNNING) return abortHandshake(socket, 503);
			const digest = createHash("sha1").update(key + GUID).digest("base64");
			const headers = [
				"HTTP/1.1 101 Switching Protocols",
				"Upgrade: websocket",
				"Connection: Upgrade",
				`Sec-WebSocket-Accept: ${digest}`
			];
			const ws = new WebSocket$1(null);
			let protocol = req.headers["sec-websocket-protocol"];
			if (protocol) {
				protocol = protocol.split(",").map(trim);
				if (this.options.handleProtocols) protocol = this.options.handleProtocols(protocol, req);
				else protocol = protocol[0];
				if (protocol) {
					headers.push(`Sec-WebSocket-Protocol: ${protocol}`);
					ws._protocol = protocol;
				}
			}
			if (extensions[PerMessageDeflate.extensionName]) {
				const params = extensions[PerMessageDeflate.extensionName].params;
				const value = format({ [PerMessageDeflate.extensionName]: [params] });
				headers.push(`Sec-WebSocket-Extensions: ${value}`);
				ws._extensions = extensions;
			}
			this.emit("headers", headers, req);
			socket.write(headers.concat("\r\n").join("\r\n"));
			socket.removeListener("error", socketOnError);
			ws.setSocket(socket, head, this.options.maxPayload);
			if (this.clients) {
				this.clients.add(ws);
				ws.on("close", () => this.clients.delete(ws));
			}
			cb(ws, req);
		}
	};
	module.exports = WebSocketServer;
	/**
	* Add event listeners on an `EventEmitter` using a map of <event, listener>
	* pairs.
	*
	* @param {EventEmitter} server The event emitter
	* @param {Object.<String, Function>} map The listeners to add
	* @return {Function} A function that will remove the added listeners when
	*     called
	* @private
	*/
	function addListeners(server, map) {
		for (const event of Object.keys(map)) server.on(event, map[event]);
		return function removeListeners() {
			for (const event of Object.keys(map)) server.removeListener(event, map[event]);
		};
	}
	/**
	* Emit a `'close'` event on an `EventEmitter`.
	*
	* @param {EventEmitter} server The event emitter
	* @private
	*/
	function emitClose(server) {
		server._state = CLOSED;
		server.emit("close");
	}
	/**
	* Handle premature socket errors.
	*
	* @private
	*/
	function socketOnError() {
		this.destroy();
	}
	/**
	* Close the connection when preconditions are not fulfilled.
	*
	* @param {(net.Socket|tls.Socket)} socket The socket of the upgrade request
	* @param {Number} code The HTTP response status code
	* @param {String} [message] The HTTP response body
	* @param {Object} [headers] Additional HTTP response headers
	* @private
	*/
	function abortHandshake(socket, code, message, headers) {
		if (socket.writable) {
			message = message || http.STATUS_CODES[code];
			headers = {
				Connection: "close",
				"Content-Type": "text/html",
				"Content-Length": Buffer.byteLength(message),
				...headers
			};
			socket.write(`HTTP/1.1 ${code} ${http.STATUS_CODES[code]}\r\n` + Object.keys(headers).map((h) => `${h}: ${headers[h]}`).join("\r\n") + "\r\n\r\n" + message);
		}
		socket.removeListener("error", socketOnError);
		socket.destroy();
	}
	/**
	* Remove whitespace characters from both ends of a string.
	*
	* @param {String} str The string
	* @return {String} A new string representing `str` stripped of whitespace
	*     characters from both its beginning and end
	* @private
	*/
	function trim(str) {
		return str.trim();
	}
}) });

//#endregion
//#region ../../node_modules/.pnpm/ws@7.5.10/node_modules/ws/index.js
var require_ws = /* @__PURE__ */ __commonJS({ "../../node_modules/.pnpm/ws@7.5.10/node_modules/ws/index.js": ((exports, module) => {
	const WebSocket = require_websocket();
	WebSocket.createWebSocketStream = require_stream();
	WebSocket.Server = require_websocket_server();
	WebSocket.Receiver = require_receiver();
	WebSocket.Sender = require_sender();
	module.exports = WebSocket;
}) });

//#endregion
export default require_ws();

export {  };
//# sourceMappingURL=ws-KaymRKVG.mjs.map
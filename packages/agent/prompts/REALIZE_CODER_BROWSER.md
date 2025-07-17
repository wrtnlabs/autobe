## 🔐 Browser-Compatible Native-First Rule

You must implement all functionality using **only browser-compatible native features** whenever possible.  
All logic must assume it will run in a browser environment — even if Node.js is also supported.

> 🚫 Do **not** use Node.js-only modules like `'crypto'`, `'fs'`, `'path'`, etc.
> ✅ Always use **Web-standard, browser-safe APIs**.

---

### ✅ Encryption Rule

All encryption and decryption must be implemented using the **Web Crypto API (`window.crypto.subtle`)**.

**❌ Do not use:**
- `crypto` (Node.js built-in)
- `crypto-js`, `bcrypt`, `libsodium`, or any other third-party crypto libraries

**✅ Only use:**
- `window.crypto.subtle` and `window.crypto.getRandomValues`

```ts
// Example: AES-GCM encryption in the browser
const key = await crypto.subtle.generateKey(
  { name: 'AES-GCM', length: 256 },
  true,
  ['encrypt', 'decrypt']
);

const iv = crypto.getRandomValues(new Uint8Array(12));

const encoded = new TextEncoder().encode('hello world');
const encrypted = await crypto.subtle.encrypt(
  { name: 'AES-GCM', iv },
  key,
  encoded
);
````

---

### ✅ General API Rule

You must avoid Node.js-specific or third-party libraries. All implementations must be fully functional in **browser environments**, using **web-standard APIs** only.

| Use Case        | ❌ Do Not Use (Node.js / External)                 | ✅ Use Instead (Browser-safe)               |
| --------------- | ------------------------------------------------- | ------------------------------------------ |
| UUID Generation | `uuid` package, `crypto.randomUUID()` (Node only) | `crypto.randomUUID()` (browser supported)  |
| HTTP Requests   | `axios`, `node-fetch`                             | `fetch`                                    |
| Timing / Delay  | `sleep-promise`, `delay`                          | `setTimeout`, `await new Promise(...)`     |
| Hashing         | `crypto.createHash()` (Node.js)                   | `crypto.subtle.digest()`                   |
| Compression     | `zlib`, `adm-zip`, `archiver`                     | `CompressionStream`, `DecompressionStream` |
| File Handling   | `fs`, `fs-extra`                                  | `File`, `Blob`, `FileReader`, `Streams`    |

---

### 🧷 Summary

* ✅ Use only APIs that work natively in **browsers**.
* 🚫 Do not use Node.js-only modules or platform-specific packages.
* ❌ Avoid third-party libraries unless there's **no equivalent** browser-native solution.
* 🧭 If your logic must run both in Node.js and the browser, **the browser must always be the lowest common denominator**—ensure everything works in the browser first.

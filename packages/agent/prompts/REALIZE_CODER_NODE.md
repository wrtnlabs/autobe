## 🔐 System Prompt – Built-in Node.js Only Rule

You must implement all functionality using **only Node.js's built-in modules whenever possible**.
Avoid using external libraries for tasks that can be accomplished using Node.js's native APIs.

---

### ✅ Encryption Rule

All encryption and decryption logic must be implemented strictly using Node.js's built-in `'crypto'` module.

**❌ Do not** import or use any external cryptographic libraries such as `crypto-js`, `bcrypt`, `libsodium`, etc.
**✅ Do only** use the native Node.js `'crypto'` API as demonstrated below:

```ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const key = randomBytes(32); // 256-bit key
const iv = randomBytes(12);  // GCM recommended IV size

function encrypt(plainText: string) {
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return { encrypted, iv, authTag };
}

function decrypt(encrypted: Buffer, iv: Buffer, authTag: Buffer) {
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}
```

---

### ✅ General Import Rule

Whenever a task can be achieved using **Node.js built-in modules**, you must prefer those over third-party packages.

For example:

| Use Case                     | ❌ Do Not Use               | ✅ Use Instead                       |
| ---------------------------- | -------------------------- | ----------------------------------- |
| UUID Generation              | `uuid` package             | `crypto.randomUUID()`               |
| File Handling                | `fs-extra`, `rimraf`, etc. | `fs`, `fs/promises`, `path`         |
| HTTP Requests (simple cases) | `axios`, `node-fetch`      | `http`, `https`, `fetch` (Node 18+) |
| Timing / Delays              | `sleep-promise`            | `setTimeout`, `Timers/promises`     |
| Compression                  | `archiver`, `adm-zip`      | `zlib`, `zlib/promises`             |
| Hashing                      | `md5`, `sha.js`            | `crypto.createHash()`               |

---

### 🧷 Summary

* ✅ Use native Node.js modules like `crypto`, `fs`, `http`, `zlib`, `path`, etc.
* ❌ Avoid external libraries unless **absolutely necessary** and there is **no built-in alternative**.
* 🛡️ Especially for **encryption, UUID, hashing, and randomness**, always rely on Node.js’s standard library.


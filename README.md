# seven-bit-ascii-tools

Encodes arbitrary bytes into a lowercase hex string made only of characters in the 7-bit ASCII range, so the result can pass through legacy transports that reject bytes with the high bit set.

```js
import { encode, decode, encodeToHex, decodeFromHex } from './src/index.js';

const bytes = new Uint8Array([0x00, 0x7f, 0x80, 0xff]);
const text = encode(bytes);          // '007f80ff'
const back = decode(text);           // Uint8Array [0, 127, 128, 255]

const withPrefix = encodeToHex(bytes);   // '0x007f80ff'
const alsoBack = decodeFromHex(withPrefix);
```

## Why this exists

Some SMTP relays, serial links, and mainframe channels drop or mangle bytes above 0x7F. A reversible encoding into plain ASCII solves that without requiring a full MIME or base64 implementation. The trade-off is size: hex doubles the payload, and unlike base64 it has no padding rules or line-length limits to get wrong. For a narrow compatibility layer that is usually the right call.

## The awkward edge

The output is text, not bytes. If your transport also interprets control characters, newlines, or whitespace, a hex string is still safe because we only emit `0-9` and `a-f`. But if you need the encoded form to be *bytes* in 0x00..0x7F rather than a JS string, decode the hex with `decode` and send the resulting `Uint8Array`. We also reject odd-length and non-hex input rather than skipping bad characters, so corruption on the wire surfaces as an error instead of silently changing the payload.

## API

- `encode(bytes)` → lowercase hex string. Accepts any iterable of integers 0..255.
- `decode(text)` → `Uint8Array`. Requires even length and only hex digits (case-insensitive).
- `encodeToHex(bytes)` → string prefixed with `0x`.
- `decodeFromHex(text)` → `Uint8Array`. Accepts an optional `0x` or `0X` prefix.

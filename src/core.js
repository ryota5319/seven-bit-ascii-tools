
/**
 * Seven-bit ASCII encoding utilities.
 *
 * The problem: legacy transports (some SMTP relays, old serial links, certain
 * mainframe channels) reject bytes with the high bit set. We need a reversible
 * transformation that turns arbitrary bytes into a stream of characters in the
 * range 0x00..0x7F, without relying on any external codec.
 *
 * Trade-off: we use a simple nibble-hex encoding rather than a space-efficient
 * scheme like base64 or quoted-printable. Hex doubles the size, but it is
 * trivial to implement, trivially reversible, and has no padding or line-length
 * edge cases. For strict 7-bit safety that is often the right call.
 *
 * Edge case the reader will hit: the output is itself ASCII text, so if you
 * feed it through a transport that interprets control characters or newlines
 * you may still have trouble. We emit only the characters 0-9 and a-f, so the
 * result is printable ASCII and safe for text-oriented channels. If you need
 * binary-safe seven-bit output (bytes 0x00..0x7F including NUL), decode the
 * hex string back to bytes and use that.
 */

const HEX = '0123456789abcdef';

/**
 * Encode an array of bytes (or any iterable of integers) into a lowercase hex
 * string. Each byte becomes exactly two characters in 0-9a-f, so the result is
 * always valid 7-bit ASCII and safe for legacy text transports.
 *
 * @param {Iterable<number>} bytes - source bytes, each 0..255
 * @returns {string} lowercase hex representation
 * @throws {TypeError} if a value is not an integer in 0..255
 */
export function encode(bytes) {
  if (bytes == null) {
    throw new TypeError('encode requires an iterable of bytes');
  }
  let out = '';
  for (const value of bytes) {
    if (!Number.isInteger(value) || value < 0 || value > 255) {
      throw new TypeError(`byte out of range: ${value}`);
    }
    out += HEX[value >> 4] + HEX[value & 0x0f];
  }
  return out;
}

/**
 * Decode a hex string produced by {@link encode} back into a Uint8Array.
 *
 * We require an even number of hex digits and reject anything outside the
 * 0-9a-f alphabet (case-insensitive). This strictness is deliberate: silently
 * skipping bad characters would make corruption invisible on a lossy channel.
 *
 * @param {string} text - hex string, even length
 * @returns {Uint8Array} decoded bytes
 * @throws {TypeError} if input is not a string or has odd length
 * @throws {SyntaxError} if input contains non-hex characters
 */
export function decode(text) {
  if (typeof text !== 'string') {
    throw new TypeError('decode requires a string');
  }
  if (text.length % 2 !== 0) {
    throw new TypeError('hex string must have even length');
  }
  const out = new Uint8Array(text.length / 2);
  for (let i = 0; i < out.length; i++) {
    const hi = nibble(text.charCodeAt(i * 2));
    const lo = nibble(text.charCodeAt(i * 2 + 1));
    out[i] = (hi << 4) | lo;
  }
  return out;
}

function nibble(code) {
  if (code >= 48 && code <= 57) return code - 48; // '0'..'9'
  if (code >= 97 && code <= 102) return code - 87; // 'a'..'f'
  if (code >= 65 && code <= 70) return code - 55; // 'A'..'F'
  throw new SyntaxError(`invalid hex character: ${String.fromCharCode(code)}`);
}

/**
 * Convenience wrapper: encode bytes and return a string prefixed with
 * '0x'. Useful for logging and for transports that expect a hex literal.
 *
 * @param {Iterable<number>} bytes
 * @returns {string}
 */
export function encodeToHex(bytes) {
  return '0x' + encode(bytes);
}

/**
 * Inverse of {@link encodeToHex}: accepts an optional '0x' prefix.
 *
 * @param {string} text
 * @returns {Uint8Array}
 */
export function decodeFromHex(text) {
  if (typeof text !== 'string') {
    throw new TypeError('decodeFromHex requires a string');
  }
  const body = text.startsWith('0x') || text.startsWith('0X') ? text.slice(2) : text;
  return decode(body);
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { encode, decode, encodeToHex, decodeFromHex } from '../src/core.js';

test('encode produces lowercase hex', () => {
  assert.equal(encode([0x00, 0x0f, 0x10, 0xff]), '000f10ff');
});

test('encode accepts any iterable of bytes', () => {
  assert.equal(encode(new Uint8Array([0xde, 0xad, 0xbe, 0xef])), 'deadbeef');
  assert.equal(encode(new Set([0x01, 0x02])), '0102');
});

test('encode rejects out-of-range values', () => {
  assert.throws(() => encode([256]), TypeError);
  assert.throws(() => encode([-1]), TypeError);
  assert.throws(() => encode([1.5]), TypeError);
  assert.throws(() => encode(['a']), TypeError);
});

test('encode rejects null and undefined', () => {
  assert.throws(() => encode(null), TypeError);
  assert.throws(() => encode(undefined), TypeError);
});

test('decode reverses encode', () => {
  const original = [0, 1, 127, 128, 254, 255];
  const encoded = encode(original);
  const decoded = decode(encoded);
  assert.deepEqual(Array.from(decoded), original);
});

test('decode is case-insensitive', () => {
  assert.deepEqual(Array.from(decode('DEADBEEF')), [0xde, 0xad, 0xbe, 0xef]);
  assert.deepEqual(Array.from(decode('DeadBeef')), [0xde, 0xad, 0xbe, 0xef]);
});

test('decode rejects odd-length input', () => {
  assert.throws(() => decode('abc'), TypeError);
});

test('decode rejects non-hex characters', () => {
  assert.throws(() => decode('zz'), SyntaxError);
  assert.throws(() => decode('0g'), SyntaxError);
  assert.throws(() => decode('  '), SyntaxError);
});

test('decode rejects non-string input', () => {
  assert.throws(() => decode(123), TypeError);
  assert.throws(() => decode(null), TypeError);
});

test('empty input round-trips', () => {
  assert.equal(encode([]), '');
  assert.deepEqual(Array.from(decode('')), []);
});

test('encodeToHex adds 0x prefix', () => {
  assert.equal(encodeToHex([0xca, 0xfe]), '0xcafe');
});

test('decodeFromHex accepts optional 0x prefix', () => {
  assert.deepEqual(Array.from(decodeFromHex('0xcafe')), [0xca, 0xfe]);
  assert.deepEqual(Array.from(decodeFromHex('CAFE')), [0xca, 0xfe]);
  assert.deepEqual(Array.from(decodeFromHex('0XCAFE')), [0xca, 0xfe]);
});

test('decodeFromHex rejects non-string input', () => {
  assert.throws(() => decodeFromHex(42), TypeError);
});

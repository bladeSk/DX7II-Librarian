/**
 * Converts hexadecimal string into an Uint8Array. Supported formats:
 * • 'DE AD BE EF'
 * • 'DEAFBEEF'
 */
export function hex2bin(hexStr: string): Uint8Array {
  return new Uint8Array(hexStr.match(/([\da-f]{2}) ?/gi)?.map(b => parseInt(b, 16)) || [])
}

/**
 * Returns if two Uint8Arrays are equal.
 */
export function uint8ArraysEqual(a1: Uint8Array, a2: Uint8Array): boolean {
  if (a1.length != a2.length) return false

  for (let i = 0; i < a1.length; i++) {
    if (a1[i] != a2[i]) return false
  }

  return true
}

/**
 * Merges an array of Uint8Arrays into a single Uint8Array.
 * Like a "StringBuilder" for small chunks of binary data.
 */
export function mergeUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  let length = arrays.reduce((sum, arr) => sum + arr.length, 0)
  let result = new Uint8Array(length)

  arrays.reduce((offset, arr) => {
    result.set(arr, offset)
    return offset + arr.length
  }, 0)

  return result
}

/**
 * Calculates checksum of (a part of) MIDI data in Roland/Yamaha format.
 */
export function calcChecksum(bytes: Uint8Array, offset: number = 0, endOffset?: number) {
  if (endOffset === undefined) endOffset = bytes.length
  if (endOffset < 0) endOffset = bytes.length + endOffset

  let sum = 0
  for (let i = offset; i < endOffset; i++) sum += bytes[i]

  return (0x80 - sum % 0x80) % 0x80
}

export function cut(buf: Uint8Array, start: number, length: number): Uint8Array {
  return buf.slice(start, start + length)
}

export function dataMatches(needle: Uint8Array, haystack: Uint8Array, haystackOffset: number = 0): boolean {
  return uint8ArraysEqual(cut(haystack, haystackOffset, needle.length), needle)
}

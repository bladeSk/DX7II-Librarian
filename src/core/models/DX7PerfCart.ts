import { calcChecksum, hex2bin, mergeUint8Arrays as mergeUint8Arrays, uint8ArraysEqual } from 'core/utils/binUtils'
import { DX7Performance } from './DX7Performance'

/**
 * A collection of DX7II performances. Parses SysEx into performances, if possible.
 */
export class DX7PerfCart {
  perfs: DX7Performance[]

  private constructor() {
    this.perfs = Array(32)
  }

  static createEmpty(): DX7PerfCart {
    let cart = new DX7PerfCart()

    for (let i = 0; i < 32; i++) {
      cart.perfs[i] = new DX7Performance()
    }

    return cart
  }

  static createFromSyx(data: Uint8Array): DX7PerfCart | undefined {
    if (data.length != 1650) return undefined
    if (!dataMatches(PERF_HEADER, data, 0)) return undefined

    let cart = new DX7PerfCart()

    for (let i = 0; i < 32; i++) {
      cart.perfs[i] = new DX7Performance(cut(data, PERF_HEADER.length + 51 * i, 51))
    }

    return cart
  }

  clone(): DX7PerfCart {
    let cart = new DX7PerfCart()
    cart.perfs = this.perfs.slice(0)
    return cart
  }

  insertPerfAt(newPerf: DX7Performance, index: number): DX7PerfCart {
    if (this.perfs.includes(newPerf)) { // just move the sound within the cart
      let oldPerf = newPerf
      newPerf = oldPerf.clone()

      this.perfs = this.perfs.slice(0, index).concat(newPerf, this.perfs.slice(index))
        .filter(v => v != oldPerf)
    } else { // insert and discard the last sound
      this.perfs = this.perfs.slice(0, index).concat(newPerf.clone(), this.perfs.slice(index, 31))
    }

    return this
  }

  replacePerfAt(newPerf: DX7Performance, index: number): DX7PerfCart {
    this.perfs = this.perfs.map((perf, i) => {
      return index === i ? newPerf.clone() : perf
    })

    return this
  }

  replacePerf(oldPerf: DX7Performance, newPerf: DX7Performance): DX7PerfCart {
    this.perfs = this.perfs.map((perf) => {
      return perf == oldPerf ? newPerf : perf
    })

    return this
  }

  buildCart(): Uint8Array {
    let dataArr = this.perfs.map(perf => perf.perfData)
    dataArr.unshift(PERF_HEADER)
    dataArr.push(new Uint8Array([ 0 /* checksum placeholder */, 0xF7 /* end of sysex block */ ]))

    let perfData = mergeUint8Arrays(dataArr)
    perfData[perfData.length - 2] = calcChecksum(perfData, PERF_HEADER.length, -2)
    return perfData
  }
}

function cut(buf: Uint8Array, start: number, length: number): Uint8Array {
  return buf.slice(start, start + length)
}

function dataMatches(needle: Uint8Array, haystack: Uint8Array, haystackOffset: number): boolean {
  return uint8ArraysEqual(cut(haystack, haystackOffset, needle.length), needle)
}

const PERF_HEADER = hex2bin('F0 43 00 7E 0C 6A 4C 4D 20 20 38 39 37 33 50 4D')

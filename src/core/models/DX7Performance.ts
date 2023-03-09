import { hex2bin } from 'core/utils/binUtils'

/**
 * Represents a DX7II performance.
 */
export class DX7Performance {
  public perfData: Uint8Array

  constructor(
    perfData?: Uint8Array,
  ) {
    this.perfData = perfData || DEFAULT_PERF.slice(0)

    if (this.perfData.length != DEFAULT_PERF.length) throw new Error('Incorrect PERF length')
  }

  clone(): DX7Performance {
    return new DX7Performance(this.perfData.slice(0))
  }

  resetToInitVoice() {
    this.perfData = DEFAULT_PERF.slice(0)
  }

  get name(): string {
    return String.fromCharCode.apply(null, this.perfData.slice(DEFAULT_PERF.length - 20) as any).trimEnd()
  }

  set name(val: string) {
    let c: number
    for (let i = 0; i < 20; i++) {
      c = val.charCodeAt(i) || 0
      this.perfData[DEFAULT_PERF.length - 20 + i] = c < 32 || c >= 127 ? 32 : c
    }
  }

  get mode(): perfMode {
    let data = this.perfData[0]

    if (data == 2) return 'split'
    if (data == 1) return 'dual'
    return 'single'
  }

  set mode(val: perfMode) {
    if (val == 'split') {
      this.perfData[0] = 2
    } else if (val == 'dual') {
      this.perfData[0] = 1
    } else {
      this.perfData[0] = 0
    }
  }

  get voiceA(): [voiceLocation, number] {
    let data = this.perfData[1]
    return [ data > 63 ? 'cart' : 'int', data % 64 + 1 ]
  }

  set voiceA(val: [voiceLocation, number]) {
    this.perfData[1] = val[1] - 1 + 64 * (val[0] == 'cart' ? 1 : 0)
  }

  get voiceB(): [voiceLocation, number] {
    let data = this.perfData[2]
    return [ data > 63 ? 'cart' : 'int', data % 64 + 1 ]
  }

  set voiceB(val: [voiceLocation, number]) {
    this.perfData[2] = val[1] - 1 + 64 * (val[0] == 'cart' ? 1 : 0)
  }

  get splitPoint(): number {
    return this.perfData[7]
  }

  set splitPoint(val: number) {
    this.perfData[7] = Math.min(127, Math.max(0, val))
  }
}

export type voiceLocation = 'int' | 'cart'
export type perfMode = 'single' | 'dual' | 'split'

const DEFAULT_PERF = hex2bin('01 00 00 00 00 00 00 3C 00 03 01 03 00 18 18 32 63 00 00 00 01 00 00 63 63 63 63 32 32 32 32 49 4E 49 54 20 50 45 52 46 20 20 20 20 20 20 20 20 20 20 20')

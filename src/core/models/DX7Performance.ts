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

  rename(name: string) {
    for (let i = 0; i < 20; i++) {
      this.perfData[DEFAULT_PERF.length - 20] = Math.min(127, name.charCodeAt(i) || 32)
    }
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
}

const DEFAULT_PERF = hex2bin('01 00 00 00 00 00 00 3C 00 03 01 03 00 18 18 32 63 00 00 00 01 00 00 63 63 63 63 32 32 32 32 49 4E 49 54 20 50 45 52 46 20 20 20 20 20 20 20 20 20 20 20')

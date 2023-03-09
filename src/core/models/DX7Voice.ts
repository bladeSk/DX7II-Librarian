import { hex2bin, uint8ArraysEqual } from 'core/utils/binUtils'

/**
 * Represents a DX7/DX7II voice.
 */
export class DX7Voice {
  /** Voice memory in the bulk export format */
  public vmemData: Uint8Array
  /** Supplementary voice memory in the bulk export format */
  public amemData: Uint8Array
  /** Voice fractional key-scaling memory in the bulk export format */
  public fksData: Uint8Array

  constructor(
    vmemData?: Uint8Array,
    amemData?: Uint8Array,
    fksData?: Uint8Array,
  ) {
    this.vmemData = vmemData || DEFAULT_VMEM.slice(0)
    this.amemData = amemData || DEFAULT_AMEM.slice(0)
    this.fksData = fksData || DEFAULT_FKS.slice(0)

    if (this.vmemData.length != DEFAULT_VMEM.length) throw new Error('Incorrect VMEM length')
    if (this.amemData.length != DEFAULT_AMEM.length) throw new Error('Incorrect AMEM length')
    if (this.fksData.length != DEFAULT_FKS.length) throw new Error('Incorrect FKS length')
  }

  clone(): DX7Voice {
    return new DX7Voice(this.vmemData.slice(0), this.amemData.slice(0), this.fksData.slice(0))
  }

  resetToInitVoice() {
    this.vmemData = DEFAULT_VMEM.slice(0)
    this.amemData = DEFAULT_AMEM.slice(0)
    this.fksData = DEFAULT_FKS.slice(0)
  }

  get name(): string {
    return String.fromCharCode.apply(null, this.vmemData.slice(118) as any).trimEnd()
  }

  set name(val: string) {
    let c: number
    for (let i = 0; i < 10; i++) {
      c = val.charCodeAt(i) || 0
      this.vmemData[118 + i] = c < 32 || c >= 127 ? 32 : c
    }
  }

  get version(): 1 | 2 {
    return uint8ArraysEqual(this.amemData, DEFAULT_AMEM) ? 1 : 2
  }

  get dx7iiFeatures(): string[] {
    let am = this.amemData
    let fks = am[0]
    let ams = am[1] || am[2] || am[3]
    let rndp = (am[4] & 0b1110000) >> 4
    let vpsw = (am[4] & 0b0001000) >> 3
    let ltrg = (am[4] & 0b0000100) >> 2
    let pegr = am[4] & 0b0000011
    let mono = am[5] & 0b0000001
    let unison = (am[5] & 0b0000010) >> 1
    let pitchBend = ((am[5] & 0b1111100) >> 2 != 0b0000010) || am[6]
    let portamento = am[7] || am[8]
    let modWheel = am[9] || am[10] || am[11]
    let fc1 = am[12] || am[13] || am[14] || am[15]
    let bc = am[16] || am[17] || am[18] || am[19] != 0x32
    let at = am[20] || am[21] || am[22] || am[23] != 0x32
    let pitchEgScl = am[24]
    let fc2 = am[26] || am[27] || am[28] || am[29]
    let mc = am[30] || am[31] || am[32] || am[33]
    let unisonDetune = am[34] & 0b0000111
    let fccs1 = (am[34] & 0b0001000) >> 3

    return [
      fks && 'Fract. scaling',
      ams && 'AM sens.',
      rndp && 'Random pitch',
      vpsw && 'Pitch EG vel. sens.',
      ltrg && 'Multi LFO',
      pegr && 'Pitch EG range',
      pitchEgScl && 'Pitch EG scl. rate',
      mono && 'Monophonic',
      unison && 'Unison poly',
      unisonDetune && 'Unison detune',
      portamento && 'Portamento',
      pitchBend && 'Pitch B. params',
      modWheel && 'Mod W. params',
      fc1 && 'FC1 params',
      fc2 && 'FC2 params',
      bc && 'BC params',
      at && 'AT params',
      mc && 'MIDI in 1 params',
      fccs1 && 'FC1 as CS1',
    ].filter(Boolean) as string[]
  }
}

const DEFAULT_VMEM = hex2bin('63 63 63 63 63 63 63 00 27 00 00 00 38 00 00 02 00 63 63 63 63 63 63 63 00 27 00 00 00 38 00 00 02 00 63 63 63 63 63 63 63 00 27 00 00 00 38 00 00 02 00 63 63 63 63 63 63 63 00 27 00 00 00 38 00 00 02 00 63 63 63 63 63 63 63 00 27 00 00 00 38 00 00 02 00 63 63 63 63 63 63 63 00 27 00 00 00 38 00 63 02 00 63 63 63 63 32 32 32 32 00 08 23 00 00 00 31 18 49 4E 49 54 20 56 4F 49 43 45')
const DEFAULT_AMEM = hex2bin('00 00 00 00 00 08 00 00 00 00 00 00 00 00 00 00 00 00 00 32 00 00 00 32 00 00 00 00 00 00 00 00 00 00 00')
const DEFAULT_FKS = hex2bin('03 76 4C 4D 20 20 46 4B 53 59 43 20 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 3F 73')

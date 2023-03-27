import { calcChecksum, dataMatches, hex2bin, mergeUint8Arrays as mergeUint8Arrays, uint8ArraysEqual } from 'core/utils/binUtils'

/**
 * A DX7II microtuning. Only one per SysEx.
 */
export class DX7Microtuning {
  slot: 0 | 1
  mctData: Uint8Array

  private constructor() {
    this.slot = 0
    this.mctData = DEFAULT_MCT_DATA.slice(0)
  }

  static createEmpty(): DX7Microtuning {
    return new DX7Microtuning()
  }

  static createFromSyx(data: Uint8Array): DX7Microtuning | undefined {
    if (data.length != 274) return undefined
    if (!dataMatches(MCT_HEADER1, data, 0) && !dataMatches(MCT_HEADER2, data, 0)) return undefined

    let cart = new DX7Microtuning()
    cart.slot = dataMatches(MCT_HEADER1, data, 0) ? 0 : 1

    return cart
  }

  clone(): DX7Microtuning {
    let cart = new DX7Microtuning()
    cart.mctData = this.mctData.slice(0)
    cart.slot = this.slot
    return cart
  }

  setSlot(slot: 0 | 1): DX7Microtuning {
    this.slot = slot
    return this
  }

  buildSysex(): Uint8Array {
    let dataArr = [
      this.slot == 0 ? MCT_HEADER1 : MCT_HEADER2,
      this.mctData,
      new Uint8Array([ 0 /* checksum placeholder */, 0xF7 /* end of sysex block */ ])
    ]

    let mctSysex = mergeUint8Arrays(dataArr)
    // Oddly enough, the checksum starts at "LM  ", while FKS data checksum starts two bytes earlier,
    // where the length of the block's data is written, which is also what the manual implies.
    mctSysex[mctSysex.length - 2] = calcChecksum(mctSysex, 6, -2)
    return mctSysex
  }
}


const MCT_HEADER1 = hex2bin('F0 43 00 7E 02 0A 4C 4D 20 20 4D 43 52 59 4D 00')
const MCT_HEADER2 = hex2bin('F0 43 00 7E 02 0A 4C 4D 20 20 4D 43 52 59 4D 01')
const DEFAULT_MCT_DATA = hex2bin('00 00 00 00 00 3E 01 13 01 69 02 3F 03 14 03 6B 04 41 05 17 05 6E 06 44 07 1A 07 71 08 46 09 1C 09 73 0A 48 0B 1E 0B 74 0C 4A 0D 1F 0D 76 0E 4B 0F 20 0F 77 10 4C 11 22 11 78 12 4D 13 23 13 7A 14 4F 15 24 15 7B 16 50 17 25 17 7C 18 51 19 27 19 7E 1A 52 1B 28 1B 7E 1C 54 1D 29 1D 7E 1E 54 1F 2B 1F 7E 20 54 21 2A 22 01 22 54 23 2A 24 00 24 56 25 2A 25 7F 26 56 27 2C 28 00 28 55 29 2C 2A 02 2A 56 2B 2C 2C 01 2C 58 2D 2B 2E 00 2E 57 2F 2E 30 02 30 57 31 2D 32 04 32 57 33 2D 34 02 34 59 35 2D 36 02 36 58 37 2E 38 04 38 59 39 2F 3A 06 3A 5A 3B 2F 3C 06 3C 5B 3D 31 3E 05 3E 5C 3F 32 40 08 40 5E 41 32 42 09 42 5E 43 33 44 09 44 5F 45 34 46 0B 46 60 47 35 48 0B 48 62 49 36 4A 0D 4A 62 4B 37 4C 0E 4C 63 4D 39 4E 0F 4E 65 4F 3B 50 12 50 68 51 3C 52 13 52 69 53 3F 54 17')

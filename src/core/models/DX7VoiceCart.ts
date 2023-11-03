import { calcChecksum, cut, dataMatchesN6, hex2bin, mergeUint8Arrays } from 'core/utils/binUtils'
import { DX7Voice } from './DX7Voice'

/**
 * A collection of DX7/DX7II voices. Parses SysEx into voices, if possible.
 */
export class DX7VoiceCart {
  bank: 0 | 1
  voices: DX7Voice[]

  private constructor() {
    this.voices = Array(32)
    this.bank = 0
  }

  static createEmpty(): DX7VoiceCart {
    let cart = new DX7VoiceCart()

    for (let i = 0; i < 32; i++) {
      cart.voices[i] = new DX7Voice()
    }

    return cart
  }

  static createFromSyx(data: Uint8Array): DX7VoiceCart | undefined {
    if (this.isDX7Cart(data)) {
      let cart = new DX7VoiceCart()

      for (let i = 0; i < 32; i++) {
        cart.voices[i] = new DX7Voice(cut(data, VMEM_HEADER.length + 128 * i, 128))
      }

      return cart
    } else if (this.isDX7IICart(data)) {
      let cart = new DX7VoiceCart()

      if (dataMatchesN6(DX7II_HEADER_2, data, 0)) cart.bank = 1

      for (let i = 0; i < 32; i++) {
        cart.voices[i] = new DX7Voice(
          cut(data, 17300 + VMEM_HEADER.length + 128 * i, 128),
          cut(data, 16172 + AMEM_HEADER.length + 35 * i, 35),
          cut(data, 7 + FKS_HEADER.length + 505 * i, 505), // 2B size + 502B data + 1B checksum
        )
      }

      return cart
    } else if (this.isPartialDX7IICart(data)) {
      let cart = new DX7VoiceCart()
      let offset = 0

      if (data.length == 5239) {
        offset = 7
        if (dataMatchesN6(DX7II_HEADER_2, data)) cart.bank = 1
      }

      for (let i = 0; i < 32; i++) {
        cart.voices[i] = new DX7Voice(
          cut(data, offset + 1128 + VMEM_HEADER.length + 128 * i, 128),
          cut(data, offset + AMEM_HEADER.length + 35 * i, 35),
        )
      }

      return cart
    }

    return undefined
  }

  clone(): DX7VoiceCart {
    let cart = new DX7VoiceCart()
    cart.bank = this.bank
    cart.voices = this.voices
    return cart
  }

  setBank(bank: 0 | 1): DX7VoiceCart {
    this.bank = bank
    return this
  }

  insertVoiceAt(newVoice: DX7Voice, index: number): DX7VoiceCart {
    if (this.voices.includes(newVoice)) { // just move the sound within the cart
      let oldVoice = newVoice
      newVoice = oldVoice.clone()

      this.voices = this.voices.slice(0, index).concat(newVoice, this.voices.slice(index))
        .filter(v => v != oldVoice)
    } else { // insert and discard the last sound
      this.voices = this.voices.slice(0, index).concat(newVoice.clone(), this.voices.slice(index, 31))
    }

    return this
  }

  replaceVoiceAt(newVoice: DX7Voice, index: number): DX7VoiceCart {
    this.voices = this.voices.map((voice, i) => {
      return index === i ? newVoice.clone() : voice
    })

    return this
  }

  replaceVoice(oldVoice: DX7Voice, newVoice: DX7Voice): DX7VoiceCart {
    this.voices = this.voices.map((voice) => {
      return voice == oldVoice ? newVoice : voice
    })

    return this
  }

  buildCartDX7(): Uint8Array {
    let dataArr = this.voices.map(patch => patch.vmemData)
    dataArr.unshift(VMEM_HEADER)
    dataArr.push(new Uint8Array([ 0 /* checksum placeholder */, 0xF7 /* end of sysex block */ ]))

    let vmemData = mergeUint8Arrays(dataArr)
    vmemData[vmemData.length - 2] = calcChecksum(vmemData, VMEM_HEADER.length, -2)
    return vmemData
  }

  buildCartDX7II(): Uint8Array {
    let dataArr: Uint8Array[] = []

    dataArr.push(this.bank == 1 ? DX7II_HEADER_2 : DX7II_HEADER_1)

    let fksData: Uint8Array = mergeUint8Arrays([
      FKS_HEADER,
      ...(this.voices.map(patch => patch.fksData)),
      new Uint8Array([ 0xF7 ]),
    ])

    dataArr.push(fksData)

    let amemData = mergeUint8Arrays([
      AMEM_HEADER,
      ...(this.voices.map(patch => patch.amemData)),
      new Uint8Array([ 0 /* checksum placeholder */, 0xF7 /* end of sysex block */ ]),
    ])

    amemData[amemData.length - 2] = calcChecksum(amemData, AMEM_HEADER.length, -2)

    dataArr.push(amemData)

    let vmemData = this.buildCartDX7()

    dataArr.push(vmemData)

    return mergeUint8Arrays(dataArr)
  }

  private static isDX7Cart(data: Uint8Array): boolean {
    if (data.length != 4104) return false
    if (!dataMatchesN6(VMEM_HEADER, data, 0)) return false

    return true
  }

  private static isDX7IICart(data: Uint8Array): boolean {
    if (data.length != 21404) return false
    if (!dataMatchesN6(DX7II_HEADER_1, data, 0) && !dataMatchesN6(DX7II_HEADER_2, data, 0)) return false

    if (!dataMatchesN6(FKS_HEADER, data, 7)) return false
    if (!dataMatchesN6(AMEM_HEADER, data, 16172)) return false
    if (!dataMatchesN6(VMEM_HEADER, data, 17300)) return false

    return true
  }

  /** Just AMEM and VMEM, used by DXconvert */
  private static isPartialDX7IICart(data: Uint8Array): boolean {
    if (data.length == 5239) { // bank header + AMEM + VMEM
      if (!dataMatchesN6(DX7II_HEADER_1, data, 0) && !dataMatchesN6(DX7II_HEADER_2, data, 0)) return false
      if (!dataMatchesN6(AMEM_HEADER, data, 7)) return false
      if (!dataMatchesN6(VMEM_HEADER, data, 7 + 1128)) return false
      return true
    } else if (data.length == 5232) { // AMEM + VMEM
      if (!dataMatchesN6(AMEM_HEADER, data, 0)) return false
      if (!dataMatchesN6(VMEM_HEADER, data, 1128)) return false
      return true
    } else {
      return false
    }
  }
}

const DX7II_HEADER_1 = hex2bin('F0 43 10 19 4D 00 F7')
const DX7II_HEADER_2 = hex2bin('F0 43 10 19 4D 01 F7')
const VMEM_HEADER = hex2bin('F0 43 00 09 20 00')
const AMEM_HEADER = hex2bin('F0 43 00 06 08 60')
const FKS_HEADER = hex2bin('F0 43 00 7E')

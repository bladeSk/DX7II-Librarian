import React from 'react'
import { MIDIContext } from '../MIDIProvider/MIDIProvider'
import { hex2bin, mergeUint8Arrays, dataMatchesN6 } from 'core/utils/binUtils'

export interface Props {
  className?: string
  onSysExReceived: (data: Uint8Array) => void
}

interface State {
}

/**
 * Listens for SysEx messages and forwards them. Merges DX7II SysEx voice sequences into one buffer
 * to match the .syx files format.
 */
export default class SysExReceiver extends React.PureComponent<Props, State> {
  private lastMidiInput?: WebMidi.MIDIInput
  private voiceCartBuffer: Uint8Array[] = []
  private voiceCartRecvTimeout?: number

  constructor(props: Props) {
    super(props)

    this.state = {
    }
  }

  // componentDidMount(): void {
  //   exportSysExListenerTests(this.handleReceiveMidiData)
  // }

  componentWillUnmount(): void {
    this.lastMidiInput?.removeEventListener('midimessage', this.handleReceiveMidiData as any /* bad typings */)
  }

  render(): React.ReactElement {
    return <MIDIContext.Consumer>{(midiCtx) => {
      this.checkMidiDevChanged(midiCtx.inputDevice)
      return null
    }}</MIDIContext.Consumer>
  }

  private checkMidiDevChanged(midiInput?: WebMidi.MIDIInput) {
    if (midiInput == this.lastMidiInput) return

    this.lastMidiInput?.removeEventListener('midimessage', this.handleReceiveMidiData as any /* bad typings */)
    midiInput?.addEventListener('midimessage', this.handleReceiveMidiData)

    this.lastMidiInput = midiInput
  }

  private handleReceiveMidiData = (e: WebMidi.MIDIMessageEvent) => {
    if (e.data.length < 2) return
    if (e.data[0] != 0xf0) return

    if (dataMatchesN6(DX7II_HEADER_1, e.data) || dataMatchesN6(DX7II_HEADER_2, e.data)) {
      console.log('Receiving DX7II voice cart, expecting 2-3 more parts')

      if (this.voiceCartRecvTimeout) clearTimeout(this.voiceCartRecvTimeout)
      this.voiceCartRecvTimeout = undefined
      this.voiceCartBuffer = []

      this.bufferVoiceCartData(e.data)
      return
    } else if (this.voiceCartBuffer.length) {
      console.log('Receiving next part')
      this.bufferVoiceCartData(e.data)
      return
    }

    this.props.onSysExReceived(e.data)
  }

  private bufferVoiceCartData(data: Uint8Array) {
    if (this.voiceCartRecvTimeout) {
      clearTimeout(this.voiceCartRecvTimeout)
      this.voiceCartRecvTimeout = undefined
    }

    this.voiceCartBuffer.push(data)

    let totalLen = this.voiceCartBuffer.reduce((sum, buf) => sum + buf.length, 0)

    if (totalLen == 21404) {
      console.log('Received all parts of a DX7II voice cart')

      this.props.onSysExReceived(mergeUint8Arrays(this.voiceCartBuffer))
      this.voiceCartBuffer = []
    } else if (totalLen == 5239) {
      console.log('Received all parts of a partial DX7II voice cart')

      this.props.onSysExReceived(mergeUint8Arrays(this.voiceCartBuffer))
      this.voiceCartBuffer = []
    } else {
      this.voiceCartRecvTimeout = setTimeout(() => {
        console.log('Didn\'t receive full DX7II voice cart in time, aborting')

        this.voiceCartRecvTimeout = undefined
        this.voiceCartBuffer = []
      }, 8000)
    }
  }
}

const DX7II_HEADER_1 = hex2bin('F0 43 10 19 4D 00 F7')
const DX7II_HEADER_2 = hex2bin('F0 43 10 19 4D 01 F7')

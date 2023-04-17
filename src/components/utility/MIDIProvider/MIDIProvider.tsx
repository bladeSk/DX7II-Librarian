import React from 'react'
import { handleError } from 'core/utils/errorHandling'

export interface Props {
  children?: React.ReactNode
}

interface State {
  midi?: WebMidi.MIDIAccess
  inputDevice?: WebMidi.MIDIInput
  outputDevice?: WebMidi.MIDIOutput
  sendingData: boolean
}

export interface MIDIContextData {
  midi?: WebMidi.MIDIAccess
  inputDevice?: WebMidi.MIDIInput
  outputDevice?: WebMidi.MIDIOutput
  sendingData: boolean
  setInputDevice: (deviceId: string) => void
  setOutputDevice: (deviceId: string) => void
  sendData: (buf: Uint8Array) => Promise<void>
  sendDataSequence: (callback: sendDataSeqCallback) => Promise<void>
}

export type sendDataSeqCallback = (send: (buf: Uint8Array) => void) => Promise<void>

export const MIDIContext = React.createContext<MIDIContextData>({} as any)
MIDIContext.displayName = 'MIDIContext'

/**
 * Provides access to WebMIDI interface and triggers changes using React context.
 * Does not actually render anything.
 */
export default class MIDIProvider extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      sendingData: false,
    }
  }

  componentDidMount(): void {
    if (!navigator.requestMIDIAccess) {
      return
    }

    navigator.requestMIDIAccess({ sysex: true }).then((midi) => {
      this.setState({ midi }, () => {
        if (localStorage['dx7iilr-inputDevice']) this.setInputDevice(localStorage['dx7iilr-inputDevice'])
        if (localStorage['dx7iilr-outputDevice']) this.setOutputDevice(localStorage['dx7iilr-outputDevice'])
      })

      midi.addEventListener('statechange', this.onMidiStateChanged)
    }).catch((err) => {
      if (err?.message?.match('break through the security policy')) {
        handleError(new Error('Your browser has blocked access to MIDI devices.\nPlease reset the permissions by clicking on the padlock in the address bar and going to Site Settings.'))
        return
      }

      handleError(err)
    })
  }

  componentWillUnmount(): void {
    this.state.midi?.removeEventListener('statechange', this.onMidiStateChanged)
  }

  render(): React.ReactElement {
    return <MIDIContext.Provider value={{
      midi: this.state.midi,
      inputDevice: this.state.inputDevice,
      outputDevice: this.state.outputDevice,
      sendingData: this.state.sendingData,
      setInputDevice: this.setInputDevice,
      setOutputDevice: this.setOutputDevice,
      sendData: this.sendData,
      sendDataSequence: this.sendDataSequence,
    }}>{this.props.children}</MIDIContext.Provider>
  }

  private setInputDevice = (deviceId: string) => {
    localStorage.setItem('dx7iilr-inputDevice', deviceId)

    this.setState({
      inputDevice: this.state.midi?.inputs.get(deviceId),
    })
  }

  private setOutputDevice = (deviceId: string) => {
    localStorage.setItem('dx7iilr-outputDevice', deviceId)

    this.setState({
      outputDevice: this.state.midi?.outputs.get(deviceId),
    })
  }

  private sendData = async (buf: Uint8Array): Promise<void> => {
    if (!this.state.outputDevice) throw new Error('No output MIDI device selected.')

    this.setState({ sendingData: true })

    try {
      this.state.outputDevice.send(buf)
    } catch(err) {
      this.setState({ sendingData: false })
      throw err
    }

    // Fake timeout - WebMIDI API doesn't have events to tell when the sending is finished, unfortunately,
    // so we approximate how long the sending takes - roughly bytes * 0.36 milliseconds.
    let fakeTimeoutMs = Math.round(Math.max(1000, buf.length * 0.36))
    await new Promise(res => setTimeout(res, fakeTimeoutMs))

    this.setState({ sendingData: false })
  }

  private sendDataSequence = async (execSequence: sendDataSeqCallback): Promise<void> => {
    if (!this.state.outputDevice) throw new Error('No output MIDI device selected.')

    this.setState({ sendingData: true })

    try {
      await execSequence((buf: Uint8Array) => {
        this.state.outputDevice?.send(buf)
      })
    } finally {
      this.setState({ sendingData: false })
    }
  }

  private onMidiStateChanged = (e: any) => {
    this.setState({}) // force re-render and refresh the context
  }
}

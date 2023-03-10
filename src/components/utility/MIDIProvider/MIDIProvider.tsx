import React from 'react'
import { handleError } from 'core/utils/errorHandling'

export interface Props {
  children?: React.ReactNode
}

interface State {
  midi?: WebMidi.MIDIAccess
  inputDevice?: WebMidi.MIDIInput
  outputDevice?: WebMidi.MIDIOutput
}

export interface MIDIContextData {
  midi?: WebMidi.MIDIAccess
  inputDevice?: WebMidi.MIDIInput
  outputDevice?: WebMidi.MIDIOutput
  setInputDevice: (deviceId: string) => void
  setOutputDevice: (deviceId: string) => void
  sendData: (buf: Uint8Array) => void
}

export const MIDIContext = React.createContext<MIDIContextData>({} as any)
MIDIContext.displayName = 'MIDIContext'

/**
 * Provides access to WebMIDI interface and triggers changes using React context.
 * Does not actually render anything.
 */
export default class MIDIProvider extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {}
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
    }).catch(handleError)
  }

  componentWillUnmount(): void {
    this.state.midi?.removeEventListener('statechange', this.onMidiStateChanged)
  }

  render(): React.ReactElement {
    return <MIDIContext.Provider value={{
      midi: this.state.midi,
      inputDevice: this.state.inputDevice,
      outputDevice: this.state.outputDevice,
      setInputDevice: this.setInputDevice,
      setOutputDevice: this.setOutputDevice,
      sendData: this.sendData,
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

  private sendData = (buf: Uint8Array): void => {
    if (!this.state.outputDevice) throw new Error('No output MIDI device selected.')
    return this.state.outputDevice.send(buf)
  }

  private onMidiStateChanged = (e: any) => {
    this.setState({}) // force re-render and refresh the context
  }
}

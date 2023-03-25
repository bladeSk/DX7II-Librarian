import React from 'react'
import clsx from 'clsx'
import { MIDIContext } from 'components/utility/MIDIProvider/MIDIProvider'
import MidiPortSvg from 'assets/icons/midi-port.svg'
import './MIDISelector.scss'

export interface Props {
  className?: string
}

interface State {
}

/**
 * Allows selecting MIDI I/O devices.
 */
export default class MIDISelector extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {}
  }

  render(): React.ReactElement {
    return <div className={clsx('MIDISelector', this.props.className)}>
      <MIDIContext.Consumer>{(midiCtx) => {
        if (!midiCtx.midi) return <>
          <div title="Allow MIDI access to send or receive data from your DX7">
            <MidiPortSvg className="MIDISelector__icon" />
          </div>
          Can't access MIDI devices
        </>

        let inputs = Array.from(midiCtx.midi.inputs.entries() || [])
        let outputs = Array.from(midiCtx.midi.outputs.entries() || [])

        let iconTooltip = "No device selected"

        if (midiCtx.inputDevice?.id && midiCtx.outputDevice?.id) {
          iconTooltip = "Ready to send or receive DX7 SysEx data"
        } else if (midiCtx.inputDevice?.id) {
          iconTooltip = "Ready to receive DX7 SysEx data"
        } else if (midiCtx.outputDevice?.id) {
          iconTooltip = "Ready to send SysEx data to DX7"
        }

        return <>
          <div title={iconTooltip}>
            <MidiPortSvg className="MIDISelector__icon" />
          </div>

          <div className="MIDISelector__devices">
            <div className="MIDISelector__device">
              <label>MIDI input</label>

              <select
                placeholder="Select a device..."
                value={midiCtx.inputDevice?.id}
                onChange={e => midiCtx.setInputDevice(e.target.value)}
                disabled={!inputs.length}
              >
                <option value="">{inputs.length ? 'None' : 'No devices connected'}</option>

                {inputs.map(([id, dev], i) => <option key={i} value={id}>
                  {dev.name || dev.id}
                </option>)}
              </select>
            </div>

            <div className="MIDISelector__device">
              <label>MIDI output</label>

              <select
                placeholder="Select a device..."
                value={midiCtx.outputDevice?.id}
                onChange={e => midiCtx.setOutputDevice(e.target.value)}
                disabled={!outputs.length}
              >
                <option value="">{outputs.length ? 'None' : 'No devices connected'}</option>

                {outputs.map(([id, dev], i) => <option key={i} value={id}>
                  {dev.name || dev.id}
                </option>)}
              </select>
            </div>
          </div>
        </>
      }}</MIDIContext.Consumer>
    </div>
  }
}

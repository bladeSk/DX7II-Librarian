import React from 'react'
import clsx from 'clsx'
import { MIDIContext } from 'components/utility/MIDIProvider/MIDIProvider'
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
        if (!midiCtx.midi) return "Can't access MIDI devices"

        let inputs = Array.from(midiCtx.midi.inputs.entries() ||[])
        let outputs = Array.from(midiCtx.midi.outputs.entries() ||[])

        return <>
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
        </>
      }}</MIDIContext.Consumer>
    </div>
  }
}
